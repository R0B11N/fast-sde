// src/solvers/euler_maruyama.rs
//! Euler-Maruyama Scheme for SDE Integration
//!
//! # Mathematical Framework
//!
//! For a general SDE:
//! ```text
//! dX_t = a(X_t, t) dt + b(X_t, t) dW_t
//! ```
//!
//! The Euler-Maruyama scheme provides the discretization:
//! ```text
//! X_{n+1} = X_n + a(X_n, t_n) Δt + b(X_n, t_n) ΔW_n
//! ```
//!
//! Where:
//! - `a(x,t)` is the drift coefficient
//! - `b(x,t)` is the diffusion coefficient  
//! - `ΔW_n ~ N(0, Δt)` are independent normal increments
//!
//! # Convergence Properties
//!
//! - **Strong convergence**: Order 0.5 in step size
//! - **Weak convergence**: Order 1.0 in step size
//! - **Stability**: Conditionally stable (depends on drift/diffusion)
//!
//! # Use Cases
//!
//! - General-purpose SDE solver
//! - Good for most financial models
//! - Simple implementation, widely understood

use crate::models::model::SDEModel;
use crate::rng;
use rand::Rng;
use std::f64;

/// Euler-Maruyama numerical scheme for SDE integration
pub struct EulerMaruyama;

impl EulerMaruyama {
    pub fn new() -> Self {
        EulerMaruyama {}
    }

    /// Single Euler-Maruyama step
    ///
    /// # Algorithm
    ///
    /// 1. Generate normal random draw: Z ~ N(0,1)
    /// 2. Compute drift: a(X_n, t_n) * Δt
    /// 3. Compute diffusion: b(X_n, t_n) * √Δt * Z
    /// 4. Update: X_{n+1} = X_n + drift + diffusion
    ///
    /// # Parameters
    /// - `model`: SDE model providing drift and diffusion functions
    /// - `s`: Current state (modified in-place)
    /// - `t`: Current time
    /// - `dt`: Time step size
    /// - `rng`: Random number generator
    pub fn step<M: SDEModel, R: Rng + ?Sized>(
        model: &M,
        s: &mut f64,
        t: f64,
        dt: f64,
        rng: &mut R,
    ) {
        let normal_draw = rng::get_normal_draw(rng);
        let drift_term = model.drift(*s, t) * dt;
        let diffusion_term = model.diffusion(*s, t) * dt.sqrt() * normal_draw;
        *s += drift_term + diffusion_term;
    }
}
