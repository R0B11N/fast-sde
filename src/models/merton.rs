// src/models/merton.rs
use super::model::SDEModel;
use crate::rng;
use rand::Rng;
use rand_distr::{Distribution, Poisson};
use std::f64;

pub struct MertonParams {
    pub s0: f64,
    pub mu: f64,
    pub sigma: f64,
    pub lambda: f64,  // Jump intensity
    pub mu_j: f64,    // Mean of log-jump size
    pub sigma_j: f64, // Std dev of log-jump size
}

pub struct Merton {
    pub params: MertonParams,
}

impl Merton {
    pub fn new(params: MertonParams) -> Self {
        Merton { params }
    }

    pub fn step<R: Rng + ?Sized>(&self, s: &mut f64, dt: f64, rng: &mut R) {
        // Continuous part (GBM-like)
        let z_gbm = rng::get_normal_draw(rng);
        *s *= ((self.params.mu - 0.5 * self.params.sigma * self.params.sigma) * dt
            + self.params.sigma * dt.sqrt() * z_gbm)
            .exp();

        // Jump part (Poisson process)
        let num_jumps: usize = Poisson::new(self.params.lambda * dt).unwrap().sample(rng) as usize;
        for _ in 0..num_jumps {
            let jump_size_log = self.params.mu_j + self.params.sigma_j * rng::get_normal_draw(rng);
            *s *= jump_size_log.exp();
        }
    }
}

impl SDEModel for Merton {
    // Simplified for generic SDE solvers, focusing on the continuous part.
    fn drift(&self, s: f64, _t: f64) -> f64 {
        self.params.mu * s
    }

    fn diffusion(&self, s: f64, _t: f64) -> f64 {
        self.params.sigma * s
    }

    fn diffusion_derivative(&self, _s: f64, _t: f64) -> f64 {
        self.params.sigma
    }

    fn step_with_dw(&self, s_current: &mut f64, t_current: f64, dt: f64, dw: f64) {
        // Simplified 1D step, consistent with the 1D drift and diffusion implementations (continuous part)
        *s_current +=
            self.drift(*s_current, t_current) * dt + self.diffusion(*s_current, t_current) * dw;
    }
}
