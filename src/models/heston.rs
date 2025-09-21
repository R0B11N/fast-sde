// src/models/heston.rs
//! Heston Stochastic Volatility Model Implementation
//!
//! # Mathematical Framework
//!
//! The Heston model describes asset price evolution with stochastic volatility:
//! ```text
//! dS_t = r S_t dt + √V_t S_t dW_t^(1)
//! dV_t = κ(θ - V_t) dt + ξ√V_t dW_t^(2)
//! ```
//!
//! Where:
//! - S_t: Asset price
//! - V_t: Instantaneous variance (volatility squared)
//! - κ: Mean reversion speed for variance
//! - θ: Long-term variance level
//! - ξ: Volatility of variance (vol-of-vol)
//! - ρ: Correlation between dW_t^(1) and dW_t^(2)
//!
//! # Feller Condition
//!
//! For variance to remain positive, the Feller condition must hold:
//! ```text
//! 2κθ > ξ²
//! ```
//!
//! When violated, variance can hit zero, requiring careful numerical treatment.
//!
//! # Discretization Schemes
//!
//! Three schemes are implemented with different stability/accuracy tradeoffs:
//! 1. **Andersen QE**: Most robust, handles Feller violations gracefully
//! 2. **Alfonsi**: High-order weak convergence, good for smooth payoffs  
//! 3. **Full Truncation Euler**: Fastest but can be unstable

use super::model::SDEModel;
use crate::error::{validation::*, SdeError, SdeResult};
use crate::rng;
use rand::Rng;
use std::f64;

#[derive(Clone, Copy, Debug)]
pub enum HestonScheme {
    FullTruncationEuler,
    AndersenQE,
    Alfonsi,
}

#[derive(Clone, Copy, Debug)]
pub struct HestonParams {
    pub s0: f64,    // Initial stock price
    pub v0: f64,    // Initial variance
    pub r: f64,     // Risk-free rate
    pub kappa: f64, // Mean reversion speed
    pub theta: f64, // Long-term variance
    pub xi: f64,    // Volatility of variance (vol-of-vol)
    pub rho: f64,   // Correlation between stock and variance
}

pub struct Heston {
    pub params: HestonParams,
    pub scheme: HestonScheme,
}

impl Heston {
    pub fn new(params: HestonParams) -> SdeResult<Self> {
        Self::new_with_scheme(params, HestonScheme::AndersenQE)
    }

    pub fn new_with_scheme(params: HestonParams, scheme: HestonScheme) -> SdeResult<Self> {
        Self::new_with_scheme_quiet(params, scheme, false)
    }

    pub fn new_with_scheme_quiet(
        params: HestonParams,
        scheme: HestonScheme,
        suppress_warnings: bool,
    ) -> SdeResult<Self> {
        // Validate all parameters
        Self::validate_params(&params)?;

        // Check Feller condition
        let feller = 2.0 * params.kappa * params.theta;
        if feller <= params.xi * params.xi {
            if !suppress_warnings {
                eprintln!("WARNING!: Feller condition violated (2κθ ≤ ξ²). Variance may hit zero.");
            }
            // For strict validation, uncomment the next line:
            // return Err(SdeError::FellerConditionViolation { kappa: params.kappa, theta: params.theta, xi: params.xi, feller_value: feller });
        }

        Ok(Heston { params, scheme })
    }

    /// Validate Heston parameters
    fn validate_params(params: &HestonParams) -> SdeResult<()> {
        validate_positive("s0", params.s0)?;
        validate_non_negative("v0", params.v0)?;
        validate_finite("r", params.r)?;
        validate_positive("kappa", params.kappa)?;
        validate_positive("theta", params.theta)?;
        validate_positive("xi", params.xi)?;
        validate_correlation("rho", params.rho)?;

        // Additional business logic validations
        if params.kappa > 100.0 {
            return Err(SdeError::InvalidParameters {
                parameter: "kappa".to_string(),
                value: params.kappa,
                constraint: "extremely high mean reversion speed (>100) may cause numerical issues"
                    .to_string(),
            });
        }

        if params.xi > 5.0 {
            return Err(SdeError::InvalidParameters {
                parameter: "xi".to_string(),
                value: params.xi,
                constraint: "extremely high vol-of-vol (>5) may cause numerical issues".to_string(),
            });
        }

        if params.theta > 1.0 {
            return Err(SdeError::InvalidParameters {
                parameter: "theta".to_string(),
                value: params.theta,
                constraint: "long-term variance >1 (100% vol) is unrealistic".to_string(),
            });
        }

        Ok(())
    }

