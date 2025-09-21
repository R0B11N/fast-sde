// src/mc/mc_engine.rs
use crate::analytics::bs_analytic;
use crate::error::{validation::*, SdeError, SdeResult};
use crate::mc::payoffs::Payoff;
use crate::rng;
use bitflags::bitflags;
use rayon::prelude::*;
use std::f64;

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct GreeksConfig: u32 {
        const NONE  = 0;
        const DELTA = 1 << 0;
        const VEGA  = 1 << 1;
        const RHO   = 1 << 2;
        const GAMMA = 1 << 3;
    }
}

#[derive(Clone)]
pub struct McConfig {
    pub paths: usize,
    pub steps: usize,
    pub s0: f64,
    pub r: f64,
    pub sigma: f64,
    pub t: f64,
    pub use_antithetic: bool,
    pub use_control_variate: bool,
    pub seed: u64,
    pub payoff: Payoff,
    pub greeks: GreeksConfig,
    pub epsilon: Option<f64>, // For finite difference Greeks (default: 1e-3 * s0)
}

impl McConfig {
    /// Validate the Monte Carlo configuration
    pub fn validate(&self) -> SdeResult<()> {
        validate_paths(self.paths)?;
        validate_steps(self.steps)?;
        validate_positive("s0", self.s0)?;
        validate_finite("r", self.r)?;
        validate_positive("sigma", self.sigma)?;
        validate_positive("t", self.t)?;

        if let Some(eps) = self.epsilon {
            validate_positive("epsilon", eps)?;
            if eps > self.s0 * 0.1 {
                return Err(SdeError::InvalidParameters {
                    parameter: "epsilon".to_string(),
                    value: eps,
                    constraint: format!("should be much smaller than spot price ({})", self.s0),
                });
            }
        }

        Ok(())
    }
}

impl Default for McConfig {
    fn default() -> Self {
        McConfig {
            paths: 1_000_000,
            steps: 1,
            s0: 100.0,
            r: 0.01,
            sigma: 0.2,
            t: 1.0,
            use_antithetic: true,
            use_control_variate: true,
            seed: 12345,
            payoff: Payoff::EuropeanCall { k: 100.0 },
            greeks: GreeksConfig::NONE,
            epsilon: None,
        }
    }
}

