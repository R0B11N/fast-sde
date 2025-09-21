// src/analytics/bs_analytic.rs
//! Analytical Black-Scholes formulas for European options and Greeks
//!
//! # Mathematical Foundation
//!
//! Under the Black-Scholes model, the underlying asset follows:
//! ```text
//! dS_t = r S_t dt + σ S_t dW_t
//! ```
//!
//! The risk-neutral pricing formula gives:
//! ```text
//! V(S,t) = e^(-r(T-t)) * E^Q[payoff(S_T) | S_t = S]
//! ```
//!
//! For European options, this has closed-form solutions involving
//! the cumulative normal distribution function Φ(x).

use crate::math_utils::norm_cdf;
use std::f64::consts::PI;

/// Standard normal probability density function
///
/// # Formula
/// ```text
/// φ(x) = (1/√(2π)) * exp(-x²/2)
/// ```
fn norm_pdf(x: f64) -> f64 {
    (1.0 / (2.0 * PI).sqrt()) * (-0.5 * x * x).exp()
}

/// Black-Scholes European call option price
///
/// # Formula
/// ```text
/// C(S,K,r,σ,T) = S*Φ(d₁) - K*e^(-rT)*Φ(d₂)
/// ```
///
/// Where:
/// ```text
/// d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
/// d₂ = d₁ - σ√T
/// ```
///
/// # Parameters
/// - `s`: Current stock price
/// - `k`: Strike price  
/// - `r`: Risk-free rate
/// - `sigma`: Volatility
/// - `t`: Time to expiration
///
/// # Returns
/// Present value of the call option
pub fn bs_call_price(s: f64, k: f64, r: f64, sigma: f64, t: f64) -> f64 {
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    let d2 = d1 - sigma * t.sqrt();
    s * norm_cdf(d1) - k * (-r * t).exp() * norm_cdf(d2)
}

/// Black-Scholes European put option price
///
/// # Formula
/// ```text
/// P(S,K,r,σ,T) = K*e^(-rT)*Φ(-d₂) - S*Φ(-d₁)
/// ```
///
/// Uses put-call parity relationship with call price.
pub fn bs_put_price(s: f64, k: f64, r: f64, sigma: f64, t: f64) -> f64 {
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    let d2 = d1 - sigma * t.sqrt();
    k * (-r * t).exp() * norm_cdf(-d2) - s * norm_cdf(-d1)
}

/// Black-Scholes Delta (∂V/∂S) for European call
///
/// # Formula
/// ```text
/// Δ = ∂C/∂S = Φ(d₁)
/// ```
///
/// # Interpretation
/// - Hedge ratio: number of shares to buy per option sold
/// - Probability of finishing in-the-money (risk-neutral measure)
/// - Range: [0, 1] for calls
pub fn bs_call_delta(s: f64, k: f64, r: f64, sigma: f64, t: f64) -> f64 {
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    norm_cdf(d1)
}

/// Black-Scholes Gamma (∂²V/∂S²) for European call
///
/// # Formula
/// ```text
/// Γ = ∂²C/∂S² = φ(d₁) / (S * σ * √T)
/// ```
///
/// # Interpretation
/// - Rate of change of Delta w.r.t. underlying price
/// - Convexity of option price
/// - Maximum at-the-money, decreases as option goes in/out-of-money
/// - Same for calls and puts
pub fn bs_call_gamma(s: f64, _k: f64, _r: f64, sigma: f64, t: f64) -> f64 {
    let d1 = ((s / _k).ln() + (_r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    norm_pdf(d1) / (s * sigma * t.sqrt())
}

/// Black-Scholes Vega (∂V/∂σ) for European call
///
/// # Formula
/// ```text
/// ν = ∂C/∂σ = S * φ(d₁) * √T
/// ```
///
/// # Interpretation
/// - Sensitivity to volatility changes
/// - Always positive for long options
/// - Maximum at-the-money
/// - Units: price change per 1% volatility change
pub fn bs_call_vega(s: f64, _k: f64, _r: f64, sigma: f64, t: f64) -> f64 {
    let d1 = ((s / _k).ln() + (_r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    s * norm_pdf(d1) * t.sqrt()
}

/// Black-Scholes Theta (∂V/∂t) for European call
///
/// # Formula
/// ```text
/// Θ = ∂C/∂t = -S*φ(d₁)*σ/(2√T) - r*K*e^(-rT)*Φ(d₂)
/// ```
///
/// # Interpretation
/// - Time decay of option value
/// - Usually negative for long options (time erodes value)
/// - Accelerates as expiration approaches
/// - Units: price change per day
pub fn bs_call_theta(s: f64, k: f64, r: f64, sigma: f64, t: f64) -> f64 {
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    let d2 = d1 - sigma * t.sqrt();
    (-s * norm_pdf(d1) * sigma) / (2.0 * t.sqrt()) - r * k * (-r * t).exp() * norm_cdf(d2)
}

/// Black-Scholes Rho (∂V/∂r) for European call
///
/// # Formula
/// ```text
/// ρ = ∂C/∂r = K * T * e^(-rT) * Φ(d₂)
/// ```
///
/// # Interpretation
/// - Sensitivity to interest rate changes
/// - Positive for calls (higher rates increase call value)
/// - Negative for puts
/// - Units: price change per 1% rate change
pub fn bs_call_rho(s: f64, k: f64, r: f64, sigma: f64, t: f64) -> f64 {
    let d1 = ((s / k).ln() + (r + 0.5 * sigma * sigma) * t) / (sigma * t.sqrt());
    let d2 = d1 - sigma * t.sqrt();
    k * t * (-r * t).exp() * norm_cdf(d2)
}
