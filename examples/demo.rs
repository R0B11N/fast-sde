// examples/demo.rs
use fast_sde::mc::mc_engine::{mc_price_option_gbm, mc_delta_european_call_gbm_pathwise, mc_vega_european_call_gbm_pathwise, mc_rho_european_call_gbm_pathwise, mc_gamma_european_call_gbm_finite_diff_batched, McConfig, GreeksConfig};
use fast_sde::analytics::bs_analytic;
use fast_sde::math_utils::Timer;
use fast_sde::rng;
use fast_sde::output;
use rayon::prelude::*;
use std::f64;
use fast_sde::mc::payoffs::Payoff;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 && args[1] == "--bench" && args.len() > 2 && args[2] == "canonical" {
        run_canonical_benchmark();
    } else {
        run_demo_mode();
    }
}

fn run_canonical_benchmark() {
    let paths = 1_000_000;
    let steps = 1;
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.01;
    let sigma = 0.2;
    let t = 1.0;
    let seed = 42;

    let cfg = McConfig {
        paths,
        steps,
        s0,
        r,
        sigma,
        t,
        seed,
        use_antithetic: true,
        use_control_variate: true,
        payoff: Payoff::EuropeanCall { k },
        greeks: GreeksConfig::NONE,
        epsilon: None,
    };

    let mut timer = Timer::new();
    timer.start();
    let (price, variance) = mc_price_option_gbm(&cfg).expect("Valid configuration");
    let elapsed = timer.elapsed_ms() / 1000.0;
    let paths_per_sec = paths as f64 / elapsed;
    let stderr = variance.sqrt();

    let current_dir = std::env::current_dir().expect("Failed to get current directory");
    let output_filename = current_dir.join("bench").join("rust_canonical.csv");
    let mut file = std::fs::File::create(&output_filename).expect("Could not create file");
    std::io::Write::write_all(&mut file, b"paths,price,stderr,paths_per_sec\n").expect("Could not write header");
    let line = format!("{}, {:.8}, {:.6}, {:.6}\n", paths, price, stderr, paths_per_sec);
    std::io::Write::write_all(&mut file, line.as_bytes()).expect("Could not write data");

    println!("Rust benchmark results written to {}", output_filename.display());
}

