// tests/solver_convergence_test.rs
use fast_sde::models::gbm::Gbm;
use fast_sde::models::model::SDEModel;
use fast_sde::models::ou_process::OuProcess;
use fast_sde::rng;
use fast_sde::solvers::{euler_maruyama::EulerMaruyama, milstein::Milstein, srk::Srk};
use std::f64;

// Exact solution for Ornstein-Uhlenbeck process (mean)
fn ou_exact_solution_mean(s0: f64, theta: f64, mu: f64, t: f64) -> f64 {
    mu + (s0 - mu) * (-theta * t).exp()
}

// Exact solution path for Geometric Brownian Motion
fn gbm_exact_solution_path(
    s0: f64,
    r: f64,
    sigma: f64,
    _t_end: f64,
    dt: f64,
    normal_draws: &[f64],
) -> Vec<f64> {
    let mut path = Vec::with_capacity(normal_draws.len() + 1);
    path.push(s0);
    let mut current_s = s0;
    let sqrt_dt = dt.sqrt();

    for &z in normal_draws {
        current_s *= ((r - 0.5 * sigma * sigma) * dt + sigma * sqrt_dt * z).exp();
        path.push(current_s);
    }
    path
}

#[test]
fn test_euler_maruyama_ou_convergence() {
    let ou_process = OuProcess::new(0.5, 0.1, 0.2);
    let s0 = 100.0;
    let t_end = 1.0;
    let num_paths = 100_000; // Increased paths for weak convergence

    let mut errors = Vec::new();
    for num_steps in &[10, 20, 40, 80] {
        let dt = t_end / *num_steps as f64;
        let mut sum_s_final = 0.0;

        for i in 0..num_paths {
            let mut rng = rng::seed_rng_from_u64(42 + i as u64);
            let mut s_current = s0;
            let mut t_current = 0.0;

            for _ in 0..*num_steps {
                EulerMaruyama::step(&ou_process, &mut s_current, t_current, dt, &mut rng);
                t_current += dt;
            }
            sum_s_final += s_current;
        }
        let simulated_mean = sum_s_final / num_paths as f64;
        let exact_s_t_mean = ou_exact_solution_mean(s0, ou_process.theta, ou_process.mu, t_end);
        let abs_error = (simulated_mean - exact_s_t_mean).abs();
        errors.push(abs_error);
    }

    // Assert weak convergence: error should decrease as num_steps increases
    for i in 0..(errors.len() - 1) {
        assert!(
            errors[i] > errors[i + 1],
            "Euler-Maruyama did not converge (weak) as expected at step {}",
            i
        );
    }
    // Assert that the final absolute error is below a threshold for weak convergence
    assert!(
        *errors.last().unwrap() < 0.15,
        "Euler-Maruyama final absolute error ({}) is too high for weak convergence",
        errors.last().unwrap()
    );
}

#[test]
fn test_euler_maruyama_gbm_strong_convergence() {
    let s0 = 100.0;
    let r = 0.05;
    let sigma = 0.2;
    let gbm_process = Gbm::new(s0, r, sigma);
    let t_end = 1.0;
    let num_paths = 1_000; // Fewer paths for strong convergence, focusing on path-wise error

    let mut rms_errors = Vec::new();
    for num_steps in &[10, 20, 40, 80, 160] {
        let dt = t_end / *num_steps as f64;
        let mut sum_sq_diff = 0.0;

        for i in 0..num_paths {
            let mut rng = rng::seed_rng_from_u64(42 + i as u64);
            let mut normal_draws = Vec::with_capacity(*num_steps);
            for _ in 0..*num_steps {
                normal_draws.push(rng::get_normal_draw(&mut rng));
            }

            // Simulate numerical path using the provided normal draws (dW_n = Z_n * sqrt(dt))
            let mut s_numerical = s0;
            let mut t_current_numerical = 0.0;
            for k in 0..*num_steps {
                let dw = normal_draws[k] * dt.sqrt();
                gbm_process.step_with_dw(&mut s_numerical, t_current_numerical, dt, dw);
                t_current_numerical += dt;
            }

            // Simulate exact path using the *same* normal draws
            let exact_path = gbm_exact_solution_path(
                s0,
                gbm_process.mu,
                gbm_process.sigma,
                t_end,
                dt,
                &normal_draws,
            );
            let s_exact = *exact_path.last().unwrap();

            sum_sq_diff += (s_numerical - s_exact).powi(2);
        }
        let mse = sum_sq_diff / num_paths as f64;
        rms_errors.push(mse.sqrt());
    }

    println!(
        "\nEuler-Maruyama GBM Strong Convergence RMSEs: {:?}",
        rms_errors
    );

    // Assert strong convergence: RMSE should decrease approximately with sqrt(dt)
    // For Euler-Maruyama, strong order is 0.5, so RMSE should roughly halve when dt is quartered (num_steps doubled)
    // i.e. error(dt) / error(dt/2) should be approx sqrt(2) or 1.414
    for i in 0..(rms_errors.len() - 1) {
        let ratio = rms_errors[i] / rms_errors[i + 1];
        // The ratio should be around sqrt(2) for strong order 0.5
        // Allowing for some tolerance, e.g., between 1.2 and 1.6
        assert!(
            ratio > 1.2 && ratio < 1.6,
            "Strong convergence ratio not as expected at step {}: {}",
            i,
            ratio
        );
    }
    assert!(
        *rms_errors.last().unwrap() < 1.0,
        "Euler-Maruyama final RMSE ({}) is too high for strong convergence",
        rms_errors.last().unwrap()
    );
}