/// Monte Carlo pricing for options under Geometric Brownian Motion
///
/// # Math Framework
///
/// Simulates the GBM SDE:
/// ```text
/// dS_t = r S_t dt + σ S_t dW_t
/// ```
///
/// With exact solution:
/// ```text
/// S_T = S_0 * exp((r - σ²/2)T + σ√T * Z)
/// ```
/// where Z ~ N(0,1).
///
/// # Variance Reduction Techniques
///
/// 1. **Antithetic Variates**: For each path with normal draw Z, also simulate
///    path with -Z and average the payoffs. Reduces variance for smooth payoffs.
///
/// 2. **Control Variates**: Uses European call as control with known expectation.
///    Estimator: Y - b(X - E\[X\]) where:
///    - Y = target payoff (e.g., Asian call)  
///    - X = control payoff (European call)
///    - b = Cov(Y,X)/Var(X) (optimal coefficient)
///
/// # Returns
///
/// Returns `(price, variance_estimate)` where:
/// - `price`: Discounted expected payoff
/// - `variance_estimate`: Sample variance of the estimator (for confidence intervals)
///
/// # Errors
///
/// Returns `SdeError` for:
/// - Invalid configuration parameters
/// - Numerical instability (negative variance, non-finite results)
pub fn mc_price_option_gbm(cfg: &McConfig) -> SdeResult<(f64, f64)> {
    // Validate configuration
    cfg.validate()?;
    let n = cfg.paths;
    let dt = cfg.t / cfg.steps as f64;
    let sqrt_dt = dt.sqrt();
    let discount = (-cfg.r * cfg.t).exp();

    let (
        sum_payoff_path,
        sum_control_path,
        sum_payoff_times_control_path,
        sum_control_sq_path,
        sum_european_analytic_price_path,
        sum_payoff_sq_path,
    ) = (0..n)
        .into_par_iter()
        .map(|i| {
            let mut rng = rng::seed_rng_from_u64(cfg.seed + i as u64);

            // Generate asset price path using exact GBM solution
            // S_{t+dt} = S_t * exp((r - σ²/2)dt + σ√dt * Z_t)
            // where Z_t ~ N(0,1) are independent normal draws
            let mut path_prices = Vec::with_capacity(cfg.steps + 1);
            path_prices.push(cfg.s0);

            let mut current_s = cfg.s0;
            for _ in 0..cfg.steps {
                let z = rng::get_normal_draw(&mut rng);
                // Apply exact GBM step: drift + diffusion
                current_s *=
                    ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * dt + cfg.sigma * sqrt_dt * z).exp();
                path_prices.push(current_s);
            }
            
            // Calculate the payoff for this path
            let payoff_raw = cfg.payoff.calculate(&path_prices);
            
            // Control Variate Setup
            // For variance reduction, we use a control variate with known expectation
            let mut control_var_raw = 0.0;
            let mut european_analytic_price = 0.0;

            match cfg.payoff {
                Payoff::EuropeanCall { k } => {
                    // For European calls, the control is itself (perfect control)
                    control_var_raw = Payoff::EuropeanCall { k }.calculate(&path_prices);
                    european_analytic_price =
                        bs_analytic::bs_call_price(cfg.s0, k, cfg.r, cfg.sigma, cfg.t);
                }
                Payoff::AsianCall { k } => {
                    // For Asian calls, use European call on terminal price as control
                    // Theory: Both depend on final price, providing positive correlation
                    let st_final = *path_prices.last().unwrap();
                    control_var_raw = Payoff::EuropeanCall { k }.calculate(&vec![st_final]);
                    european_analytic_price =
                        bs_analytic::bs_call_price(cfg.s0, k, cfg.r, cfg.sigma, cfg.t);
                }
                _ => {
                    // For barrier and other exotic options, control variates are more complex
                    // Future enhancement: implement specific controls for each payoff type
                }
            }

            let mut payoff_path = payoff_raw;
            let mut control_var_path = control_var_raw;

            // Antithetic Variates Implementation
            // Generate second path with negated normal draws for variance reduction
            if cfg.use_antithetic {
                let mut path_prices2 = Vec::with_capacity(cfg.steps + 1);
                path_prices2.push(cfg.s0);

                let mut current_s2 = cfg.s0;
                for _ in 0..cfg.steps {
                    // Use -Z instead of Z for antithetic path
                    // Theory: E[f(Z) + f(-Z)]/2 has lower variance than E[f(Z)] for symmetric f
                    let z2 = -rng::get_normal_draw(&mut rng);
                    current_s2 *= ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * dt
                        + cfg.sigma * sqrt_dt * z2)
                        .exp();
                    path_prices2.push(current_s2);
                }
                
                let payoff2_raw = cfg.payoff.calculate(&path_prices2);
                
                let mut control_var2_raw = 0.0;
                match cfg.payoff {
                    Payoff::EuropeanCall { k } => {
                        control_var2_raw = Payoff::EuropeanCall { k }.calculate(&path_prices2);
                    }
                    Payoff::AsianCall { k } => {
                        let st2_final = *path_prices2.last().unwrap();
                        control_var2_raw = Payoff::EuropeanCall { k }.calculate(&vec![st2_final]);
                    }
                    _ => {}
                }
                
                // Average the original and antithetic payoffs
                // This is the antithetic variate estimator: (Y₁ + Y₂)/2
                payoff_path = 0.5 * (payoff_raw + payoff2_raw);
                control_var_path = 0.5 * (control_var_raw + control_var2_raw);
            }

            (
                payoff_path,
                control_var_path,
                payoff_path * control_var_path,
                control_var_path * control_var_path,
                european_analytic_price,
                payoff_path * payoff_path,
            )
        })
        .reduce(
            || (0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
            |a, b| {
                (
                    a.0 + b.0,
                    a.1 + b.1,
                    a.2 + b.2,
                    a.3 + b.3,
                    a.4 + b.4,
                    a.5 + b.5,
                )
            },
        );

    // Compute sample statistics for control variate method
    let mean_payoff = sum_payoff_path / n as f64;
    let mean_control = sum_control_path / n as f64;
    let mean_payoff_times_control = sum_payoff_times_control_path / n as f64;
    let mean_control_sq = sum_control_sq_path / n as f64;
    let mean_european_analytic_price = sum_european_analytic_price_path / n as f64;
    let mean_payoff_sq = sum_payoff_sq_path / n as f64;

    let estimated_price;
    let mut variance_of_estimate;

    // Control Variate Method Implementation
    // Estimator: Y - b(X - E[X]) where b minimizes variance
    if cfg.use_control_variate {
        // Optimal control variate coefficient: b* = Cov(Y,X) / Var(X)
        // This minimizes Var(Y - b(X - E[X]))
        let cov_payoff_control = mean_payoff_times_control - mean_payoff * mean_control;
        let var_control = mean_control_sq - mean_control * mean_control;

        // Avoid division by zero if control has no variance
        let b = if var_control > 1e-10 {
            cov_payoff_control / var_control
        } else {
            0.0
        };

        let controlled_payoffs_sum = (0..n)
            .into_par_iter()
            .map(|i| {
                let mut rng = rng::seed_rng_from_u64(cfg.seed + i as u64);
                let mut path_prices = Vec::with_capacity(cfg.steps + 1);
                path_prices.push(cfg.s0);

                let mut current_s = cfg.s0;
                for _ in 0..cfg.steps {
                    let z = rng::get_normal_draw(&mut rng);
                    current_s *= ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * dt
                        + cfg.sigma * sqrt_dt * z)
                        .exp();
                    path_prices.push(current_s);
                }

                let payoff_raw = cfg.payoff.calculate(&path_prices);
                
                let mut control_var_raw = 0.0;
                match cfg.payoff {
                    Payoff::EuropeanCall { k } => {
                        control_var_raw = Payoff::EuropeanCall { k }.calculate(&path_prices);
                    }
                    Payoff::AsianCall { k } => {
                        let st_final = *path_prices.last().unwrap();
                        control_var_raw = Payoff::EuropeanCall { k }.calculate(&vec![st_final]);
                    }
                    _ => {}
                }

                let mut payoff_path = payoff_raw;
                let mut control_var_path = control_var_raw;

                if cfg.use_antithetic {
                    let mut path_prices2 = Vec::with_capacity(cfg.steps + 1);
                    path_prices2.push(cfg.s0);

                    let mut current_s2 = cfg.s0;
                    for _ in 0..cfg.steps {
                        let z2 = -rng::get_normal_draw(&mut rng);
                        current_s2 *= ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * dt
                            + cfg.sigma * sqrt_dt * z2)
                            .exp();
                        path_prices2.push(current_s2);
                    }

                    let payoff2_raw = cfg.payoff.calculate(&path_prices2);
                    
                    let mut control_var2_raw = 0.0;
                    match cfg.payoff {
                        Payoff::EuropeanCall { k } => {
                            control_var2_raw = Payoff::EuropeanCall { k }.calculate(&path_prices2);
                        }
                        Payoff::AsianCall { k } => {
                            let st2_final = *path_prices2.last().unwrap();
                            control_var2_raw =
                                Payoff::EuropeanCall { k }.calculate(&vec![st2_final]);
                        }
                        _ => {}
                    }
                    payoff_path = 0.5 * (payoff_raw + payoff2_raw);
                    control_var_path = 0.5 * (control_var_raw + control_var2_raw);
                }

                discount * (payoff_path - b * (control_var_path - mean_european_analytic_price))
            })
            .sum::<f64>();
        
        let mean_controlled_payoff = controlled_payoffs_sum / n as f64;
        let sum_controlled_payoff_sq = (0..n)
            .into_par_iter()
            .map(|i| {
                let mut rng = rng::seed_rng_from_u64(cfg.seed + i as u64);
                let mut path_prices = Vec::with_capacity(cfg.steps + 1);
                path_prices.push(cfg.s0);

                let mut current_s = cfg.s0;
                for _ in 0..cfg.steps {
                    let z = rng::get_normal_draw(&mut rng);
                    current_s *= ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * dt
                        + cfg.sigma * sqrt_dt * z)
                        .exp();
                    path_prices.push(current_s);
                }

                let payoff_raw = cfg.payoff.calculate(&path_prices);
                
                let mut control_var_raw = 0.0;
                match cfg.payoff {
                    Payoff::EuropeanCall { k } => {
                        control_var_raw = Payoff::EuropeanCall { k }.calculate(&path_prices);
                    }
                    Payoff::AsianCall { k } => {
                        let st_final = *path_prices.last().unwrap();
                        control_var_raw = Payoff::EuropeanCall { k }.calculate(&vec![st_final]);
                    }
                    _ => {}
                }

                let mut payoff_path = payoff_raw;
                let mut control_var_path = control_var_raw;

                if cfg.use_antithetic {
                    let mut path_prices2 = Vec::with_capacity(cfg.steps + 1);
                    path_prices2.push(cfg.s0);

                    let mut current_s2 = cfg.s0;
                    for _ in 0..cfg.steps {
                        let z2 = -rng::get_normal_draw(&mut rng);
                        current_s2 *= ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * dt
                            + cfg.sigma * sqrt_dt * z2)
                            .exp();
                        path_prices2.push(current_s2);
                    }

                    let payoff2_raw = cfg.payoff.calculate(&path_prices2);
                    
                    let mut control_var2_raw = 0.0;
                    match cfg.payoff {
                        Payoff::EuropeanCall { k } => {
                            control_var2_raw = Payoff::EuropeanCall { k }.calculate(&path_prices2);
                        }
                        Payoff::AsianCall { k } => {
                            let st2_final = *path_prices2.last().unwrap();
                            control_var2_raw =
                                Payoff::EuropeanCall { k }.calculate(&vec![st2_final]);
                        }
                        _ => {}
                    }
                    payoff_path = 0.5 * (payoff_raw + payoff2_raw);
                    control_var_path = 0.5 * (control_var_raw + control_var2_raw);
                }

                let controlled_payoff = discount
                    * (payoff_path - b * (control_var_path - mean_european_analytic_price));
                controlled_payoff * controlled_payoff
            })
            .sum::<f64>()
            / n as f64;

        estimated_price = mean_controlled_payoff;
        variance_of_estimate = (sum_controlled_payoff_sq
            - mean_controlled_payoff * mean_controlled_payoff)
            / (n as f64 * (n as f64 - 1.0));

        // Handle numerical precision issues that can cause negative variance
        if variance_of_estimate < 0.0 {
            if variance_of_estimate > -1e-10 {
                // Small negative due to floating point precision - set to zero
                variance_of_estimate = 0.0;
            } else {
                return Err(SdeError::NumericalInstability {
                    method: "Control Variate Monte Carlo".to_string(),
                    reason: format!(
                        "Variance estimate became significantly negative: {}",
                        variance_of_estimate
                    ),
                });
            }
        }
    } else {
        estimated_price = discount * mean_payoff;
        variance_of_estimate = (mean_payoff_sq - mean_payoff * mean_payoff) * discount.powi(2)
            / (n as f64 * (n as f64 - 1.0));

        // Handle numerical precision issues for regular MC too
        if variance_of_estimate < 0.0 {
            if variance_of_estimate > -1e-10 {
                variance_of_estimate = 0.0;
            } else {
                return Err(SdeError::NumericalInstability {
                    method: "Monte Carlo".to_string(),
                    reason: format!(
                        "Variance estimate became significantly negative: {}",
                        variance_of_estimate
                    ),
                });
            }
        }
    }

    // Final validation of results
    if !estimated_price.is_finite() {
        return Err(SdeError::NumericalInstability {
            method: "Monte Carlo".to_string(),
            reason: format!("Price estimate is not finite: {}", estimated_price),
        });
    }

    if !variance_of_estimate.is_finite() {
        return Err(SdeError::NumericalInstability {
            method: "Monte Carlo".to_string(),
            reason: format!("Variance estimate is not finite: {}", variance_of_estimate),
        });
    }

    Ok((estimated_price, variance_of_estimate))
}

