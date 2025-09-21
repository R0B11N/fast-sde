// src/solvers/milstein.rs
//! Milstein Scheme for Higher-Order SDE Integration
//! 
//! # Mathematical Framework
//! 
//! For a scalar SDE:
//! ```text
//! dX_t = a(X_t, t) dt + b(X_t, t) dW_t
//! ```
//! 
//! The Milstein scheme includes an additional correction term:
//! ```text
//! X_{n+1} = X_n + a(X_n, t_n) Δt + b(X_n, t_n) ΔW_n + ½ b(X_n, t_n) b'(X_n, t_n) [(ΔW_n)² - Δt]
//! ```
//! 
//! Where:
//! - `b'(x,t) = ∂b/∂x` is the derivative of the diffusion coefficient
//! - `(ΔW_n)² - Δt` is the Itô correction term
//! 
//! # Convergence Properties
//! 
//! - **Strong convergence**: Order 1.0 (vs 0.5 for Euler-Maruyama)
//! - **Weak convergence**: Order 1.0 
//! - **Cost**: Requires diffusion derivative calculation
//! 
//! # When to Use
//! 
//! - When higher accuracy is needed
//! - For models where diffusion derivative is easily computed
//! - When step size cannot be made very small

use crate::models::model::SDEModel;
use rand::Rng;
use crate::rng;
use std::f64;

/// Milstein numerical scheme for SDE integration
pub struct Milstein;

impl Milstein {
    pub fn new() -> Self {
        Milstein {}
    }

    /// Single Milstein step with Itô correction
    /// 
    /// # Algorithm
    /// 
    /// 1. Generate normal draw: Z ~ N(0,1)
    /// 2. Compute ΔW = √Δt * Z
    /// 3. Evaluate drift: a(X_n, t_n)
    /// 4. Evaluate diffusion: b(X_n, t_n) and b'(X_n, t_n)
    /// 5. Apply Milstein formula with Itô correction term
    /// 
    /// # Itô Correction
    /// 
    /// The term `½ b b' [(ΔW)² - Δt]` corrects for the non-linearity
    /// of the diffusion coefficient, providing higher accuracy.
    pub fn step<M: SDEModel, R: Rng + ?Sized>(model: &M, s: &mut f64, t: f64, dt: f64, rng: &mut R) {
        let normal_draw = rng::get_normal_draw(rng);
        let drift_val = model.drift(*s, t);
        let diffusion_val = model.diffusion(*s, t);
        let diffusion_derivative_val = model.diffusion_derivative(*s, t);

        let dw = dt.sqrt() * normal_draw;

        // Milstein scheme: Euler + Itô correction
        *s += drift_val * dt
            + diffusion_val * dw
            + 0.5 * diffusion_val * diffusion_derivative_val * (dw * dw - dt);
    }
}
