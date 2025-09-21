// src/error.rs
use std::fmt;

/// Custom error types for the fast-sde library
#[derive(Debug, Clone)]
pub enum SdeError {
    /// Invalid parameter values
    InvalidParameters {
        parameter: String,
        value: f64,
        constraint: String,
    },

    /// Numerical instability or convergence failure
    NumericalInstability { method: String, reason: String },

    /// Feller condition violation in Heston model
    FellerConditionViolation {
        kappa: f64,
        theta: f64,
        xi: f64,
        feller_value: f64,
    },

    /// Invalid configuration
    InvalidConfiguration { field: String, reason: String },

    /// Monte Carlo simulation error
    MonteCarloError { paths: usize, reason: String },

    /// Payoff calculation error
    PayoffError { payoff_type: String, reason: String },

    /// RNG or random number generation error
    RandomGenerationError { reason: String },

    /// Calibration error
    CalibrationError {
        reason: String,
        current_error: Option<f64>,
    },

    /// Unsupported operation
    UnsupportedOperation { operation: String, context: String },
}

impl fmt::Display for SdeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SdeError::InvalidParameters {
                parameter,
                value,
                constraint,
            } => {
                write!(
                    f,
                    "Invalid parameter '{}' = {}: {}",
                    parameter, value, constraint
                )
            }
            SdeError::NumericalInstability { method, reason } => {
                write!(f, "Numerical instability in {}: {}", method, reason)
            }
            SdeError::FellerConditionViolation {
                kappa,
                theta,
                xi,
                feller_value,
            } => {
                write!(f,
                    "Feller condition violated: 2κθ = {:.6} ≤ ξ² = {:.6} (κ={}, θ={}, ξ={}). Variance may hit zero.",
                    feller_value, xi * xi, kappa, theta, xi
                )
            }
            SdeError::InvalidConfiguration { field, reason } => {
                write!(f, "Invalid configuration for '{}': {}", field, reason)
            }
            SdeError::MonteCarloError { paths, reason } => {
                write!(
                    f,
                    "Monte Carlo simulation error with {} paths: {}",
                    paths, reason
                )
            }
            SdeError::PayoffError {
                payoff_type,
                reason,
            } => {
                write!(
                    f,
                    "Payoff calculation error for {}: {}",
                    payoff_type, reason
                )
            }
            SdeError::RandomGenerationError { reason } => {
                write!(f, "Random number generation error: {}", reason)
            }
            SdeError::CalibrationError {
                reason,
                current_error,
            } => match current_error {
                Some(err) => write!(
                    f,
                    "Calibration failed (current error: {:.6}): {}",
                    err, reason
                ),
                None => write!(f, "Calibration failed: {}", reason),
            },
            SdeError::UnsupportedOperation { operation, context } => {
                write!(
                    f,
                    "Unsupported operation '{}' in context: {}",
                    operation, context
                )
            }
        }
    }
}

impl std::error::Error for SdeError {}

/// Result type alias for fast-sde operations
pub type SdeResult<T> = Result<T, SdeError>;

/// Validation utilities
pub mod validation {
    use super::{SdeError, SdeResult};

    /// Validate that a parameter is positive
    pub fn validate_positive(name: &str, value: f64) -> SdeResult<()> {
        if value <= 0.0 {
            Err(SdeError::InvalidParameters {
                parameter: name.to_string(),
                value,
                constraint: "must be positive (> 0)".to_string(),
            })
        } else {
            Ok(())
        }
    }

    /// Validate that a parameter is non-negative
    pub fn validate_non_negative(name: &str, value: f64) -> SdeResult<()> {
        if value < 0.0 {
            Err(SdeError::InvalidParameters {
                parameter: name.to_string(),
                value,
                constraint: "must be non-negative (≥ 0)".to_string(),
            })
        } else {
            Ok(())
        }
    }

    /// Validate that a parameter is within a range
    pub fn validate_range(name: &str, value: f64, min: f64, max: f64) -> SdeResult<()> {
        if value < min || value > max {
            Err(SdeError::InvalidParameters {
                parameter: name.to_string(),
                value,
                constraint: format!("must be in range [{}, {}]", min, max),
            })
        } else {
            Ok(())
        }
    }

    /// Validate correlation parameter
    pub fn validate_correlation(name: &str, rho: f64) -> SdeResult<()> {
        validate_range(name, rho, -1.0, 1.0)
    }

    /// Validate that a value is finite and not NaN
    pub fn validate_finite(name: &str, value: f64) -> SdeResult<()> {
        if !value.is_finite() {
            Err(SdeError::InvalidParameters {
                parameter: name.to_string(),
                value,
                constraint: "must be finite (not NaN or infinite)".to_string(),
            })
        } else {
            Ok(())
        }
    }

    /// Validate paths count
    pub fn validate_paths(paths: usize) -> SdeResult<()> {
        if paths == 0 {
            Err(SdeError::InvalidConfiguration {
                field: "paths".to_string(),
                reason: "must be greater than 0".to_string(),
            })
        } else if paths > 1_000_000_000 {
            Err(SdeError::InvalidConfiguration {
                field: "paths".to_string(),
                reason: "exceeds maximum allowed (1 billion)".to_string(),
            })
        } else {
            Ok(())
        }
    }

    /// Validate steps count
    pub fn validate_steps(steps: usize) -> SdeResult<()> {
        if steps == 0 {
            Err(SdeError::InvalidConfiguration {
                field: "steps".to_string(),
                reason: "must be greater than 0".to_string(),
            })
        } else if steps > 100_000 {
            Err(SdeError::InvalidConfiguration {
                field: "steps".to_string(),
                reason: "exceeds maximum allowed (100,000)".to_string(),
            })
        } else {
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::validation::*;
    use super::*;

    #[test]
    fn test_validate_positive() {
        assert!(validate_positive("sigma", 0.2).is_ok());
        assert!(validate_positive("sigma", 0.0).is_err());
        assert!(validate_positive("sigma", -0.1).is_err());
    }

    #[test]
    fn test_validate_correlation() {
        assert!(validate_correlation("rho", 0.5).is_ok());
        assert!(validate_correlation("rho", -0.8).is_ok());
        assert!(validate_correlation("rho", 1.0).is_ok());
        assert!(validate_correlation("rho", -1.0).is_ok());
        assert!(validate_correlation("rho", 1.1).is_err());
        assert!(validate_correlation("rho", -1.1).is_err());
    }

    #[test]
    fn test_validate_finite() {
        assert!(validate_finite("value", 1.0).is_ok());
        assert!(validate_finite("value", f64::NAN).is_err());
        assert!(validate_finite("value", f64::INFINITY).is_err());
        assert!(validate_finite("value", f64::NEG_INFINITY).is_err());
    }

    #[test]
    fn test_error_display() {
        let error = SdeError::InvalidParameters {
            parameter: "sigma".to_string(),
            value: -0.1,
            constraint: "must be positive".to_string(),
        };

        let display = format!("{}", error);
        assert!(display.contains("sigma"));
        assert!(display.contains("-0.1"));
        assert!(display.contains("positive"));
    }

    #[test]
    fn test_feller_condition_error() {
        let error = SdeError::FellerConditionViolation {
            kappa: 1.0,
            theta: 0.04,
            xi: 0.5,
            feller_value: 0.08,
        };

        let display = format!("{}", error);
        assert!(display.contains("Feller condition"));
        assert!(display.contains("0.08"));
        assert!(display.contains("0.25")); // xi^2
    }
}