/// Monte Carlo Delta calculation using pathwise derivative method
///
/// # Mathematical Framework
///
/// For European call under GBM, the pathwise derivative is:
/// ```text
/// ∂/∂S₀ max(S_T - K, 0) = 1_{S_T > K} * ∂S_T/∂S₀
/// ```
///
/// Where:
/// - `1_{S_T > K}` is the indicator function (1 if in-the-money, 0 otherwise)
/// - `∂S_T/∂S₀ = S_T/S₀` for the exact GBM solution
///
/// # Algorithm
///
/// 1. Simulate terminal stock price: S_T = S₀ * exp((r - σ²/2)T + σ√T * Z)
/// 2. Compute pathwise delta: δ_path = 1_{S_T > K} * S_T/S₀  
/// 3. Apply discount factor: Δ = e^(-rT) * E\[δ_path\]
///
/// # Accuracy
///
/// Pathwise method provides unbiased estimates for smooth payoffs.
/// Typical relative error: < 0.1% with sufficient paths.
pub fn mc_delta_european_call_gbm_pathwise(cfg: &McConfig) -> f64 {
    let n = cfg.paths;
    let discount = (-cfg.r * cfg.t).exp();

    let k = match cfg.payoff {
        Payoff::EuropeanCall { k } => k,
        _ => {
            return 0.0;
        }
    };

    (0..n)
        .into_par_iter()
        .map(|i| {
            let mut rng = rng::seed_rng_from_u64(cfg.seed + i as u64);
            let z = rng::get_normal_draw(&mut rng);

            let st = cfg.s0
                * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * cfg.t.sqrt() * z)
                    .exp();
            
            let mut delta_path = 0.0;
            if st > k {
                delta_path = st / cfg.s0;
            }

            if cfg.use_antithetic {
                let z2 = -z;
                let st2 = cfg.s0
                    * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t
                        + cfg.sigma * cfg.t.sqrt() * z2)
                        .exp();
                let mut delta_path2 = 0.0;
                if st2 > k {
                    delta_path2 = st2 / cfg.s0;
                }
                delta_path = 0.5 * (delta_path + delta_path2);
            }
            delta_path
        })
        .reduce(|| 0.0, |a, b| a + b)
        / n as f64
        * discount
}

