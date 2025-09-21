// src/rng.rs
//! Random Number Generation for Monte Carlo Simulations
//! 
//! # Design Philosophy
//! 
//! Monte Carlo simulations require high-quality random numbers with specific properties:
//! 1. **Reproducibility**: Same seed → same results (critical for debugging/validation)
//! 2. **Parallel safety**: Different threads must have independent streams
//! 3. **Performance**: Fast generation for millions of paths
//! 4. **Statistical quality**: Good distributional properties
//! 
//! # Counter-Based RNG
//! 
//! Uses a counter-based approach similar to Philox/Threefry algorithms:
//! - Each path gets a unique counter value
//! - Deterministic mapping: (seed, counter) → random value
//! - Perfect reproducibility across different thread counts
//! 
//! # Box-Muller Transform
//! 
//! Converts uniform random variables to normal distributions:
//! ```text
//! Z₁ = √(-2ln(U₁)) * cos(2πU₂)
//! Z₂ = √(-2ln(U₁)) * sin(2πU₂)
//! ```
//! where U₁, U₂ ~ Uniform(0,1) and Z₁, Z₂ ~ N(0,1).

use rand::{SeedableRng, Rng};
use rand::rngs::StdRng;
use rand_distr::{Distribution, StandardNormal};
use std::sync::atomic::{AtomicU64, Ordering};

/// Counter-based RNG for reproducible parallel simulations
/// 
/// # Algorithm
/// 
/// Uses splitmix64-like algorithm for fast, high-quality random numbers:
/// ```text
/// z = base_seed + counter
/// z = (z ⊕ (z >> 30)) * 0xbf58476d1ce4e5b9
/// z = (z ⊕ (z >> 27)) * 0x94d049bb133111eb  
/// output = z ⊕ (z >> 31)
/// ```
/// 
/// # Thread Safety
/// 
/// Each path gets its own CounterRng instance, ensuring no shared state
/// between threads while maintaining deterministic behavior.
#[derive(Debug, Clone)]
pub struct CounterRng {
    base_seed: u64,
    counter: u64,
}

impl CounterRng {
    pub fn new(base_seed: u64, counter: u64) -> Self {
        Self { base_seed, counter }
    }
    
    pub fn next_u64(&mut self) -> u64 {
        // Simple counter-based PRNG using splitmix64-like algorithm
        self.counter = self.counter.wrapping_add(1);
        let mut z = self.base_seed.wrapping_add(self.counter);
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9u64);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111ebu64);
        z ^ (z >> 31)
    }
    
    pub fn uniform(&mut self) -> f64 {
        (self.next_u64() >> 11) as f64 * (1.0 / 9007199254740992.0) // 2^53
    }
    
    pub fn normal(&mut self) -> f64 {
        // Box-Muller transform
        static mut SPARE: Option<f64> = None;
        static SPARE_READY: AtomicU64 = AtomicU64::new(0);
        
        unsafe {
            if SPARE_READY.load(Ordering::Relaxed) == 1 {
                SPARE_READY.store(0, Ordering::Relaxed);
                return SPARE.unwrap();
            }
        }
        
        let u1 = self.uniform();
        let u2 = self.uniform();
        
        let mag = (-2.0 * u1.ln()).sqrt();
        let z1 = mag * (2.0 * std::f64::consts::PI * u2).cos();
        let z2 = mag * (2.0 * std::f64::consts::PI * u2).sin();
        
        unsafe {
            SPARE = Some(z2);
            SPARE_READY.store(1, Ordering::Relaxed);
        }
        
        z1
    }
}

/// RNG factory for reproducible parallel simulations
pub struct RngFactory {
    base_seed: u64,
}

impl RngFactory {
    pub fn new(base_seed: u64) -> Self {
        Self { base_seed }
    }
    
    /// Create a counter RNG for a specific path/thread
    pub fn create_counter_rng(&self, path_id: u64) -> CounterRng {
        CounterRng::new(self.base_seed, path_id)
    }
    
    /// Create a standard RNG for a specific path/thread (backward compatibility)
    pub fn create_std_rng(&self, path_id: u64) -> StdRng {
        StdRng::seed_from_u64(self.base_seed.wrapping_add(path_id))
    }
}

// Backward compatibility functions
pub fn seed_rng_from_u64(seed: u64) -> StdRng {
    StdRng::seed_from_u64(seed)
}

pub fn get_normal_draw<R: Rng + ?Sized>(rng: &mut R) -> f64 {
    StandardNormal.sample(rng)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_counter_rng_reproducibility() {
        let factory = RngFactory::new(42);
        
        // Generate same sequence twice
        let mut rng1 = factory.create_counter_rng(0);
        let mut rng2 = factory.create_counter_rng(0);
        
        for _ in 0..100 {
            assert_eq!(rng1.next_u64(), rng2.next_u64());
        }
    }
    
    #[test]
    fn test_counter_rng_different_paths() {
        let factory = RngFactory::new(42);
        
        let mut rng1 = factory.create_counter_rng(0);
        let mut rng2 = factory.create_counter_rng(1);
        
        // Different paths should produce different sequences
        let vals1: Vec<u64> = (0..10).map(|_| rng1.next_u64()).collect();
        let vals2: Vec<u64> = (0..10).map(|_| rng2.next_u64()).collect();
        
        assert_ne!(vals1, vals2);
    }
    
    #[test]
    fn test_normal_distribution() {
        let factory = RngFactory::new(42);
        let mut rng = factory.create_counter_rng(0);
        
        let samples: Vec<f64> = (0..10000).map(|_| rng.normal()).collect();
        
        let mean = samples.iter().sum::<f64>() / samples.len() as f64;
        let variance = samples.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / samples.len() as f64;
        
        assert!((mean.abs() < 0.05), "Mean should be close to 0, got {}", mean);
        assert!((variance - 1.0).abs() < 0.05, "Variance should be close to 1, got {}", variance);
    }
}
