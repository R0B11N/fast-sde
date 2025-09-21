// examples/heston_calibration.rs
use fast_sde::analytics::bs_analytic;
use fast_sde::models::heston::{Heston, HestonParams, HestonScheme};
use fast_sde::rng::RngFactory;
use std::f64;

/// Market data point for calibration
#[derive(Debug, Clone)]
pub struct MarketPoint {
    pub strike: f64,
    pub time_to_expiry: f64,
    pub implied_vol: f64,
    pub market_price: f64,
}

/// Simplified Heston calibration using least squares
pub struct HestonCalibrator {
    pub spot: f64,
    pub rate: f64,
    pub market_data: Vec<MarketPoint>,
}

impl HestonCalibrator {
    pub fn new(spot: f64, rate: f64, market_data: Vec<MarketPoint>) -> Self {
        Self {
            spot,
            rate,
            market_data,
        }
    }

    /// Check if parameters satisfy Feller condition and other constraints
    fn is_valid_params(params: &HestonParams) -> bool {
        // Feller condition: 2κθ > ξ²
        let feller_condition = 2.0 * params.kappa * params.theta > params.xi * params.xi;

        // Basic parameter bounds
        let bounds_ok = params.kappa > 0.0
            && params.theta > 0.0
            && params.xi > 0.0
            && params.v0 > 0.0
            && params.rho >= -1.0
            && params.rho <= 1.0;

        feller_condition && bounds_ok
    }

    /// Monte Carlo price for Heston model
    fn mc_price(
        &self,
        params: &HestonParams,
        strike: f64,
        time_to_expiry: f64,
        paths: usize,
    ) -> f64 {
        // Return high error if parameters are invalid
        if !Self::is_valid_params(params) {
            return 1e6; // Large error to discourage invalid parameters
        }

        let heston = match Heston::new_with_scheme_quiet(*params, HestonScheme::AndersenQE, true) {
            Ok(h) => h,
            Err(_) => return 1e6, // Return high error for invalid parameters
        };
        let rng_factory = RngFactory::new(12345);
        let dt = time_to_expiry / 50.0; // Weekly steps for faster calibration
        let steps = 50;

        let mut total_payoff = 0.0;

        for i in 0..paths {
            let mut rng = rng_factory.create_std_rng(i as u64);
            let mut s = params.s0;
            let mut v = params.v0;

            for _ in 0..steps {
                if heston.step(&mut s, &mut v, dt, &mut rng).is_err() {
                    return 1e6; // Return high error for numerical instability
                }
            }

            let payoff = (s - strike).max(0.0);
            total_payoff += payoff;
        }

        let discount = (-self.rate * time_to_expiry).exp();
        discount * total_payoff / paths as f64
    }

    /// Objective function for calibration (sum of squared errors)
    fn objective(&self, params: &HestonParams) -> f64 {
        let mut error = 0.0;

        for point in &self.market_data {
            let model_price = self.mc_price(params, point.strike, point.time_to_expiry, 10_000);
            let market_price = point.market_price;
            let diff = model_price - market_price;
            error += diff * diff;
        }

        error
    }

    /// Simple grid search calibration (for demonstration)
    pub fn calibrate_simple(&self) -> HestonParams {
        let mut best_params = HestonParams {
            s0: self.spot,
            v0: 0.04,
            r: self.rate,
            kappa: 2.0,
            theta: 0.04,
            xi: 0.3,
            rho: -0.5,
        };

        let mut best_error = f64::INFINITY;

        println!("Starting Heston calibration...");
        println!("Market data points: {}", self.market_data.len());

        // Grid search over key parameters (ensuring Feller condition: 2κθ > ξ²)
        let kappa_range = [1.0, 2.0, 3.0, 4.0, 5.0];
        let theta_range = [0.02, 0.04, 0.06, 0.08, 0.10];
        let xi_range = [0.1, 0.15, 0.2, 0.25, 0.3]; // Reduced to avoid Feller violations
        let rho_range = [-0.8, -0.6, -0.4, -0.2, 0.0];

        let total_combinations =
            kappa_range.len() * theta_range.len() * xi_range.len() * rho_range.len();
        let mut combination = 0;

        for &kappa in &kappa_range {
            for &theta in &theta_range {
                for &xi in &xi_range {
                    for &rho in &rho_range {
                        combination += 1;

                        let params = HestonParams {
                            s0: self.spot,
                            v0: theta, // Start v0 close to theta
                            r: self.rate,
                            kappa,
                            theta,
                            xi,
                            rho,
                        };

                        let error = self.objective(&params);

                        if error < best_error {
                            best_error = error;
                            best_params = params;
                        }

                        if combination % 20 == 0 {
                            println!(
                                "Progress: {}/{} combinations, best error: {:.6}",
                                combination, total_combinations, best_error
                            );
                        }
                    }
                }
            }
        }

        println!("Calibration complete!");
        println!("Best error (MSE): {:.6}", best_error);
        println!("Best parameters:");
        println!("  κ (kappa): {:.4}", best_params.kappa);
        println!("  θ (theta): {:.4}", best_params.theta);
        println!("  ξ (xi):    {:.4}", best_params.xi);
        println!("  ρ (rho):   {:.4}", best_params.rho);
        println!("  v0:        {:.4}", best_params.v0);

        best_params
    }
}

