// src/math_utils.rs
use statrs::function::erf;
use std::f64::consts::SQRT_2;

pub fn norm_cdf(x: f64) -> f64 {
    0.5 * (1.0 + erf::erf(x / SQRT_2))
}

pub struct Timer {
    start_time: std::time::Instant,
}

impl Timer {
    pub fn new() -> Timer {
        Timer {
            start_time: std::time::Instant::now(),
        }
    }

    pub fn start(&mut self) {
        self.start_time = std::time::Instant::now();
    }

    pub fn elapsed_ms(&self) -> f64 {
        self.start_time.elapsed().as_secs_f64() * 1000.0
    }
}