/// Monte Carlo Vega calculation using pathwise derivative method
///
/// # Mathematical Framework
///
/// For European call under GBM, the pathwise derivative w.r.t. volatility σ is:
/// ```text
/// ∂/∂σ max(S_T - K, 0) = 1_{S_T > K} * ∂S_T/∂σ
/// ```
///
/// Where:
/// ```text
/// ∂S_T/∂σ = S_T * (-σT + W_T)
/// ```
/// and W_T is the Brownian motion at time T.
///
/// # Algorithm
///
/// 1. Simulate: S_T = S₀ * exp((r - σ²/2)T + σW_T) with W_T = √T * Z
/// 2. Compute: ∂S_T/∂σ = S_T * (-σT + W_T)
/// 3. Pathwise vega: ν_path = 1_{S_T > K} * ∂S_T/∂σ
/// 4. Apply discount: ν = e^(-rT) * E\[ν_path\]
///
/// # Note
///
/// For single-step European options, W_T = √T * Z where Z ~ N(0,1).
pub fn mc_vega_european_call_gbm_pathwise(cfg: &McConfig) -> f64 {
    let n = cfg.paths;
    let discount = (-cfg.r * cfg.t).exp();
    let sqrt_t = cfg.t.sqrt();

    let k = match cfg.payoff {
        Payoff::EuropeanCall { k } => k,
        _ => {
            return 0.0;
        }
    };

    // For single-step European option, we accumulate W_T directly
    (0..n)
        .into_par_iter()
        .map(|i| {
            let mut rng = rng::seed_rng_from_u64(cfg.seed + i as u64);
            let z = rng::get_normal_draw(&mut rng);
            let w_t = sqrt_t * z; // W_T = sqrt(T) * Z where Z ~ N(0,1)

            let st =
                cfg.s0 * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * w_t).exp();

            let mut vega_path = 0.0;
            if st > k {
                // dS_T/dsigma = S_T * (-sigma * T + W_T)
                let ds_dsigma = st * (-cfg.sigma * cfg.t + w_t);
                vega_path = ds_dsigma;
            }

            if cfg.use_antithetic {
                let z2 = -z;
                let w_t2 = sqrt_t * z2;
                let st2 = cfg.s0
                    * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * w_t2).exp();

                let mut vega_path2 = 0.0;
                if st2 > k {
                    let ds_dsigma2 = st2 * (-cfg.sigma * cfg.t + w_t2);
                    vega_path2 = ds_dsigma2;
                }
                vega_path = 0.5 * (vega_path + vega_path2);
            }
            vega_path
        })
        .reduce(|| 0.0, |a, b| a + b)
        / n as f64
        * discount
}

