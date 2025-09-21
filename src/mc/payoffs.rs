//! Option Payoff Functions
//! 
//! # Mathematical Definitions
//! 
//! This module implements various option payoff functions that operate on
//! simulated asset price paths. Each payoff represents a different contract type.
//! 
//! ## European Options
//! - **Call**: max(S_T - K, 0) - right to buy at strike K
//! - **Put**: max(K - S_T, 0) - right to sell at strike K
//! 
//! ## Path-Dependent Options
//! - **Asian**: Based on average price over the path
//! - **Barrier**: Knocked out if price crosses barrier level
//! 
//! # Implementation Notes
//! 
//! All payoffs operate on the full price path `&[f64]` to support
//! both European (terminal price only) and exotic (full path) options.

use std::f64;

/// Enumeration of supported option payoff types
/// 
/// Each variant contains the parameters needed to compute the payoff
/// from a simulated asset price path.
#[derive(Clone)]
pub enum Payoff {
    /// European call option: max(S_T - K, 0)
    EuropeanCall { k: f64 },
    
    /// European put option: max(K - S_T, 0)  
    EuropeanPut { k: f64 },
    
    /// Asian call option: max(Avg(S_t) - K, 0)
    AsianCall { k: f64 },
    
    /// Up-and-out barrier call: max(S_T - K, 0) if max(S_t) < H, else 0
    BarrierCallUpAndOut { k: f64, h: f64 },
    
    /// Up-and-out barrier put: max(K - S_T, 0) if max(S_t) < H, else 0
    BarrierPutUpAndOut { k: f64, h: f64 },
}

impl Payoff {
    /// Calculate payoff value from a simulated asset price path
    /// 
    /// # Parameters
    /// - `path`: Complete asset price path [S_0, S_1, ..., S_T]
    /// 
    /// # Returns
    /// Non-negative payoff value (options cannot have negative intrinsic value)
    /// 
    /// # Mathematical Implementations
    /// 
    /// Each payoff type implements its specific mathematical definition:
    pub fn calculate(&self, path: &[f64]) -> f64 {
        match self {
            // European Call: max(S_T - K, 0)
            // Uses only terminal price (last element of path)
            Payoff::EuropeanCall { k } => (path.last().unwrap() - k).max(0.0),
            
            // European Put: max(K - S_T, 0)
            // Uses only terminal price (last element of path)
            Payoff::EuropeanPut { k } => (k - path.last().unwrap()).max(0.0),
            
            // Asian Call: max(A - K, 0) where A = (1/n)∑S_i
            // Arithmetic average of all prices in the path
            Payoff::AsianCall { k } => {
                let average_price: f64 = path.iter().sum::<f64>() / path.len() as f64;
                (average_price - k).max(0.0)
            }
            
            // Barrier Call Up-and-Out: max(S_T - K, 0) if max(S_t) < H, else 0
            // Knocked out if price ever touches or exceeds barrier H
            Payoff::BarrierCallUpAndOut { k, h } => {
                let mut knocked_out = false;
                for &price in path {
                    if price >= *h {
                        knocked_out = true;
                        break; // Early termination for efficiency
                    }
                }
                if knocked_out { 0.0 } else { (path.last().unwrap() - k).max(0.0) }
            }
            
            // Barrier Put Up-and-Out: max(K - S_T, 0) if max(S_t) < H, else 0
            // Knocked out if price ever touches or exceeds barrier H
            Payoff::BarrierPutUpAndOut { k, h } => {
                let mut knocked_out = false;
                for &price in path {
                    if price >= *h {
                        knocked_out = true;
                        break; // Early termination for efficiency
                    }
                }
                if knocked_out { 0.0 } else { (k - path.last().unwrap()).max(0.0) }
            }
        }
    }
}