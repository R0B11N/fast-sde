// src/models/gbm.rs
use super::model::SDEModel;
use std::f64;

pub struct Gbm {
    pub s0: f64,
    pub mu: f64,
    pub sigma: f64,
}

impl Gbm {
    pub fn new(s0: f64, mu: f64, sigma: f64) -> Self {
        Gbm { s0, mu, sigma }
    }

    pub fn exact_step(&self, s_t: f64, dt: f64, normal_draw: f64) -> f64 {
        s_t * ( (self.mu - 0.5 * self.sigma * self.sigma) * dt + self.sigma * dt.sqrt() * normal_draw ).exp()
    }
}

impl SDEModel for Gbm {
    fn drift(&self, s: f64, _t: f64) -> f64 {
        self.mu * s
    }

    fn diffusion(&self, s: f64, _t: f64) -> f64 {
        self.sigma * s
    }

    fn diffusion_derivative(&self, _s: f64, _t: f64) -> f64 {
        self.sigma
    }

    fn step_with_dw(&self, s_current: &mut f64, t_current: f64, dt: f64, dw: f64) {
        // This is an Euler-Maruyama step, not the exact solution.
        *s_current += self.drift(*s_current, t_current) * dt + self.diffusion(*s_current, t_current) * dw;
    }
}