    /// Two-factor step: updates both stock price and variance
    pub fn step<R: Rng + ?Sized>(
        &self,
        s: &mut f64,
        v: &mut f64,
        dt: f64,
        rng: &mut R,
    ) -> SdeResult<()> {
        let z1 = rng::get_normal_draw(rng);
        let z2 = rng::get_normal_draw(rng);

        // Generate correlated Brownian increments
        let dw_s = z1;
        let dw_v = self.params.rho * z1 + (1.0 - self.params.rho * self.params.rho).sqrt() * z2;

        // Validate inputs
        if !dt.is_finite() || dt <= 0.0 {
            return Err(SdeError::InvalidParameters {
                parameter: "dt".to_string(),
                value: dt,
                constraint: "must be positive and finite".to_string(),
            });
        }

        if !s.is_finite() || *s <= 0.0 {
            return Err(SdeError::NumericalInstability {
                method: "Heston step".to_string(),
                reason: format!("stock price is invalid: {}", s),
            });
        }

        if !v.is_finite() || *v < 0.0 {
            return Err(SdeError::NumericalInstability {
                method: "Heston step".to_string(),
                reason: format!("variance is invalid: {}", v),
            });
        }

        match self.scheme {
            HestonScheme::FullTruncationEuler => {
                self.step_full_truncation_euler(s, v, dt, dw_s, dw_v)?;
            }
            HestonScheme::AndersenQE => {
                self.step_andersen_qe(s, v, dt, dw_s, dw_v, rng)?;
            }
            HestonScheme::Alfonsi => {
                self.step_alfonsi(s, v, dt, dw_s, dw_v)?;
            }
        }

        // Validate outputs
        if !s.is_finite() || *s <= 0.0 {
            return Err(SdeError::NumericalInstability {
                method: format!("Heston {}", self.scheme_name()),
                reason: format!("stock price became invalid after step: {}", s),
            });
        }

        if !v.is_finite() || *v < 0.0 {
            return Err(SdeError::NumericalInstability {
                method: format!("Heston {}", self.scheme_name()),
                reason: format!("variance became invalid after step: {}", v),
            });
        }

        Ok(())
    }

    /// Full Truncation Euler (FTE) scheme
    ///
    /// # Mathematical Description
    ///
    /// Simple Euler-Maruyama discretization with variance truncation:
    /// ```text
    /// V_{n+1} = max(0, V_n + κ(θ - V_n)Δt + ξ√V_n ΔW_v)
    /// S_{n+1} = S_n * exp(r*Δt + √V_n ΔW_s)
    /// ```
    ///
    /// # Characteristics
    /// - **Speed**: Fastest scheme (single step per time increment)
    /// - **Stability**: Can be unstable when Feller condition violated
    /// - **Accuracy**: First-order weak convergence
    /// - **Use case**: When speed matters more than robustness
    fn step_full_truncation_euler(
        &self,
        s: &mut f64,
        v: &mut f64,
        dt: f64,
        dw_s: f64,
        dw_v: f64,
    ) -> SdeResult<()> {
        let sqrt_dt = dt.sqrt();
        let sqrt_v = if *v > 0.0 { v.sqrt() } else { 0.0 };

        // Update variance first
        let dv = self.params.kappa * (self.params.theta - *v) * dt
            + self.params.xi * sqrt_v * sqrt_dt * dw_v;
        *v = (*v + dv).max(0.0); // Full truncation

        // Update stock price using current variance
        let ds_over_s = self.params.r * dt + sqrt_v * sqrt_dt * dw_s;
        *s *= ds_over_s.exp();

        Ok(())
    }

