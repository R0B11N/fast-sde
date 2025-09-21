// src/output.rs
use std::fs::File;
use std::io::{self, Write};

pub fn write_paths_to_csv(filename: &str, paths: &[(f64, f64, f64)]) -> io::Result<()> {
    let mut file = File::create(filename)?;
    writeln!(file, "path_id,s_t,payoff,delta")?;
    for (i, (s_t, payoff, delta)) in paths.iter().enumerate() {
        writeln!(file, "{},{},{},{}", i, s_t, payoff, delta)?;
    }
    Ok(())
}

pub fn write_summary_to_csv(filename: &str, summary_data: &[(&str, &str)]) -> io::Result<()> {
    let mut file = File::create(filename)?;
    for (key, value) in summary_data {
        writeln!(file, "{},{}", key, value)?;
    }
    Ok(())
}
