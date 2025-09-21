// tests/greeks_test.rs
use fast_sde::mc::mc_engine::{mc_delta_european_call_gbm_pathwise, mc_vega_european_call_gbm_pathwise, mc_rho_european_call_gbm_pathwise, mc_gamma_european_call_gbm_finite_diff, mc_gamma_european_call_gbm_finite_diff_batched, McConfig, GreeksConfig};
use fast_sde::analytics::bs_analytic;
use fast_sde::mc::payoffs::Payoff;

#[test]
fn test_mc_delta_pathwise_vs_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.01;
    let sigma = 0.2;
    let t = 1.0;

    let cfg = McConfig {
        paths: 10_000_000, // Large number of paths for accuracy
        seed: 42,
        s0,
        r,
        sigma,
        t,
        payoff: Payoff::EuropeanCall { k },
        ..Default::default()
    };

    let mc_delta = mc_delta_european_call_gbm_pathwise(&cfg);
    let analytic_delta = bs_analytic::bs_call_delta(s0, k, r, sigma, t);

    let abs_error = (mc_delta - analytic_delta).abs();
    let rel_error = abs_error / analytic_delta;

    println!("\nMC Delta (Pathwise): {}", mc_delta);
    println!("Analytic Delta: {}", analytic_delta);
    println!("Absolute Error: {}", abs_error);
    println!("Relative Error: {}", rel_error);

    assert!(rel_error < 0.01, "Relative error for Delta exceeds 1%: {}", rel_error);
}

#[test]
fn test_bs_call_gamma_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;

    let analytic_gamma = bs_analytic::bs_call_gamma(s0, k, r, sigma, t);
    let expected_gamma = 0.018762017345847;

    let abs_error = (analytic_gamma - expected_gamma).abs();
    let rel_error = abs_error / expected_gamma;

    println!("\nAnalytic Gamma: {}", analytic_gamma);
    println!("Expected Gamma: {}", expected_gamma);
    println!("Absolute Error (Gamma): {}", abs_error);
    println!("Relative Error (Gamma): {}", rel_error);

    assert!(rel_error < 1e-2, "Relative error for Gamma exceeds tolerance: {}", rel_error);
}

#[test]
fn test_bs_call_vega_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;

    let analytic_vega = bs_analytic::bs_call_vega(s0, k, r, sigma, t);
    let expected_vega = 37.524034691693792;

    let abs_error = (analytic_vega - expected_vega).abs();
    let rel_error = abs_error / expected_vega;

    println!("\nAnalytic Vega: {}", analytic_vega);
    println!("Expected Vega: {}", expected_vega);
    println!("Absolute Error (Vega): {}", abs_error);
    println!("Relative Error (Vega): {}", rel_error);

    assert!(rel_error < 1e-2, "Relative error for Vega exceeds tolerance: {}", rel_error);
}

#[test]
fn test_bs_call_theta_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;

    let analytic_theta = bs_analytic::bs_call_theta(s0, k, r, sigma, t);
    let expected_theta = -6.414027546438197;

    let abs_error = (analytic_theta - expected_theta).abs();
    let rel_error = abs_error / expected_theta;

    println!("\nAnalytic Theta: {}", analytic_theta);
    println!("Expected Theta: {}", expected_theta);
    println!("Absolute Error (Theta): {}", abs_error);
    println!("Relative Error (Theta): {}", rel_error);

    assert!(rel_error < 1e-7, "Relative error for Theta exceeds tolerance: {}", rel_error);
}

#[test]
fn test_mc_vega_pathwise_vs_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;

    let cfg = McConfig {
        paths: 500_000, // Reduced for CI-friendly testing
        seed: 42,
        s0,
        r,
        sigma,
        t,
        payoff: Payoff::EuropeanCall { k },
        greeks: GreeksConfig::VEGA,
        use_antithetic: true,
        use_control_variate: false, // Disable for pathwise Greeks
        ..Default::default()
    };

    let mc_vega = mc_vega_european_call_gbm_pathwise(&cfg);
    let analytic_vega = bs_analytic::bs_call_vega(s0, k, r, sigma, t);

    let abs_error = (mc_vega - analytic_vega).abs();
    let rel_error = abs_error / analytic_vega;

    println!("\n=== MC Vega Test Results ===");
    println!("MC Vega (Pathwise): {}", mc_vega);
    println!("Analytic Vega: {}", analytic_vega);
    println!("Absolute Error: {}", abs_error);
    println!("Relative Error: {:.4}%", rel_error * 100.0);

    // Using a looser tolerance for Monte Carlo
    assert!(rel_error < 0.02, "Relative error for Vega exceeds 2%: {}", rel_error);
}