#[test]
fn test_milstein_ou_convergence() {
    let ou_process = OuProcess::new(0.5, 0.1, 0.2);
    let s0 = 100.0;
    let t_end = 1.0;
    let num_paths = 100_000; // Increased paths for weak convergence

    let mut errors = Vec::new();
    for num_steps in &[10, 20, 40, 80] {
        let dt = t_end / *num_steps as f64;
        let mut sum_s_final = 0.0;

        for i in 0..num_paths {
            let mut rng = rng::seed_rng_from_u64(42 + i as u64);
            let mut s_current = s0;
            let mut t_current = 0.0;

            for _ in 0..*num_steps {
                Milstein::step(&ou_process, &mut s_current, t_current, dt, &mut rng);
                t_current += dt;
            }
            sum_s_final += s_current;
        }
        let simulated_mean = sum_s_final / num_paths as f64;
        let exact_s_t_mean = ou_exact_solution_mean(s0, ou_process.theta, ou_process.mu, t_end);
        let abs_error = (simulated_mean - exact_s_t_mean).abs();
        errors.push(abs_error);
    }

    // Assert weak convergence
    for i in 0..(errors.len() - 1) {
        assert!(
            errors[i] > errors[i + 1],
            "Milstein did not converge (weak) as expected at step {}",
            i
        );
    }
    // Assert that the final absolute error is below a threshold for weak convergence
    assert!(
        *errors.last().unwrap() < 0.1,
        "Milstein final absolute error ({}) is too high for weak convergence",
        errors.last().unwrap()
    );
}

#[test]
fn test_srk_ou_convergence() {
    let ou_process = OuProcess::new(0.5, 0.1, 0.2);
    let s0 = 100.0;
    let t_end = 1.0;
    let num_paths = 100_000; // Increased paths for weak convergence

    let mut errors = Vec::new();
    for num_steps in &[10, 20, 40, 80] {
        let dt = t_end / *num_steps as f64;
        let mut sum_s_final = 0.0;

        for i in 0..num_paths {
            let mut rng = rng::seed_rng_from_u64(42 + i as u64);
            let mut s_current = s0;
            let mut t_current = 0.0;

            for _ in 0..*num_steps {
                Srk::step(&ou_process, &mut s_current, t_current, dt, &mut rng);
                t_current += dt;
            }
            sum_s_final += s_current;
        }
        let simulated_mean = sum_s_final / num_paths as f64;
        let exact_s_t_mean = ou_exact_solution_mean(s0, ou_process.theta, ou_process.mu, t_end);
        let abs_error = (simulated_mean - exact_s_t_mean).abs();
        errors.push(abs_error);
    }

    // Assert weak convergence
    for i in 0..(errors.len() - 1) {
        assert!(
            errors[i] > errors[i + 1],
            "SRK did not converge (weak) as expected at step {}",
            i
        );
    }
    assert!(
        *errors.last().unwrap() < 0.05,
        "SRK final absolute error ({}) is too high for weak convergence",
        errors.last().unwrap()
    );
}
