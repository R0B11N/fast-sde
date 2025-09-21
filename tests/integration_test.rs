// tests/integration_test.rs
use fast_sde::analytics::bs_analytic;
use fast_sde::mc::mc_engine::{mc_price_option_gbm, McConfig};
use fast_sde::mc::payoffs::Payoff;

#[test]
fn test_bs_mc_vs_analytic() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.01;
    let sigma = 0.2;
    let t = 1.0;

    let cfg_with_cv = McConfig {
        paths: 1_000_000, // Reduced paths for faster CI
        seed: 42,
        s0,
        r,
        sigma,
        t,
        use_control_variate: true,
        payoff: Payoff::EuropeanCall { k },
        ..Default::default()
    };

    // Run with control variate to get price and estimate variance
    let (mc_price_with_cv, variance_with_cv) =
        mc_price_option_gbm(&cfg_with_cv).expect("Valid configuration");

    // To estimate variance reduction factor, we need to run WITHOUT control variate as well
    // A more robust way would be to get the variance estimate directly from the MC engine
    // For simplicity here, we'll run a separate simulation without CV to compare variances.
    let cfg_without_cv = McConfig {
        paths: 1_000_000, // Reduced paths for faster CI
        seed: 42,
        s0,
        r,
        sigma,
        t,
        use_control_variate: false,
        payoff: Payoff::EuropeanCall { k },
        ..Default::default()
    };
    let (mc_price_without_cv, variance_without_cv) =
        mc_price_option_gbm(&cfg_without_cv).expect("Valid configuration");

    let analytic_price = bs_analytic::bs_call_price(s0, k, r, sigma, t);

    let abs_error_with_cv = (mc_price_with_cv - analytic_price).abs();
    let abs_error_without_cv = (mc_price_without_cv - analytic_price).abs();

    // Approximate Variance Reduction Factor using (Error without CV / Error with CV)^2
    // This is a simplification and not a direct measure of variance reduction.
    let vrf = variance_without_cv / variance_with_cv;

    println!("\nMC Price (with CV): {}", mc_price_with_cv);
    println!("MC Price (without CV): {}", mc_price_without_cv);
    println!("Analytic Price: {}", analytic_price);
    println!("Absolute Error (with CV): {}", abs_error_with_cv);
    println!("Absolute Error (without CV): {}", abs_error_without_cv);
    println!("Variance with CV: {}", variance_with_cv);
    println!("Variance without CV: {}", variance_without_cv);
    println!("Variance Reduction Factor: {}", vrf);

    let rel_error = abs_error_with_cv / analytic_price;

    println!("Relative Error: {}", rel_error);

    assert!(rel_error < 0.01, "Relative error exceeds 1%: {}", rel_error);
    assert!(
        vrf > 1.2,
        "Variance Reduction Factor ({}) is not greater than 1.2",
        vrf
    );
}

#[test]
fn test_asian_option_cv() {
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.01;
    let sigma = 0.2;
    let t = 1.0;
    let steps = 252; // Daily steps for an annual option

    let cfg_without_cv = McConfig {
        paths: 500_000, // Further reduced paths for faster CI
        steps,
        seed: 43,
        s0,
        r,
        sigma,
        t,
        use_antithetic: true,
        use_control_variate: false,
        payoff: Payoff::AsianCall { k },
        ..Default::default()
    };
    let (_, variance_without_cv) =
        mc_price_option_gbm(&cfg_without_cv).expect("Valid configuration");

    let cfg_with_cv = McConfig {
        paths: 500_000, // Further reduced paths for faster CI
        steps,
        seed: 43,
        s0,
        r,
        sigma,
        t,
        use_antithetic: true,
        use_control_variate: true,
        payoff: Payoff::AsianCall { k },
        ..Default::default()
    };
    let (mc_price_with_cv, variance_with_cv) =
        mc_price_option_gbm(&cfg_with_cv).expect("Valid configuration");

    let vrf = variance_without_cv / variance_with_cv;

    println!("\nAsian Call Price (with CV): {}", mc_price_with_cv);
    println!("Variance with CV: {}", variance_with_cv);
    println!("Variance without CV: {}", variance_without_cv);
    println!("Variance Reduction Factor (Asian): {}", vrf);

    // For Asian options, there's no simple analytic solution for comparison.
    // We primarily test for variance reduction.
    assert!(
        vrf > 1.1,
        "Variance Reduction Factor for Asian Call ({}) is not greater than 1.1",
        vrf
    );
}
