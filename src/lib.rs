//! # fast-sde: High-Performance Monte Carlo for Quantitative Finance
//! 
//! A Rust library for Monte Carlo simulation of Stochastic Differential Equations (SDEs)
//! with applications to option pricing, risk management, and quantitative finance.
//! 
//! ## Key Features
//! 
//! - **High Performance**: Parallel Monte Carlo with Rayon, optimized for speed
//! - **Variance Reduction**: Antithetic variates and control variates
//! - **Multiple SDE Models**: Black-Scholes, Heston, SABR, Merton jump-diffusion
//! - **Robust Numerics**: Multiple discretization schemes (Euler, Milstein, SRK)
//! - **Complete Greeks**: Delta, Gamma, Vega, Rho via pathwise and finite difference
//! - **Production Ready**: Comprehensive error handling and validation
//! 
//! ## Quick Start
//! 
//! ```rust
//! use fast_sde::mc::mc_engine::{mc_price_option_gbm, McConfig};
//! use fast_sde::mc::payoffs::Payoff;
//! 
//! // Configure European call option
//! let config = McConfig {
//!     paths: 100_000,
//!     s0: 100.0,      // Spot price
//!     r: 0.05,        // Risk-free rate
//!     sigma: 0.2,     // Volatility
//!     t: 1.0,         // Time to expiration
//!     payoff: Payoff::EuropeanCall { k: 100.0 },
//!     ..Default::default()
//! };
//! 
//! // Price the option
//! let (price, variance) = mc_price_option_gbm(&config).expect("Valid configuration");
//! println!("Option price: {:.4} ± {:.4}", price, variance.sqrt());
//! ```
//! 
//! ## Mathematical Foundation
//! 
//! The library implements Monte Carlo methods for pricing derivatives under various
//! stochastic models. The core approach simulates asset price paths and computes
//! expected payoffs under the risk-neutral measure.

// Module declarations
pub mod error;
pub mod rng;
pub mod math_utils;
pub mod models;
pub mod solvers;
pub mod mc;
pub mod analytics;
pub mod output;

// Re-export commonly used types for convenience
pub use error::{SdeError, SdeResult};