    /// Andersen's Quadratic Exponential (QE) scheme
    ///
    /// # Mathematical Description
    ///
    /// Robust scheme that handles Feller condition violations gracefully.
    /// Uses moment matching to preserve the first two moments of V_t.
    ///
    /// ## Variance Evolution
    /// ```text
    /// m = θ + (V_n - θ)e^(-κΔt)           // First moment
    /// s² = V_n*ξ²*e^(-κΔt)/κ*(1-e^(-κΔt)) + θ*ξ²/(2κ)*(1-e^(-κΔt))²  // Second moment
    /// ψ = s²/m²                           // Scaled variance
    /// ```
    ///
    /// ## Conditional Distribution
    /// - If ψ ≤ ψ_c: Use quadratic approximation (chi-squared-like)
    /// - If ψ > ψ_c: Use exponential approximation (prevents explosion)
    ///
    /// ## Stock Price Update
    /// Includes martingale correction terms to ensure risk-neutral drift.
    ///
    /// # Characteristics
    /// - **Robustness**: Handles Feller violations without instability
    /// - **Accuracy**: Preserves key distributional properties
    /// - **Industry standard**: Widely used in practice
    /// - **Speed**: Moderate (requires moment calculations)
    fn step_andersen_qe<R: Rng + ?Sized>(
        &self,
        s: &mut f64,
        v: &mut f64,
        dt: f64,
        dw_s: f64,
        dw_v: f64,
        rng: &mut R,
    ) -> SdeResult<()> {
        let _sqrt_dt = dt.sqrt();

        // QE scheme for variance
        let m = self.params.theta + (*v - self.params.theta) * (-self.params.kappa * dt).exp();
        let s2 = *v * self.params.xi * self.params.xi * (-self.params.kappa * dt).exp()
            / self.params.kappa
            * (1.0 - (-self.params.kappa * dt).exp())
            + self.params.theta * self.params.xi * self.params.xi / (2.0 * self.params.kappa)
                * (1.0 - (-self.params.kappa * dt).exp()).powi(2);

        let psi = s2 / (m * m);
        let psi_c = 1.5; // Critical value

        let v_next = if psi <= psi_c {
            // Use quadratic approximation
            let b2 = 2.0 / psi - 1.0 + (2.0 / psi * (2.0 / psi - 1.0)).sqrt();
            let a = m / (1.0 + b2);
            a * (dw_v.abs().sqrt() + b2.sqrt()).powi(2)
        } else {
            // Use exponential approximation
            let p = (psi - 1.0) / (psi + 1.0);
            let beta = (1.0 - p) / m;

            let u: f64 = rng.gen(); // Uniform random variable
            if u <= p {
                0.0
            } else {
                (1.0 - p) / beta * (u - p) / (1.0 - p)
            }
        }
        .max(0.0); // Ensure non-negative

        // Update stock price with martingale correction
        let k0 = -self.params.rho * self.params.kappa * self.params.theta / self.params.xi * dt;
        let k1 = 0.5 * dt * (self.params.kappa * self.params.rho / self.params.xi - 0.5)
            - self.params.rho / self.params.xi;
        let k2 = 0.5 * dt * (self.params.kappa * self.params.rho / self.params.xi - 0.5)
            + self.params.rho / self.params.xi;
        let k3 = 0.5 * dt * (1.0 - self.params.rho * self.params.rho);

        let ds_over_s =
            self.params.r * dt + k0 + k1 * *v + k2 * v_next + v.max(0.0).sqrt() * k3.sqrt() * dw_s;

        *s = (*s * ds_over_s.exp()).max(1e-10); // Ensure positive stock price
        *v = v_next;

        Ok(())
    }

    /// Alfonsi scheme for high-order weak convergence
    ///
    /// # Mathematical Description
    ///
    /// Enhanced Euler scheme with higher-order correction terms:
    /// ```text
    /// V_aux = V_n + κ(θ - V_n)Δt + ξ√V_n ΔW_v
    /// V_{n+1} = max(0, V_aux + correction_term)
    /// ```
    ///
    /// Where the correction term involves:
    /// ```text
    /// correction = γ*ξ²*Δt*(1/√V_aux - 1/√V_n)*(ΔW_v² - Δt)/(2√Δt)
    /// ```
    ///
    /// # Characteristics
    /// - **Accuracy**: Higher-order weak convergence than Euler
    /// - **Stability**: Better than FTE, not as robust as QE
    /// - **Performance**: Slightly slower than FTE due to correction terms
    /// - **Use case**: When accuracy is critical and Feller condition holds
    fn step_alfonsi(
        &self,
        s: &mut f64,
        v: &mut f64,
        dt: f64,
        dw_s: f64,
        dw_v: f64,
    ) -> SdeResult<()> {
        let sqrt_dt = dt.sqrt();

        // Alfonsi's improved scheme for variance
        let gamma = 0.5; // Alfonsi parameter
        let k = self.params.kappa;
        let theta = self.params.theta;
        let xi = self.params.xi;

        // First, compute auxiliary process
        let v_aux = *v + k * (theta - *v) * dt + xi * v.sqrt() * sqrt_dt * dw_v;
        let v_aux_pos = v_aux.max(0.0);

        // Alfonsi correction
        let correction = if *v > 0.0 && v_aux > 0.0 {
            gamma * xi * xi * dt * (1.0 / v_aux_pos.sqrt() - 1.0 / v.sqrt()) * (dw_v * dw_v - dt)
                / (2.0 * sqrt_dt)
        } else {
            0.0
        };

        *v = (v_aux + correction).max(0.0);

        // Update stock price
        let sqrt_v_avg = if *v > 0.0 {
            (v.sqrt() + (*v).sqrt()) / 2.0
        } else {
            0.0
        };
        let ds_over_s = self.params.r * dt + sqrt_v_avg * sqrt_dt * dw_s;
        *s *= ds_over_s.exp();

        Ok(())
    }

