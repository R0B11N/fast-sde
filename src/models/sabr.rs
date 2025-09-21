// src/models/sabr.rs
use super::model::SDEModel;
use rand::Rng;
use crate::rng;
use std::f64;

pub struct SabrParams {
    pub f0: f64, // Initial forward rate/price
    pub alpha: f64,
    pub beta: f64, // Fixed to 1.0 for lognormal case
    pub rho: f64,
    pub nu: f64,
    pub v0: f64, // Initial volatility for simplification in SDEModel trait
}

pub struct Sabr {
    pub params: SabrParams,
}

impl Sabr {
    pub fn new(params: SabrParams) -> Self {
        // Ensure beta is 1.0 for this implementation
        assert!(params.beta == 1.0, "SABR implementation assumes beta = 1.0 (lognormal)");
        Sabr { params }
    }

    // Implement the step for the SABR model (for beta=1.0, lognormal)
    // dF_t = alpha * F_t * V_t dW_1
    // dV_t = nu * V_t dW_2
    // dW_1, dW_2 correlated with rho
    pub fn step<R: Rng + ?Sized>(&self, f: &mut f64, v: &mut f64, dt: f64, rng: &mut R) {
        let z1: f64 = rng::get_normal_draw(rng);
        let z2: f64 = rng::get_normal_draw(rng);

        let z2corr = self.params.rho * z1 + (1.0 - self.params.rho * self.params.rho).sqrt() * z2;

        // Update volatility (V_t)
        let dv = self.params.nu * *v * dt.sqrt() * z2corr; // Simplified Euler for V
        *v = *v + dv;
        if *v < 0.0 { *v = 0.0; } // Full truncation for volatility

        // Update forward rate/price (F_t)
        let df_log = ( -0.5 * self.params.alpha * self.params.alpha * *v * *v ) * dt + self.params.alpha * *v * dt.sqrt() * z1;
        *f = *f * df_log.exp();

    }
}

impl SDEModel for Sabr {
    // Simplified for generic SDE solvers, focusing on the F_t process
    fn drift(&self, _f: f64, _t: f64) -> f64 {
        // For SABR, the drift of F_t under risk-neutral measure is usually 0 if F is a forward rate.
        // If F is a price, it might have rF drift. For simplicity here, assume 0 for now in a forward context.
        0.0
    }

    fn diffusion(&self, f: f64, _t: f64) -> f64 {
        self.params.alpha * self.params.v0 * f // Using initial volatility as a constant for this simplified trait implementation
    }

    fn diffusion_derivative(&self, _f: f64, _t: f64) -> f64 {
        self.params.alpha * self.params.v0 // Derivative of alpha * v0 * f with respect to f is alpha * v0
    }

    fn step_with_dw(&self, s_current: &mut f64, t_current: f64, dt: f64, dw: f64) {
        // Simplified 1D step, consistent with the 1D drift and diffusion implementations
        *s_current += self.drift(*s_current, t_current) * dt + self.diffusion(*s_current, t_current) * dw;
    }
}