fn main() {
    println!("Heston Model Calibration Example");
    println!("=================================\n");

    // Market parameters
    let spot = 100.0;
    let rate = 0.05;

    // Synthetic market data (normally this would come from market quotes)
    let market_data = vec![
        MarketPoint {
            strike: 90.0,
            time_to_expiry: 0.25,
            implied_vol: 0.22,
            market_price: bs_analytic::bs_call_price(spot, 90.0, rate, 0.22, 0.25),
        },
        MarketPoint {
            strike: 100.0,
            time_to_expiry: 0.25,
            implied_vol: 0.20,
            market_price: bs_analytic::bs_call_price(spot, 100.0, rate, 0.20, 0.25),
        },
        MarketPoint {
            strike: 110.0,
            time_to_expiry: 0.25,
            implied_vol: 0.23,
            market_price: bs_analytic::bs_call_price(spot, 110.0, rate, 0.23, 0.25),
        },
        MarketPoint {
            strike: 95.0,
            time_to_expiry: 1.0,
            implied_vol: 0.21,
            market_price: bs_analytic::bs_call_price(spot, 95.0, rate, 0.21, 1.0),
        },
        MarketPoint {
            strike: 105.0,
            time_to_expiry: 1.0,
            implied_vol: 0.24,
            market_price: bs_analytic::bs_call_price(spot, 105.0, rate, 0.24, 1.0),
        },
    ];

    println!("Market Data:");
    for (i, point) in market_data.iter().enumerate() {
        println!(
            "  {}: K={}, T={}, σ_impl={:.3}, Price={:.4}",
            i + 1,
            point.strike,
            point.time_to_expiry,
            point.implied_vol,
            point.market_price
        );
    }
    println!();

    // Create calibrator and run calibration
    let calibrator = HestonCalibrator::new(spot, rate, market_data);
    let calibrated_params = calibrator.calibrate_simple();

    // Test the calibrated model
    println!("\nValidation:");
    println!("Testing calibrated model against market data...");

    for (i, point) in calibrator.market_data.iter().enumerate() {
        let model_price = calibrator.mc_price(
            &calibrated_params,
            point.strike,
            point.time_to_expiry,
            50_000,
        );
        let error = ((model_price - point.market_price) / point.market_price * 100.0).abs();

        println!(
            "  Point {}: Market={:.4}, Model={:.4}, Error={:.2}%",
            i + 1,
            point.market_price,
            model_price,
            error
        );
    }

    // Compare different Heston schemes
    println!("\nScheme Comparison:");
    let schemes = [
        (HestonScheme::AndersenQE, "Andersen QE"),
        (HestonScheme::Alfonsi, "Alfonsi"),
        (HestonScheme::FullTruncationEuler, "Full Truncation Euler"),
    ];

    for (scheme, name) in &schemes {
        let params_with_scheme = calibrated_params;
        let _heston = Heston::new_with_scheme(params_with_scheme, *scheme)
            .expect("Parameters should be valid");

        // Price a single option with each scheme
        let test_price = calibrator.mc_price(&params_with_scheme, 100.0, 1.0, 25_000);
        println!("  {}: Price = {:.4}", name, test_price);
    }

    println!("\nCalibration complete! Use these parameters in your Heston model.");
}
