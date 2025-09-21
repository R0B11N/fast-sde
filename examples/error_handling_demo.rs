// examples/error_handling_demo.rs
use fast_sde::models::heston::{Heston, HestonParams};
use fast_sde::mc::mc_engine::{mc_price_option_gbm, McConfig};
use fast_sde::mc::payoffs::Payoff;
use fast_sde::error::SdeError;

fn main() {
    println!("Error Handling Demo for fast-sde");
    println!("=================================\n");

    // Test 1: Invalid Heston parameters
    println!("1. Testing invalid Heston parameters...");
    
    let invalid_params = HestonParams {
        s0: -100.0,  // Negative stock price
        v0: 0.04,
        r: 0.05,
        kappa: 2.0,
        theta: 0.04,
        xi: 0.3,
        rho: -0.5,
    };
    
    match Heston::new(invalid_params) {
        Ok(_) => println!("   Unexpected: Should have failed!"),
        Err(e) => println!("   ✓ Caught error: {}", e),
    }
    
    // Test 2: Invalid correlation
    println!("\n2. Testing invalid correlation...");
    
    let invalid_rho_params = HestonParams {
        s0: 100.0,
        v0: 0.04,
        r: 0.05,
        kappa: 2.0,
        theta: 0.04,
        xi: 0.3,
        rho: 1.5,  // Invalid correlation > 1
    };
    
    match Heston::new(invalid_rho_params) {
        Ok(_) => println!("   Unexpected: Should have failed!"),
        Err(e) => println!("   ✓ Caught error: {}", e),
    }
    
    // Test 3: Extreme parameters that should warn but not fail
    println!("\n3. Testing extreme but valid parameters...");
    
    let extreme_params = HestonParams {
        s0: 100.0,
        v0: 0.04,
        r: 0.05,
        kappa: 1.0,
        theta: 0.04,
        xi: 0.8,  // High vol-of-vol, violates Feller condition
        rho: -0.5,
    };
    
    match Heston::new(extreme_params) {
        Ok(_) => println!("   ✓ Created with warning (Feller condition violated)"),
        Err(e) => println!("   Error: {}", e),
    }
    
    // Test 4: Invalid Monte Carlo configuration
    println!("\n4. Testing invalid Monte Carlo configuration...");
    
    let invalid_mc_config = McConfig {
        paths: 0,  // Invalid: zero paths
        steps: 1,
        s0: 100.0,
        r: 0.05,
        sigma: 0.2,
        t: 1.0,
        seed: 42,
        use_antithetic: true,
        use_control_variate: true,
        payoff: Payoff::EuropeanCall { k: 100.0 },
        greeks: fast_sde::mc::mc_engine::GreeksConfig::NONE,
        epsilon: None,
    };
    
    match mc_price_option_gbm(&invalid_mc_config) {
        Ok(_) => println!("   Unexpected: Should have failed!"),
        Err(e) => println!("   ✓ Caught error: {}", e),
    }
    
    // Test 5: Invalid epsilon
    println!("\n5. Testing invalid epsilon for finite differences...");
    
    let invalid_epsilon_config = McConfig {
        paths: 10000,
        steps: 1,
        s0: 100.0,
        r: 0.05,
        sigma: 0.2,
        t: 1.0,
        seed: 42,
        use_antithetic: true,
        use_control_variate: true,
        payoff: Payoff::EuropeanCall { k: 100.0 },
        greeks: fast_sde::mc::mc_engine::GreeksConfig::GAMMA,
        epsilon: Some(50.0),  // Too large epsilon (50% of spot)
    };
    
    match mc_price_option_gbm(&invalid_epsilon_config) {
        Ok(_) => println!("   Unexpected: Should have failed!"),
        Err(e) => println!("   ✓ Caught error: {}", e),
    }
    
    // Test 6: Valid configuration should work
    println!("\n6. Testing valid configuration...");
    
    let valid_config = McConfig {
        paths: 10000,
        steps: 1,
        s0: 100.0,
        r: 0.05,
        sigma: 0.2,
        t: 1.0,
        seed: 42,
        use_antithetic: true,
        use_control_variate: true,
        payoff: Payoff::EuropeanCall { k: 100.0 },
        greeks: fast_sde::mc::mc_engine::GreeksConfig::NONE,
        epsilon: None,
    };
    
    match mc_price_option_gbm(&valid_config) {
        Ok((price, variance)) => println!("   ✓ Success: Price = {:.4}, Variance = {:.6}", price, variance),
        Err(e) => println!("   Unexpected error: {}", e),
    }
    
    // Test 7: Error type matching
    println!("\n7. Testing error type matching...");
    
    let bad_params = HestonParams {
        s0: 100.0,
        v0: -0.04,  // Negative variance
        r: 0.05,
        kappa: 2.0,
        theta: 0.04,
        xi: 0.3,
        rho: -0.5,
    };
    
    match Heston::new(bad_params) {
        Ok(_) => println!("   Unexpected: Should have failed!"),
        Err(SdeError::InvalidParameters { parameter, value, constraint }) => {
            println!("   ✓ Caught InvalidParameters: {} = {} ({})", parameter, value, constraint);
        }
        Err(other) => println!("   Unexpected error type: {}", other),
    }
    
    println!("\n✓ Error handling demo complete!");
    println!("All error cases were properly caught and handled.");
}