/// Monte Carlo Rho calculation using pathwise derivative method
///
/// # Mathematical Framework
///
/// For European call, Rho is the derivative w.r.t. risk-free rate r:
/// ```text
/// ∂/∂r [e^(-rT) * max(S_T - K, 0)] = ∂/∂r [e^(-rT)] * payoff + e^(-rT) * ∂payoff/∂r
/// ```
///
/// This gives:
/// ```text
/// ρ = -T * e^(-rT) * payoff + e^(-rT) * 1_{S_T > K} * ∂S_T/∂r
/// ```
///
/// Where:
/// ```text
/// ∂S_T/∂r = S_T * T  (from the drift term in GBM)
/// ```
///
/// # Algorithm
///
/// 1. Simulate terminal price S_T
/// 2. Compute payoff and indicator function
/// 3. Apply Rho formula: ρ_path = -T * payoff + 1_{S_T > K} * S_T * T
/// 4. Discount: ρ = e^(-rT) * E\[ρ_path\]
pub fn mc_rho_european_call_gbm_pathwise(cfg: &McConfig) -> f64 {
    let n = cfg.paths;
    let discount = (-cfg.r * cfg.t).exp();
    let sqrt_t = cfg.t.sqrt();

    let k = match cfg.payoff {
        Payoff::EuropeanCall { k } => k,
        _ => {
            return 0.0;
        }
    };

    (0..n)
        .into_par_iter()
        .map(|i| {
            let mut rng = rng::seed_rng_from_u64(cfg.seed + i as u64);
            let z = rng::get_normal_draw(&mut rng);

            let st = cfg.s0
                * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * sqrt_t * z).exp();

            let payoff = (st - k).max(0.0);
            let indicator = if st > k { 1.0 } else { 0.0 };

            // Rho = -T * e^(-rT) * payoff + e^(-rT) * indicator * dS_T/dr
            // where dS_T/dr = S_T * T
            let ds_dr = st * cfg.t;
            let mut rho_path = -cfg.t * payoff + indicator * ds_dr;

            if cfg.use_antithetic {
                let z2 = -z;
                let st2 = cfg.s0
                    * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * sqrt_t * z2)
                        .exp();

                let payoff2 = (st2 - k).max(0.0);
                let indicator2 = if st2 > k { 1.0 } else { 0.0 };
                let ds_dr2 = st2 * cfg.t;
                let rho_path2 = -cfg.t * payoff2 + indicator2 * ds_dr2;

                rho_path = 0.5 * (rho_path + rho_path2);
            }
            rho_path
        })
        .reduce(|| 0.0, |a, b| a + b)
        / n as f64
        * discount
}