    /// Get current scheme name for reporting
    pub fn scheme_name(&self) -> &'static str {
        match self.scheme {
            HestonScheme::FullTruncationEuler => "Full Truncation Euler",
            HestonScheme::AndersenQE => "Andersen QE",
            HestonScheme::Alfonsi => "Alfonsi",
        }
    }
}

impl SDEModel for Heston {
    // For the generic SDEModel trait, we focus on the stock price dynamics
    // This is a simplified 1D view of the 2D Heston system
    fn drift(&self, s: f64, _t: f64) -> f64 {
        self.params.r * s
    }

    fn diffusion(&self, s: f64, _t: f64) -> f64 {
        // Use initial variance as approximation for generic interface
        self.params.v0.sqrt() * s
    }

    fn diffusion_derivative(&self, _s: f64, _t: f64) -> f64 {
        self.params.v0.sqrt()
    }

    fn step_with_dw(&self, s_current: &mut f64, t_current: f64, dt: f64, dw: f64) {
        // Simplified 1D step using initial variance
        *s_current +=
            self.drift(*s_current, t_current) * dt + self.diffusion(*s_current, t_current) * dw;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::StdRng;
    use rand::SeedableRng;

    #[test]
    fn test_heston_schemes() {
        let params = HestonParams {
            s0: 100.0,
            v0: 0.04,
            r: 0.05,
            kappa: 2.0,
            theta: 0.04,
            xi: 0.3,
            rho: -0.5,
        };

        let schemes = [
            HestonScheme::FullTruncationEuler,
            HestonScheme::AndersenQE,
            HestonScheme::Alfonsi,
        ];

        for scheme in &schemes {
            let heston = Heston::new_with_scheme(params, *scheme).expect("Valid parameters");
            let mut rng = StdRng::seed_from_u64(42);

            let mut s = params.s0;
            let mut v = params.v0;

            // Run a few steps
            for _ in 0..100 {
                heston
                    .step(&mut s, &mut v, 0.01, &mut rng)
                    .expect("Step should succeed");
                assert!(s > 0.0, "Stock price must remain positive");
                assert!(v >= 0.0, "Variance must be non-negative");
            }

            println!(
                "Scheme {}: S_T = {:.4}, V_T = {:.6}",
                heston.scheme_name(),
                s,
                v
            );
        }
    }

    #[test]
    fn test_feller_condition() {
        let params = HestonParams {
            s0: 100.0,
            v0: 0.04,
            r: 0.05,
            kappa: 1.0, // Low kappa
            theta: 0.04,
            xi: 1.0, // High xi - violates Feller condition
            rho: 0.0,
        };

        // Should create without panic but with warning
        let _heston = Heston::new(params).expect("Should create despite Feller violation");
    }

    #[test]
    fn test_invalid_parameters() {
        // Test negative volatility
        let bad_params = HestonParams {
            s0: 100.0,
            v0: 0.04,
            r: 0.05,
            kappa: 2.0,
            theta: 0.04,
            xi: -0.3, // Negative vol-of-vol
            rho: -0.5,
        };

        assert!(Heston::new(bad_params).is_err());

        // Test invalid correlation
        let bad_params2 = HestonParams {
            s0: 100.0,
            v0: 0.04,
            r: 0.05,
            kappa: 2.0,
            theta: 0.04,
            xi: 0.3,
            rho: 1.5, // Invalid correlation
        };

        assert!(Heston::new(bad_params2).is_err());

        // Test negative stock price
        let bad_params3 = HestonParams {
            s0: -100.0, // Negative stock price
            v0: 0.04,
            r: 0.05,
            kappa: 2.0,
            theta: 0.04,
            xi: 0.3,
            rho: -0.5,
        };

        assert!(Heston::new(bad_params3).is_err());
    }
}