#[test]
fn test_mc_rho_pathwise_vs_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;

    let cfg = McConfig {
        paths: 500_000, // Reduced for CI-friendly testing
        seed: 42,
        s0,
        r,
        sigma,
        t,
        payoff: Payoff::EuropeanCall { k },
        greeks: GreeksConfig::RHO,
        use_antithetic: true,
        use_control_variate: false, // Disable for pathwise Greeks
        ..Default::default()
    };

    let mc_rho = mc_rho_european_call_gbm_pathwise(&cfg);
    let analytic_rho = bs_analytic::bs_call_rho(s0, k, r, sigma, t);

    let abs_error = (mc_rho - analytic_rho).abs();
    let rel_error = abs_error / analytic_rho;

    println!("\n=== MC Rho Test Results ===");
    println!("MC Rho (Pathwise): {}", mc_rho);
    println!("Analytic Rho: {}", analytic_rho);
    println!("Absolute Error: {}", abs_error);
    println!("Relative Error: {:.4}%", rel_error * 100.0);

    // Using a looser tolerance for Monte Carlo
    assert!(rel_error < 0.02, "Relative error for Rho exceeds 2%: {}", rel_error);
}

#[test]
fn test_mc_gamma_finite_diff_vs_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;

    let cfg = McConfig {
        paths: 500_000, // Reduced for CI-friendly testing
        seed: 42,
        s0,
        r,
        sigma,
        t,
        payoff: Payoff::EuropeanCall { k },
        greeks: GreeksConfig::GAMMA,
        use_antithetic: true,
        use_control_variate: false, // Disable for finite diff Greeks
        epsilon: Some(0.001 * s0), // 0.1% of spot
        ..Default::default()
    };

    // Test both implementations
    let mc_gamma = mc_gamma_european_call_gbm_finite_diff(&cfg);
    let mc_gamma_batched = mc_gamma_european_call_gbm_finite_diff_batched(&cfg);
    let analytic_gamma = bs_analytic::bs_call_gamma(s0, k, r, sigma, t);

    let abs_error = (mc_gamma - analytic_gamma).abs();
    let rel_error = abs_error / analytic_gamma;
    
    let abs_error_batched = (mc_gamma_batched - analytic_gamma).abs();
    let rel_error_batched = abs_error_batched / analytic_gamma;

    println!("\n=== MC Gamma Test Results ===");
    println!("MC Gamma (Finite Diff): {}", mc_gamma);
    println!("MC Gamma (Batched): {}", mc_gamma_batched);
    println!("Analytic Gamma: {}", analytic_gamma);
    println!("Absolute Error (Simple): {}", abs_error);
    println!("Relative Error (Simple): {:.4}%", rel_error * 100.0);
    println!("Absolute Error (Batched): {}", abs_error_batched);
    println!("Relative Error (Batched): {:.4}%", rel_error_batched * 100.0);

    // Using a looser tolerance for finite difference methods
    assert!(rel_error < 0.05, "Relative error for Gamma (simple) exceeds 5%: {}", rel_error);
    assert!(rel_error_batched < 0.05, "Relative error for Gamma (batched) exceeds 5%: {}", rel_error_batched);
}

#[test]
#[ignore]
fn test_gamma_epsilon_sweep() {
    // Test Gamma accuracy across different epsilon values
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;
    let n_paths = 1_000_000;

    let epsilons = vec![
        0.0001 * s0,  // 0.01%
        0.0005 * s0,  // 0.05%
        0.001 * s0,   // 0.1%
        0.002 * s0,   // 0.2%
        0.005 * s0,   // 0.5%
        0.01 * s0,    // 1%
    ];

    let analytic_gamma = bs_analytic::bs_call_gamma(s0, k, r, sigma, t);
    
    println!("\n=== Gamma Epsilon Sweep Results ===");
    println!("Analytic Gamma: {:.6}", analytic_gamma);
    println!("Paths: {}", n_paths);
    println!("\nEpsilon\t\tMC Gamma\tAbs Error\tRel Error %");
    println!("{}", "-".repeat(60));

    for eps in epsilons {
        let cfg = McConfig {
            paths: n_paths,
            seed: 42,
            s0,
            r,
            sigma,
            t,
            payoff: Payoff::EuropeanCall { k },
            greeks: GreeksConfig::GAMMA,
            use_antithetic: true,
            use_control_variate: false,
            epsilon: Some(eps),
            ..Default::default()
        };

        let mc_gamma = mc_gamma_european_call_gbm_finite_diff_batched(&cfg);
        let abs_error = (mc_gamma - analytic_gamma).abs();
        let rel_error = abs_error / analytic_gamma;

        println!("{:.4}\t\t{:.6}\t{:.6}\t{:.4}", 
                 eps, mc_gamma, abs_error, rel_error * 100.0);
    }
    
    println!("\nRecommendation: epsilon = 0.001 * S0 (0.1%) provides good balance");
}