/// Monte Carlo Gamma calculation using central finite difference
///
/// # Mathematical Framework
///
/// Gamma (Γ) is the second derivative of option price w.r.t. underlying price:
/// ```text
/// Γ = ∂²V/∂S₀²
/// ```
///
/// Since pathwise Gamma has issues with discontinuous payoffs (kink at S_T = K),
/// we use central finite difference on Delta:
/// ```text
/// Γ ≈ [Δ(S₀ + ε) - Δ(S₀ - ε)] / (2ε)
/// ```
///
/// # Algorithm
///
/// 1. Compute Delta at S₀ + ε using pathwise method
/// 2. Compute Delta at S₀ - ε using same random seeds (common random numbers)
/// 3. Apply central difference formula
///
/// # Parameters
///
/// - Default ε = 0.1% of spot price (balances bias vs. variance)
/// - Uses same RNG seeds for variance reduction
///
/// # Note
///
/// This is a simple implementation. The batched version below is more efficient
/// as it uses common random numbers within a single parallel loop.
pub fn mc_gamma_european_call_gbm_finite_diff(cfg: &McConfig) -> f64 {
    // Use provided epsilon or default to 1e-3 * s0
    let epsilon = cfg.epsilon.unwrap_or(1e-3 * cfg.s0);

    // Create configs for spot up and spot down
    let mut cfg_up = cfg.clone();
    cfg_up.s0 = cfg.s0 + epsilon;

    let mut cfg_down = cfg.clone();
    cfg_down.s0 = cfg.s0 - epsilon;

    // Compute Delta at both spot levels using the same seed for common random numbers
    let delta_up = mc_delta_european_call_gbm_pathwise(&cfg_up);
    let delta_down = mc_delta_european_call_gbm_pathwise(&cfg_down);

    // Central finite difference for Gamma
    (delta_up - delta_down) / (2.0 * epsilon)
}