fn run_demo_mode() {
    println!("Running fast-sde Monte Carlo Demo\n");

    let paths = 100_000;
    let steps = 252; // For Asian option, need multiple steps
    let s0 = 100.0;
    let k = 100.0;
    let r = 0.01;
    let sigma = 0.2;
    let t = 1.0;
    let h = 120.0; // Barrier level

    let cfg_european_call = McConfig {
        paths,
        steps,
        s0,
        r,
        sigma,
        t,
        seed: 12345,
        use_antithetic: true,
        use_control_variate: false,
        payoff: Payoff::EuropeanCall { k },
        greeks: GreeksConfig::DELTA | GreeksConfig::VEGA | GreeksConfig::RHO | GreeksConfig::GAMMA,
        epsilon: Some(0.001 * s0),  // 0.1% of spot for finite difference
    };

    let cfg_asian_call = McConfig {
        paths,
        steps,
        s0,
        r,
        sigma,
        t,
        seed: 12345,
        use_antithetic: true,
        use_control_variate: false, // Control variate for Asian is more complex, disable for now
        payoff: Payoff::AsianCall { k },
        greeks: GreeksConfig::NONE,
        epsilon: None,
    };

    let cfg_barrier_call_up_and_out = McConfig {
        paths,
        steps,
        s0,
        r,
        sigma,
        t,
        seed: 12345,
        use_antithetic: true,
        use_control_variate: false, // Control variate for barrier is complex, disable for now
        payoff: Payoff::BarrierCallUpAndOut { k, h },
        greeks: GreeksConfig::NONE,
        epsilon: None,
    };

    let cfg_barrier_put_up_and_out = McConfig {
        paths,
        steps,
        s0,
        r,
        sigma,
        t,
        seed: 12345,
        use_antithetic: true,
        use_control_variate: false, // Control variate for barrier is complex, disable for now
        payoff: Payoff::BarrierPutUpAndOut { k, h },
        greeks: GreeksConfig::NONE,
        epsilon: None,
    };

    // --- European Call Pricing ---
    println!("--- European Call Pricing ---");

    // Benchmark MC Price for European Call
    let mut timer = Timer::new();
    timer.start();
    let (mc_price_european, _variance_european) = mc_price_option_gbm(&cfg_european_call).expect("Valid configuration");
    let price_time_european = timer.elapsed_ms();
    println!("MC Price (European Call): {} ({} ms)", mc_price_european, price_time_european);
    let analytic_price_european = bs_analytic::bs_call_price(cfg_european_call.s0, k, cfg_european_call.r, cfg_european_call.sigma, cfg_european_call.t);
    println!("Analytic Price (European Call): {}", analytic_price_european);
    let abs_error_price_european = (mc_price_european - analytic_price_european).abs();
    let rel_error_price_european = abs_error_price_european / analytic_price_european;
    println!("Absolute Error (Price): {}", abs_error_price_european);
    println!("Relative Error (Price): {}\n", rel_error_price_european);

    // Benchmark MC Delta (Pathwise) for European Call
    timer.start();
    let mc_delta_european = mc_delta_european_call_gbm_pathwise(&cfg_european_call);
    let delta_time_european = timer.elapsed_ms();
    println!("MC Delta (European Call Pathwise): {} ({} ms)", mc_delta_european, delta_time_european);
    let analytic_delta_european = bs_analytic::bs_call_delta(cfg_european_call.s0, k, cfg_european_call.r, cfg_european_call.sigma, cfg_european_call.t);
    println!("Analytic Delta (European Call): {}", analytic_delta_european);
    let abs_error_delta_european = (mc_delta_european - analytic_delta_european).abs();
    let rel_error_delta_european = abs_error_delta_european / analytic_delta_european;
    println!("Absolute Error (Delta): {}", abs_error_delta_european);
    println!("Relative Error (Delta): {}\n", rel_error_delta_european);

    // Benchmark MC Vega (Pathwise) for European Call
    timer.start();
    let mc_vega_european = mc_vega_european_call_gbm_pathwise(&cfg_european_call);
    let vega_time_european = timer.elapsed_ms();
    println!("MC Vega (European Call Pathwise): {} ({} ms)", mc_vega_european, vega_time_european);
    let analytic_vega_european = bs_analytic::bs_call_vega(cfg_european_call.s0, k, cfg_european_call.r, cfg_european_call.sigma, cfg_european_call.t);
    println!("Analytic Vega (European Call): {}", analytic_vega_european);
    let abs_error_vega_european = (mc_vega_european - analytic_vega_european).abs();
    let rel_error_vega_european = abs_error_vega_european / analytic_vega_european;
    println!("Absolute Error (Vega): {}", abs_error_vega_european);
    println!("Relative Error (Vega): {}\n", rel_error_vega_european);

    // Benchmark MC Rho (Pathwise) for European Call
    timer.start();
    let mc_rho_european = mc_rho_european_call_gbm_pathwise(&cfg_european_call);
    let rho_time_european = timer.elapsed_ms();
    println!("MC Rho (European Call Pathwise): {} ({} ms)", mc_rho_european, rho_time_european);
    let analytic_rho_european = bs_analytic::bs_call_rho(cfg_european_call.s0, k, cfg_european_call.r, cfg_european_call.sigma, cfg_european_call.t);
    println!("Analytic Rho (European Call): {}", analytic_rho_european);
    let abs_error_rho_european = (mc_rho_european - analytic_rho_european).abs();
    let rel_error_rho_european = abs_error_rho_european / analytic_rho_european;
    println!("Absolute Error (Rho): {}", abs_error_rho_european);
    println!("Relative Error (Rho): {}\n", rel_error_rho_european);

    // Benchmark MC Gamma (Finite Difference) for European Call
    timer.start();
    let mc_gamma_european = mc_gamma_european_call_gbm_finite_diff_batched(&cfg_european_call);
    let gamma_time_european = timer.elapsed_ms();
    println!("MC Gamma (European Call Finite Diff): {} ({} ms)", mc_gamma_european, gamma_time_european);
    let analytic_gamma_european = bs_analytic::bs_call_gamma(cfg_european_call.s0, k, cfg_european_call.r, cfg_european_call.sigma, cfg_european_call.t);
    println!("Analytic Gamma (European Call): {}", analytic_gamma_european);
    let abs_error_gamma_european = (mc_gamma_european - analytic_gamma_european).abs();
    let rel_error_gamma_european = abs_error_gamma_european / analytic_gamma_european;
    println!("Absolute Error (Gamma): {}", abs_error_gamma_european);
    println!("Relative Error (Gamma): {}\n", rel_error_gamma_european);

    // --- Asian Call Pricing ---
    println!("--- Asian Call Pricing ---");

    // For Asian option, we need to simulate paths to get average price
    // No simple analytic solution for Asian option under GBM to compare directly

    let mut timer_asian = Timer::new();
    timer_asian.start();
    let (mc_price_asian, _variance_asian) = mc_price_option_gbm(&cfg_asian_call).expect("Valid configuration");
    let price_time_asian = timer_asian.elapsed_ms();
    println!("MC Price (Asian Call): {} ({} ms)\n", mc_price_asian, price_time_asian);
    let elapsed_sec_price_asian = price_time_asian as f64 / 1000.0;
    println!("Throughput: {:.2} paths/sec\n", cfg_asian_call.paths as f64 / elapsed_sec_price_asian);

    // --- Barrier Call Up and Out Pricing ---
    println!("--- Barrier Call Up and Out Pricing ---");
    let mut timer_barrier_call = Timer::new();
    timer_barrier_call.start();
    let (mc_price_barrier_call, _variance_barrier_call) = mc_price_option_gbm(&cfg_barrier_call_up_and_out).expect("Valid configuration");
    let price_time_barrier_call = timer_barrier_call.elapsed_ms();
    println!("MC Price (Barrier Call Up and Out): {} ({} ms)\n", mc_price_barrier_call, price_time_barrier_call);
    let elapsed_sec_price_barrier_call = price_time_barrier_call as f64 / 1000.0;
    println!("Throughput: {:.2} paths/sec\n", cfg_barrier_call_up_and_out.paths as f64 / elapsed_sec_price_barrier_call);

    // --- Barrier Put Up and Out Pricing ---
    println!("--- Barrier Put Up and Out Pricing ---");
    let mut timer_barrier_put = Timer::new();
    timer_barrier_put.start();
    let (mc_price_barrier_put, _variance_barrier_put) = mc_price_option_gbm(&cfg_barrier_put_up_and_out).expect("Valid configuration");
    let price_time_barrier_put = timer_barrier_put.elapsed_ms();
    println!("MC Price (Barrier Put Up and Out): {} ({} ms)\n", mc_price_barrier_put, price_time_barrier_put);
    let elapsed_sec_price_barrier_put = price_time_barrier_put as f64 / 1000.0;
    println!("Throughput: {:.2} paths/sec\n", cfg_barrier_put_up_and_out.paths as f64 / elapsed_sec_price_barrier_put);

    // --- CSV Output ---
    // For CSV output, we need to generate paths with the new Payoff structure
    let path_data_for_csv: Vec<(f64, f64, f64)> = (0..paths)
        .into_par_iter()
        .map(|i| {
            let mut rng = rng::seed_rng_from_u64(cfg_european_call.seed + i as u64);
            let mut path_prices = Vec::with_capacity(steps + 1);
            path_prices.push(s0);

            let mut current_s = s0;
            let dt = t / steps as f64;
            let sqrt_dt = dt.sqrt();

            for _ in 0..steps {
                let z = rng::get_normal_draw(&mut rng);
                current_s *= ((r - 0.5 * sigma * sigma) * dt + sigma * sqrt_dt * z).exp();
                path_prices.push(current_s);
            }
            
            let payoff_european = cfg_european_call.payoff.calculate(&path_prices);
            let delta_path_european = if *path_prices.last().unwrap() > k { *path_prices.last().unwrap() / s0 } else { 0.0 };
            (*path_prices.last().unwrap(), payoff_european, delta_path_european)
        })
        .collect();

    let paths_csv_filename = "results/paths.csv";
    match output::write_paths_to_csv(paths_csv_filename, &path_data_for_csv) {
        Ok(_) => println!("Path data written to {}", paths_csv_filename),
        Err(e) => eprintln!("Error writing path data: {}", e),
    }

    // Collect summary data into owned Strings
    let mc_price_european_str = mc_price_european.to_string();
    let analytic_price_european_str = analytic_price_european.to_string();
    let abs_error_price_european_str = abs_error_price_european.to_string();
    let rel_error_price_european_str = rel_error_price_european.to_string();
    let price_time_european_str = price_time_european.to_string();

    let mc_delta_european_str = mc_delta_european.to_string();
    let analytic_delta_european_str = analytic_delta_european.to_string();
    let abs_error_delta_european_str = abs_error_delta_european.to_string();
    let rel_error_delta_european_str = rel_error_delta_european.to_string();
    let delta_time_european_str = delta_time_european.to_string();

    let mc_price_asian_str = mc_price_asian.to_string();
    let price_time_asian_str = price_time_asian.to_string();

    let mc_price_barrier_call_str = mc_price_barrier_call.to_string();
    let price_time_barrier_call_str = price_time_barrier_call.to_string();

    let mc_price_barrier_put_str = mc_price_barrier_put.to_string();
    let price_time_barrier_put_str = price_time_barrier_put.to_string();

    let summary_data = vec![
        ("metric", "value"),
        ("mc_price_european", &mc_price_european_str),
        ("analytic_price_european", &analytic_price_european_str),
        ("abs_error_price_european", &abs_error_price_european_str),
        ("rel_error_price_european", &rel_error_price_european_str),
        ("price_time_ms_european", &price_time_european_str),
        ("mc_delta_european", &mc_delta_european_str),
        ("analytic_delta_european", &analytic_delta_european_str),
        ("abs_error_delta_european", &abs_error_delta_european_str),
        ("rel_error_delta_european", &rel_error_delta_european_str),
        ("delta_time_ms_european", &delta_time_european_str),
        ("mc_price_asian", &mc_price_asian_str),
        ("price_time_ms_asian", &price_time_asian_str),
        ("mc_price_barrier_call", &mc_price_barrier_call_str),
        ("price_time_ms_barrier_call", &price_time_barrier_call_str),
        ("mc_price_barrier_put", &mc_price_barrier_put_str),
        ("price_time_ms_barrier_put", &price_time_barrier_put_str),
    ];

    // Write summary to CSV
    let summary_csv_filename = "results/summary.csv";
    match output::write_summary_to_csv(summary_csv_filename, &summary_data) {
        Ok(_) => println!("Summary data written to {}", summary_csv_filename),
        Err(e) => eprintln!("Error writing summary data: {}", e),
    }
}
