// src/models/ou_process.rs
use super::model::SDEModel;
use std::f64;

pub struct OuProcess {
    pub theta: f64,
    pub mu: f64,
    pub sigma: f64,
}

impl OuProcess {
    pub fn new(theta: f64, mu: f64, sigma: f64) -> Self {
        OuProcess { theta, mu, sigma }
    }
}

impl SDEModel for OuProcess {
    fn drift(&self, s: f64, _t: f64) -> f64 {
        self.theta * (self.mu - s)
    }

    fn diffusion(&self, _s: f64, _t: f64) -> f64 {
        self.sigma
    }

    fn diffusion_derivative(&self, _s: f64, _t: f64) -> f64 {
        0.0 // Derivative of a constant diffusion w.r.t. s is 0
    }

    fn step_with_dw(&self, s_current: &mut f64, t_current: f64, dt: f64, dw: f64) {
        *s_current += self.drift(*s_current, t_current) * dt + self.diffusion(*s_current, t_current) * dw;
    }
}

