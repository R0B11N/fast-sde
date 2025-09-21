// src/solvers/srk.rs
//! Stochastic Runge-Kutta (SRK) Scheme for SDE Integration
//!
//! # Mathematical Framework
//!
//! Stochastic analog of the classical Runge-Kutta method for ODEs.
//! This implementation uses a Heun-like predictor-corrector approach.
//!
//! # Algorithm
//!
//! For SDE: `dX_t = a(X_t, t) dt + b(X_t, t) dW_t`
//!
//! 1. **Predictor step** (Euler):
//!    ```text
//!    X* = X_n + a(X_n, t_n) Δt + b(X_n, t_n) ΔW_n
//!    ```
//!
//! 2. **Corrector step** (average):
//!    ```text
//!    X_{n+1} = X_n + ½[a(X_n, t_n) + a(X*, t_{n+1})] Δt + ½[b(X_n, t_n) + b(X*, t_{n+1})] ΔW_n
//!    ```
//!
//! # Convergence Properties
//!
//! - **Strong convergence**: Order 1.0
//! - **Weak convergence**: Order 1.0
//! - **Cost**: 2x function evaluations per step (vs Euler)
//!
//! # Advantages
//!
//! - Higher accuracy than Euler-Maruyama
//! - More stable for stiff SDEs
//! - Good for models with state-dependent coefficients

use crate::models::model::SDEModel;
use crate::rng;
use rand::Rng;
use std::f64;

/// Stochastic Runge-Kutta numerical scheme
pub struct Srk;

impl Srk {
    pub fn new() -> Self {
        Srk {}
    }

    /// Single SRK step using predictor-corrector method
    ///
    /// # Algorithm Details
    ///
    /// 1. **Predictor**: Use Euler step to estimate X* at t+Δt
    /// 2. **Corrector**: Average drift and diffusion at both time points
    /// 3. **Same random increment**: Use same ΔW for both steps
    ///
    /// # Performance vs Accuracy
    ///
    /// - 2x slower than Euler (requires 2 function evaluations)
    /// - Significantly more accurate, especially for larger time steps
    /// - Good choice when function evaluations are cheap
    pub fn step<M: SDEModel, R: Rng + ?Sized>(
        model: &M,
        s: &mut f64,
        t: f64,
        dt: f64,
        rng: &mut R,
    ) {
        let dw = dt.sqrt() * rng::get_normal_draw(rng);

        // Predictor step: Euler-Maruyama to get provisional value
        let s_star = *s + model.drift(*s, t) * dt + model.diffusion(*s, t) * dw;

        // Corrector step: average coefficients between start and end points
        let drift_avg = 0.5 * (model.drift(*s, t) + model.drift(s_star, t + dt));
        let diffusion_avg = 0.5 * (model.diffusion(*s, t) + model.diffusion(s_star, t + dt));

        // Apply corrected update using averaged coefficients
        *s += drift_avg * dt + diffusion_avg * dw;
    }
}
