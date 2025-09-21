// scripts/benchmark.rs
use fast_sde::analytics::bs_analytic;
use fast_sde::math_utils::Timer;
use fast_sde::mc::mc_engine::{
    mc_delta_european_call_gbm_pathwise, mc_gamma_european_call_gbm_finite_diff_batched,
    mc_price_option_gbm, GreeksConfig, McConfig,
};
use fast_sde::mc::payoffs::Payoff;
use fast_sde::models::heston::{Heston, HestonParams, HestonScheme};
use fast_sde::rng::RngFactory;
use std::env;
use std::fs::File;
use std::io::Write;
use std::process::Command;

#[derive(Debug)]
struct SystemInfo {
    os: String,
    cpu_model: String,
    cpu_cores: usize,
    memory_gb: f64,
    rust_version: String,
    rustc_flags: String,
    rayon_threads: usize,
}

impl SystemInfo {
    fn gather() -> Self {
        let os = env::consts::OS.to_string();

        let cpu_model = Self::get_cpu_model();
        let cpu_cores = num_cpus::get();
        let memory_gb = Self::get_memory_gb();
        let rust_version = Self::get_rust_version();
        let rustc_flags = env::var("RUSTFLAGS").unwrap_or_else(|_| "default".to_string());
        let rayon_threads = rayon::current_num_threads();

        Self {
            os,
            cpu_model,
            cpu_cores,
            memory_gb,
            rust_version,
            rustc_flags,
            rayon_threads,
        }
    }

    fn get_cpu_model() -> String {
        #[cfg(target_os = "windows")]
        {
            Command::new("wmic")
                .args(&["cpu", "get", "name", "/value"])
                .output()
                .map(|output| {
                    String::from_utf8_lossy(&output.stdout)
                        .lines()
                        .find(|line| line.starts_with("Name="))
                        .map(|line| line.trim_start_matches("Name=").trim().to_string())
                        .unwrap_or_else(|| "Unknown CPU".to_string())
                })
                .unwrap_or_else(|_| "Unknown CPU".to_string())
        }

        #[cfg(target_os = "linux")]
        {
            std::fs::read_to_string("/proc/cpuinfo")
                .ok()
                .and_then(|content| {
                    content
                        .lines()
                        .find(|line| line.starts_with("model name"))
                        .and_then(|line| line.split(':').nth(1))
                        .map(|s| s.trim().to_string())
                })
                .unwrap_or_else(|| "Unknown CPU".to_string())
        }

        #[cfg(target_os = "macos")]
        {
            Command::new("sysctl")
                .args(&["-n", "machdep.cpu.brand_string"])
                .output()
                .map(|output| String::from_utf8_lossy(&output.stdout).trim().to_string())
                .unwrap_or_else(|_| "Unknown CPU".to_string())
        }

        #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
        {
            "Unknown CPU".to_string()
        }
    }

    fn get_memory_gb() -> f64 {
        #[cfg(target_os = "windows")]
        {
            Command::new("wmic")
                .args(&["computersystem", "get", "TotalPhysicalMemory", "/value"])
                .output()
                .ok()
                .and_then(|output| {
                    String::from_utf8_lossy(&output.stdout)
                        .lines()
                        .find(|line| line.starts_with("TotalPhysicalMemory="))
                        .and_then(|line| {
                            line.trim_start_matches("TotalPhysicalMemory=")
                                .trim()
                                .parse::<u64>()
                                .ok()
                        })
                        .map(|bytes| bytes as f64 / (1024.0 * 1024.0 * 1024.0))
                })
                .unwrap_or(0.0)
        }

        #[cfg(target_os = "linux")]
        {
            std::fs::read_to_string("/proc/meminfo")
                .ok()
                .and_then(|content| {
                    content
                        .lines()
                        .find(|line| line.starts_with("MemTotal:"))
                        .and_then(|line| line.split_whitespace().nth(1))
                        .and_then(|s| s.parse::<u64>().ok())
                        .map(|kb| kb as f64 / (1024.0 * 1024.0))
                })
                .unwrap_or(0.0)
        }

        #[cfg(target_os = "macos")]
        {
            Command::new("sysctl")
                .args(&["-n", "hw.memsize"])
                .output()
                .ok()
                .and_then(|output| {
                    String::from_utf8_lossy(&output.stdout)
                        .trim()
                        .parse::<u64>()
                        .ok()
                        .map(|bytes| bytes as f64 / (1024.0 * 1024.0 * 1024.0))
                })
                .unwrap_or(0.0)
        }

        #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
        {
            0.0
        }
    }

    fn get_rust_version() -> String {
        Command::new("rustc")
            .arg("--version")
            .output()
            .map(|output| String::from_utf8_lossy(&output.stdout).trim().to_string())
            .unwrap_or_else(|_| "Unknown Rust version".to_string())
    }
}