#[test]
#[ignore]
fn test_mc_vega_rho_comprehensive_ci() {
    // Comprehensive test with confidence intervals (marked as ignore for CI)
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.05;
    let sigma = 0.20;
    let t = 1.0;
    let n_paths = 2_000_000;
    let n_runs = 10;

    let cfg = McConfig {
        paths: n_paths,
        seed: 12345,
        s0,
        r,
        sigma,
        t,
        payoff: Payoff::EuropeanCall { k },
        greeks: GreeksConfig::VEGA | GreeksConfig::RHO,
        use_antithetic: true,
        use_control_variate: false,
        ..Default::default()
    };

    // Run multiple times to get statistics
    let mut vega_results = Vec::with_capacity(n_runs);
    let mut rho_results = Vec::with_capacity(n_runs);
    
    for i in 0..n_runs {
        let mut cfg_run = cfg.clone();
        cfg_run.seed = cfg.seed + i as u64 * 1000;
        
        vega_results.push(mc_vega_european_call_gbm_pathwise(&cfg_run));
        rho_results.push(mc_rho_european_call_gbm_pathwise(&cfg_run));
    }
    
    // Calculate statistics
    let vega_mean = vega_results.iter().sum::<f64>() / n_runs as f64;
    let vega_std = (vega_results.iter().map(|x| (x - vega_mean).powi(2)).sum::<f64>() / (n_runs - 1) as f64).sqrt();
    let vega_stderr = vega_std / (n_runs as f64).sqrt();
    let vega_ci_95_lo = vega_mean - 1.96 * vega_stderr;
    let vega_ci_95_hi = vega_mean + 1.96 * vega_stderr;
    
    let rho_mean = rho_results.iter().sum::<f64>() / n_runs as f64;
    let rho_std = (rho_results.iter().map(|x| (x - rho_mean).powi(2)).sum::<f64>() / (n_runs - 1) as f64).sqrt();
    let rho_stderr = rho_std / (n_runs as f64).sqrt();
    let rho_ci_95_lo = rho_mean - 1.96 * rho_stderr;
    let rho_ci_95_hi = rho_mean + 1.96 * rho_stderr;
    
    let analytic_vega = bs_analytic::bs_call_vega(s0, k, r, sigma, t);
    let analytic_rho = bs_analytic::bs_call_rho(s0, k, r, sigma, t);
    
    println!("\n=== Comprehensive MC Greeks Test Results ({} runs, {} paths) ===", n_runs, n_paths);
    println!("Vega:");
    println!("  MC Mean: {:.6} ± {:.6} (stderr)", vega_mean, vega_stderr);
    println!("  95% CI: [{:.6}, {:.6}]", vega_ci_95_lo, vega_ci_95_hi);
    println!("  Analytic: {:.6}", analytic_vega);
    println!("  Relative Error: {:.4}%", (vega_mean - analytic_vega).abs() / analytic_vega * 100.0);
    
    println!("Rho:");
    println!("  MC Mean: {:.6} ± {:.6} (stderr)", rho_mean, rho_stderr);
    println!("  95% CI: [{:.6}, {:.6}]", rho_ci_95_lo, rho_ci_95_hi);
    println!("  Analytic: {:.6}", analytic_rho);
    println!("  Relative Error: {:.4}%", (rho_mean - analytic_rho).abs() / analytic_rho * 100.0);
    
    // Assert that analytical values fall within 95% CI
    assert!(analytic_vega >= vega_ci_95_lo && analytic_vega <= vega_ci_95_hi, 
            "Analytic Vega {} not in 95% CI [{}, {}]", analytic_vega, vega_ci_95_lo, vega_ci_95_hi);
    assert!(analytic_rho >= rho_ci_95_lo && analytic_rho <= rho_ci_95_hi,
            "Analytic Rho {} not in 95% CI [{}, {}]", analytic_rho, rho_ci_95_lo, rho_ci_95_hi);
}
