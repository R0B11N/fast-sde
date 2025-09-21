// src/models/model.rs
pub trait SDEModel {
    fn drift(&self, s: f64, t: f64) -> f64;
    fn diffusion(&self, s: f64, t: f64) -> f64;
    fn diffusion_derivative(&self, s: f64, t: f64) -> f64;
    fn step_with_dw(&self, s_current: &mut f64, t_current: f64, dt: f64, dw: f64);
}