#[derive(Debug)]
struct BenchmarkResult {
    name: String,
    paths: usize,
    time_ms: f64,
    throughput_paths_per_sec: f64,
    value: f64,
    analytic_value: Option<f64>,
    relative_error: Option<f64>,
}

fn run_monte_carlo_benchmarks() -> Vec<BenchmarkResult> {
    let mut results = Vec::new();

    let paths_configs = [10_000, 100_000, 1_000_000];

    for &paths in &paths_configs {
        println!("Running benchmarks with {} paths...", paths);

        // European Call Price
        let cfg = McConfig {
            paths,
            steps: 1,
            s0: 100.0,
            r: 0.05,
            sigma: 0.2,
            t: 1.0,
            seed: 42,
            use_antithetic: true,
            use_control_variate: true,
            payoff: Payoff::EuropeanCall { k: 100.0 },
            greeks: GreeksConfig::NONE,
            epsilon: None,
        };

        let mut timer = Timer::new();
        timer.start();
        let (mc_price, _) = mc_price_option_gbm(&cfg).expect("Valid configuration");
        let time_ms = timer.elapsed_ms();
        let throughput = paths as f64 / (time_ms / 1000.0);
        let analytic_price = bs_analytic::bs_call_price(cfg.s0, 100.0, cfg.r, cfg.sigma, cfg.t);
        let rel_error = (mc_price - analytic_price).abs() / analytic_price;

        results.push(BenchmarkResult {
            name: format!("European Call Price ({}k paths)", paths / 1000),
            paths,
            time_ms,
            throughput_paths_per_sec: throughput,
            value: mc_price,
            analytic_value: Some(analytic_price),
            relative_error: Some(rel_error),
        });

        // Greeks (only for largest path count to save time)
        if paths == 1_000_000 {
            let cfg_greeks = McConfig {
                use_control_variate: false, // For fair Greeks comparison
                epsilon: Some(0.001 * cfg.s0),
                ..cfg
            };

            // Delta
            timer.start();
            let mc_delta = mc_delta_european_call_gbm_pathwise(&cfg_greeks);
            let delta_time = timer.elapsed_ms();
            let delta_throughput = paths as f64 / (delta_time / 1000.0);
            let analytic_delta = bs_analytic::bs_call_delta(cfg.s0, 100.0, cfg.r, cfg.sigma, cfg.t);

            results.push(BenchmarkResult {
                name: "European Call Delta".to_string(),
                paths,
                time_ms: delta_time,
                throughput_paths_per_sec: delta_throughput,
                value: mc_delta,
                analytic_value: Some(analytic_delta),
                relative_error: Some((mc_delta - analytic_delta).abs() / analytic_delta),
            });

            // Gamma
            timer.start();
            let mc_gamma = mc_gamma_european_call_gbm_finite_diff_batched(&cfg_greeks);
            let gamma_time = timer.elapsed_ms();
            let gamma_throughput = paths as f64 / (gamma_time / 1000.0);
            let analytic_gamma = bs_analytic::bs_call_gamma(cfg.s0, 100.0, cfg.r, cfg.sigma, cfg.t);

            results.push(BenchmarkResult {
                name: "European Call Gamma (FD)".to_string(),
                paths,
                time_ms: gamma_time,
                throughput_paths_per_sec: gamma_throughput,
                value: mc_gamma,
                analytic_value: Some(analytic_gamma),
                relative_error: Some((mc_gamma - analytic_gamma).abs() / analytic_gamma),
            });
        }
    }

    results
}

fn run_heston_benchmarks() -> Vec<BenchmarkResult> {
    let mut results = Vec::new();

    let params = HestonParams {
        s0: 100.0,
        v0: 0.04,
        r: 0.05,
        kappa: 2.0,
        theta: 0.04,
        xi: 0.3,
        rho: -0.5,
    };

    let schemes = [
        (HestonScheme::AndersenQE, "Andersen QE"),
        (HestonScheme::Alfonsi, "Alfonsi"),
        (HestonScheme::FullTruncationEuler, "Full Truncation Euler"),
    ];

    let paths = 100_000;
    let steps = 252;
    let time_to_expiry = 1.0;
    let strike = 100.0;

    for (scheme, scheme_name) in &schemes {
        println!("Benchmarking Heston {} scheme...", scheme_name);

        let heston = Heston::new_with_scheme(params, *scheme).expect("Valid parameters");
        let rng_factory = RngFactory::new(42);

        let mut timer = Timer::new();
        timer.start();

        let mut total_payoff = 0.0;
        let dt = time_to_expiry / steps as f64;

        for i in 0..paths {
            let mut rng = rng_factory.create_std_rng(i as u64);
            let mut s = params.s0;
            let mut v = params.v0;

            for _ in 0..steps {
                heston
                    .step(&mut s, &mut v, dt, &mut rng)
                    .expect("Step should succeed");
            }

            let payoff = (s - strike).max(0.0);
            total_payoff += payoff;
        }

        let time_ms = timer.elapsed_ms();
        let discount = (-params.r * time_to_expiry).exp();
        let price = discount * total_payoff / paths as f64;
        let throughput = paths as f64 / (time_ms / 1000.0);

        results.push(BenchmarkResult {
            name: format!("Heston {} Call", scheme_name),
            paths,
            time_ms,
            throughput_paths_per_sec: throughput,
            value: price,
            analytic_value: None,
            relative_error: None,
        });
    }

    results
}