/// Efficient batched Gamma calculation with common random numbers
///
/// # Mathematical Framework
///
/// Same as simple finite difference but optimized for performance:
/// ```text
/// Γ ≈ [Δ(S₀ + ε) - Δ(S₀ - ε)] / (2ε)
/// ```
///
/// # Optimization Strategy
///
/// Instead of calling Delta function twice, this implementation:
/// 1. Uses single parallel loop over paths
/// 2. Applies same random draw Z to both (S₀ + ε) and (S₀ - ε) scenarios
/// 3. Computes both deltas simultaneously for maximum variance reduction
///
/// # Common Random Numbers
///
/// Critical for variance reduction: same Brownian path used for both
/// spot scenarios ensures that:
/// ```text
/// Var[Δ(S₀ + ε) - Δ(S₀ - ε)] << Var[Δ(S₀ + ε)] + Var[Δ(S₀ - ε)]
/// ```
///
/// # Performance
///
/// ~2x faster than calling Delta function separately due to:
/// - Single RNG initialization per path
/// - Better cache locality
/// - Reduced parallel overhead
pub fn mc_gamma_european_call_gbm_finite_diff_batched(cfg: &McConfig) -> f64 {
    let n = cfg.paths;
    let discount = (-cfg.r * cfg.t).exp();
    let sqrt_t = cfg.t.sqrt();

    let k = match cfg.payoff {
        Payoff::EuropeanCall { k } => k,
        _ => {
            return 0.0;
        }
    };

    // Use provided epsilon or default to 1e-3 * s0
    let epsilon = cfg.epsilon.unwrap_or(1e-3 * cfg.s0);
    let s0_up = cfg.s0 + epsilon;
    let s0_down = cfg.s0 - epsilon;

    // Compute deltas for both spot scenarios using common random numbers
    let (sum_delta_up, sum_delta_down) = (0..n)
        .into_par_iter()
        .map(|i| {
            // Use the same RNG seed for both scenarios to ensure common random numbers
            let mut rng = rng::seed_rng_from_u64(cfg.seed + i as u64);
            let z = rng::get_normal_draw(&mut rng);

            // Compute terminal stock prices for both spot scenarios
            let st_up = s0_up
                * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * sqrt_t * z).exp();
            let st_down = s0_down
                * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * sqrt_t * z).exp();

            // Pathwise delta for spot up
            let delta_up = if st_up > k { st_up / s0_up } else { 0.0 };

            // Pathwise delta for spot down
            let delta_down = if st_down > k { st_down / s0_down } else { 0.0 };

            if cfg.use_antithetic {
                let z2 = -z;

                let st_up2 = s0_up
                    * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * sqrt_t * z2)
                        .exp();
                let st_down2 = s0_down
                    * ((cfg.r - 0.5 * cfg.sigma * cfg.sigma) * cfg.t + cfg.sigma * sqrt_t * z2)
                        .exp();

                let delta_up2 = if st_up2 > k { st_up2 / s0_up } else { 0.0 };
                let delta_down2 = if st_down2 > k {
                    st_down2 / s0_down
                } else {
                    0.0
                };

                (
                    0.5 * (delta_up + delta_up2),
                    0.5 * (delta_down + delta_down2),
                )
            } else {
                (delta_up, delta_down)
            }
        })
        .reduce(|| (0.0, 0.0), |a, b| (a.0 + b.0, a.1 + b.1));

    let mean_delta_up = sum_delta_up / n as f64 * discount;
    let mean_delta_down = sum_delta_down / n as f64 * discount;

    // Central finite difference for Gamma
    (mean_delta_up - mean_delta_down) / (2.0 * epsilon)
}