fn write_results_to_csv(results: &[BenchmarkResult], system_info: &SystemInfo, filename: &str) {
    let mut file = File::create(filename).expect("Could not create CSV file");

    // Write system information as comments
    writeln!(file, "# System Information").unwrap();
    writeln!(file, "# OS: {}", system_info.os).unwrap();
    writeln!(file, "# CPU: {}", system_info.cpu_model).unwrap();
    writeln!(file, "# CPU Cores: {}", system_info.cpu_cores).unwrap();
    writeln!(file, "# Memory: {:.1} GB", system_info.memory_gb).unwrap();
    writeln!(file, "# Rust Version: {}", system_info.rust_version).unwrap();
    writeln!(file, "# RUSTFLAGS: {}", system_info.rustc_flags).unwrap();
    writeln!(file, "# Rayon Threads: {}", system_info.rayon_threads).unwrap();
    writeln!(
        file,
        "# Benchmark Date: {}",
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    )
    .unwrap();
    writeln!(file, "#").unwrap();

    // Write CSV header
    writeln!(
        file,
        "Benchmark,Paths,Time_ms,Throughput_paths_per_sec,Value,Analytic_Value,Relative_Error"
    )
    .unwrap();

    // Write results
    for result in results {
        writeln!(
            file,
            "{},{},{:.2},{:.0},{:.6},{},{}",
            result.name,
            result.paths,
            result.time_ms,
            result.throughput_paths_per_sec,
            result.value,
            result
                .analytic_value
                .map(|v| format!("{:.6}", v))
                .unwrap_or_else(|| "N/A".to_string()),
            result
                .relative_error
                .map(|e| format!("{:.6}", e))
                .unwrap_or_else(|| "N/A".to_string())
        )
        .unwrap();
    }

    println!("Results written to {}", filename);
}

fn main() {
    println!("fast-sde Comprehensive Benchmark Suite");
    println!("======================================\n");

    // Gather system information
    println!("Gathering system information...");
    let system_info = SystemInfo::gather();

    println!("System Information:");
    println!("  OS: {}", system_info.os);
    println!("  CPU: {}", system_info.cpu_model);
    println!("  CPU Cores: {}", system_info.cpu_cores);
    println!("  Memory: {:.1} GB", system_info.memory_gb);
    println!("  Rust Version: {}", system_info.rust_version);
    println!("  RUSTFLAGS: {}", system_info.rustc_flags);
    println!("  Rayon Threads: {}", system_info.rayon_threads);
    println!();

    // Run benchmarks
    println!("Running Monte Carlo benchmarks...");
    let mc_results = run_monte_carlo_benchmarks();

    println!("\nRunning Heston model benchmarks...");
    let heston_results = run_heston_benchmarks();

    // Combine results
    let mut all_results = mc_results;
    all_results.extend(heston_results);

    // Display results
    println!("\n{:=<80}", "");
    println!("BENCHMARK RESULTS");
    println!("{:=<80}", "");
    println!(
        "{:<35} {:>8} {:>12} {:>15} {:>10} {:>10} {:>12}",
        "Benchmark", "Paths", "Time (ms)", "Throughput", "Value", "Analytic", "Rel Error"
    );
    println!("{:-<80}", "");

    for result in &all_results {
        println!(
            "{:<35} {:>8} {:>12.2} {:>15.0} {:>10.4} {:>10} {:>12}",
            result.name,
            result.paths,
            result.time_ms,
            result.throughput_paths_per_sec,
            result.value,
            result
                .analytic_value
                .map(|v| format!("{:.4}", v))
                .unwrap_or_else(|| "N/A".to_string()),
            result
                .relative_error
                .map(|e| format!("{:.2}%", e * 100.0))
                .unwrap_or_else(|| "N/A".to_string())
        );
    }

    println!("{:=<80}", "");

    // Write to CSV
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("benchmark_results_{}.csv", timestamp);
    write_results_to_csv(&all_results, &system_info, &filename);

    println!("\nBenchmark complete!");
    println!("Results saved to: {}", filename);
    println!("\nTo reproduce these results:");
    println!("1. Use Rust version: {}", system_info.rust_version);
    println!("2. Set RUSTFLAGS: {}", system_info.rustc_flags);
    println!("3. Run: cargo run --bin benchmark --release");
    println!(
        "4. Ensure {} CPU threads available",
        system_info.rayon_threads
    );
}
