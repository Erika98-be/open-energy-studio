//! Gas-driven heat-pump month terms from NTA 8800:2025+C1:2026 formula 9.62
//! (p. 331–332) and §9.6.8.1.1.2.3 (p. 362).
//! Carrier allocation, gas input and auxiliaries require a separate audit.

use crate::final_energy_draft::MonthlyEnergy;
use crate::forfait_heat_pump_monthly_draft::SourceSystem;
use crate::gas_heat_pump_forfait_draft::{
    assess_gas_heat_pump_forfait_draft, GasHeatPumpForfaitDraftInput, GasPumpSource,
};
use crate::{input_fingerprint, KERNEL_VERSION};
use serde::{Deserialize, Serialize};
use serde_json::json;

const DRAFT_SOURCE: &str =
    "NTA 8800:2025+C1:2026, formule 9.62 (p. 331–332) en §9.6.8.1.1.2.3 (p. 362)";

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GasHeatPumpMonthlyDraftInput {
    pub forfait: GasHeatPumpForfaitDraftInput,
    pub generator_output_kwh: Vec<MonthlyEnergy>,
    pub generator_output_reference: String,
    pub source_system: SourceSystem,
    pub source_system_reference: String,
    #[serde(default)]
    pub collective_source_temperature_c: Option<f64>,
    #[serde(default)]
    pub collective_source_temperature_reference: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GasHeatPumpMonthlyDraftAssessment {
    pub status: &'static str,
    pub scope: &'static str,
    pub draft_source: &'static str,
    pub target_norm_version: &'static str,
    pub kernel_version: &'static str,
    pub input_fingerprint: String,
    pub corrected_cop: Option<f64>,
    pub collective_source_correction_factor: Option<f64>,
    pub monthly: Vec<GasHeatPumpMonthlyTerm>,
    pub generator_output_derived: bool,
    pub collective_source_heat_derived: bool,
    pub carrier_allocation_available: bool,
    pub gas_input_energy_available: bool,
    pub auxiliaries_included: bool,
    pub final_edition_verified: bool,
    pub reference_verified: bool,
    pub beng_calculation_available: bool,
    pub issues: Vec<GasMonthlyIssue>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GasHeatPumpMonthlyTerm {
    pub month: u8,
    pub generator_output_kwh: f64,
    pub collective_source_heat_kwh: f64,
    pub uncorrected_input_term_kwh: f64,
    pub collective_source_correction_term_kwh: f64,
    pub equation_962_input_term_kwh: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GasMonthlyIssue {
    pub code: &'static str,
    pub path: String,
}

fn issue(code: &'static str, path: impl Into<String>) -> GasMonthlyIssue {
    GasMonthlyIssue {
        code,
        path: path.into(),
    }
}

pub fn assess_gas_heat_pump_monthly_draft(
    input: &GasHeatPumpMonthlyDraftInput,
) -> GasHeatPumpMonthlyDraftAssessment {
    let mut issues = Vec::new();
    let lookup = assess_gas_heat_pump_forfait_draft(&input.forfait);
    if lookup.status == "invalid" || lookup.corrected_cop.is_none() {
        if lookup.issues.is_empty() {
            issues.push(issue("forfait_lookup_invalid", "forfait"));
        }
        for problem in &lookup.issues {
            issues.push(issue(problem.code, format!("forfait.{}", problem.path)));
        }
    }
    if input.generator_output_reference.trim().is_empty() {
        issues.push(issue("source_required", "generatorOutputReference"));
    }
    if input.source_system_reference.trim().is_empty() {
        issues.push(issue("source_required", "sourceSystemReference"));
    }
    let compatible = match input.source_system {
        SourceSystem::Individual => true,
        SourceSystem::CollectiveGround => input.forfait.source == GasPumpSource::Ground,
        SourceSystem::CollectiveGroundwaterSurfaceOrAtLeast15C => matches!(
            input.forfait.source,
            GasPumpSource::GroundwaterAquifer | GasPumpSource::SurfaceWater
        ),
    };
    if !compatible {
        issues.push(issue("source_system_mismatch", "sourceSystem"));
    }
    let ground_collective = input.source_system == SourceSystem::CollectiveGround
        && input.forfait.source == GasPumpSource::Ground;
    if ground_collective && crate::norm_versions::profile().collective_source_correction {
        if !input
            .collective_source_temperature_c
            .is_some_and(f64::is_finite)
        {
            issues.push(issue(
                "collective_source_temperature_required",
                "collectiveSourceTemperatureC",
            ));
        }
        if input
            .collective_source_temperature_reference
            .as_deref()
            .map_or(true, |value| value.trim().is_empty())
        {
            issues.push(issue(
                "source_required",
                "collectiveSourceTemperatureReference",
            ));
        }
    } else if !ground_collective || !crate::norm_versions::profile().collective_source_correction {
        if input.collective_source_temperature_c.is_some() {
            issues.push(issue(
                "collective_source_temperature_not_applicable",
                "collectiveSourceTemperatureC",
            ));
        }
        if input.collective_source_temperature_reference.is_some() {
            issues.push(issue(
                "collective_source_temperature_not_applicable",
                "collectiveSourceTemperatureReference",
            ));
        }
    }
    let mut months = [None; 12];
    let mut present = [false; 12];
    for (index, item) in input.generator_output_kwh.iter().enumerate() {
        if !(1..=12).contains(&item.month) {
            issues.push(issue(
                "month_out_of_range",
                format!("generatorOutputKwh[{index}].month"),
            ));
            continue;
        }
        let month_index = usize::from(item.month - 1);
        if present[month_index] {
            issues.push(issue(
                "month_duplicate",
                format!("generatorOutputKwh[{index}].month"),
            ));
            continue;
        }
        present[month_index] = true;
        if !item.energy_kwh.is_finite() || item.energy_kwh < 0.0 {
            issues.push(issue(
                "monthly_heat_invalid",
                format!("generatorOutputKwh[{index}].energyKwh"),
            ));
        } else {
            months[month_index] = Some(item.energy_kwh);
        }
    }
    if present.contains(&false) {
        issues.push(issue("months_incomplete", "generatorOutputKwh"));
    }
    let collective = input.source_system != SourceSystem::Individual;
    // (9.62) f_cor.bron.col: 2025+C1 only (2024 p. 314–315 has none).
    // The ≥15 °C branch on p. 332 also applies to a collective ground source.
    let factor = match input.source_system {
        _ if !crate::norm_versions::profile().collective_source_correction => 0.0,
        SourceSystem::Individual => 0.0,
        SourceSystem::CollectiveGround => {
            if input
                .collective_source_temperature_c
                .is_some_and(|value| value >= 15.0)
            {
                0.022
            } else {
                0.009
            }
        }
        SourceSystem::CollectiveGroundwaterSurfaceOrAtLeast15C => 0.022,
    };
    let mut monthly = Vec::new();
    if issues.is_empty() {
        let cop = lookup.corrected_cop.expect("valid lookup checked");
        for (index, value) in months.iter().enumerate() {
            let output = value.expect("complete months checked");
            let uncorrected = output / cop;
            let source_heat = if collective {
                output * (1.0 - 1.0 / cop)
            } else {
                0.0
            };
            let correction = source_heat * factor;
            let term = uncorrected - correction;
            if !uncorrected.is_finite()
                || !source_heat.is_finite()
                || source_heat < 0.0
                || source_heat > output
                || !correction.is_finite()
                || !term.is_finite()
                || term < 0.0
            {
                issues.push(issue(
                    "input_term_invalid",
                    format!("generatorOutputKwh[{index}]"),
                ));
                break;
            }
            monthly.push(GasHeatPumpMonthlyTerm {
                month: (index + 1) as u8,
                generator_output_kwh: output,
                collective_source_heat_kwh: source_heat,
                uncorrected_input_term_kwh: uncorrected,
                collective_source_correction_term_kwh: correction,
                equation_962_input_term_kwh: term,
            });
        }
    }
    if !issues.is_empty() {
        monthly.clear();
    }
    GasHeatPumpMonthlyDraftAssessment {
        status: if issues.is_empty() {
            "diagnostic_valid"
        } else {
            "invalid"
        },
        scope: "public_chapter_9_draft_equation_9_62_gas_pump_terms_without_carrier_allocation",
        draft_source: crate::norm_versions::cite(DRAFT_SOURCE),
        target_norm_version: crate::norm_versions::current_label(),
        kernel_version: KERNEL_VERSION,
        input_fingerprint: input_fingerprint(&json!(input)),
        corrected_cop: if issues.is_empty() {
            lookup.corrected_cop
        } else {
            None
        },
        collective_source_correction_factor: if issues.is_empty() {
            Some(factor)
        } else {
            None
        },
        monthly,
        generator_output_derived: false,
        collective_source_heat_derived: collective && issues.is_empty(),
        carrier_allocation_available: false,
        gas_input_energy_available: false,
        auxiliaries_included: false,
        final_edition_verified: false,
        reference_verified: false,
        beng_calculation_available: false,
        issues,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn sample(source: &str, system: SourceSystem) -> GasHeatPumpMonthlyDraftInput {
        serde_json::from_value(json!({
            "forfait":{
                "generatorId":"gwp-1", "drive":"absorption", "application":"utility",
                "applicationReference":"office schedule", "collectiveBuildingInstallation":false,
                "externalHeatSupply":false, "thermalCapacityKw":40.0, "capacityReference":"plate",
                "source":source, "sourceReference":"source plan",
                "designSupplyTemperatureC":35.0, "designSupplyReference":"heating design"
            },
            "generatorOutputKwh":(1..=12).map(|month| json!({"month":month,"energyKwh":1000.0})).collect::<Vec<_>>(),
            "generatorOutputReference":"monthly heat ledger", "sourceSystem":system,
            "sourceSystemReference":"source design"
        })).unwrap()
    }

    #[test]
    fn legacy_collective_ground_rejects_ignored_temperature_evidence() {
        let mut input = sample("ground", SourceSystem::CollectiveGround);
        input.collective_source_temperature_c = Some(14.9);
        input.collective_source_temperature_reference = Some("source design".into());
        let legacy =
            crate::norm_versions::with_version(crate::norm_versions::NormVersion::V2024, || {
                assess_gas_heat_pump_monthly_draft(&input)
            });
        assert_eq!(legacy.status, "invalid");
        assert!(legacy.issues.iter().any(|item| {
            item.code == "collective_source_temperature_not_applicable"
                && item.path == "collectiveSourceTemperatureC"
        }));
        assert!(legacy.issues.iter().any(|item| {
            item.code == "collective_source_temperature_not_applicable"
                && item.path == "collectiveSourceTemperatureReference"
        }));
        assert!(legacy.monthly.is_empty());
        assert!(legacy.corrected_cop.is_none());

        input.collective_source_temperature_c = None;
        input.collective_source_temperature_reference = None;
        let without_ignored_fields =
            crate::norm_versions::with_version(crate::norm_versions::NormVersion::V2024, || {
                assess_gas_heat_pump_monthly_draft(&input)
            });
        assert_eq!(without_ignored_fields.status, "diagnostic_valid");
        assert_eq!(
            without_ignored_fields.collective_source_correction_factor,
            Some(0.0)
        );
    }

    #[test]
    fn individual_air_and_collective_water_keep_962_terms_without_gas_claim() {
        let individual =
            assess_gas_heat_pump_monthly_draft(&sample("outdoor_air", SourceSystem::Individual));
        assert_eq!(individual.status, "diagnostic_valid");
        assert_eq!(individual.corrected_cop, Some(1.6));
        assert!((individual.monthly[0].equation_962_input_term_kwh - 625.0).abs() < 1e-10);
        assert_eq!(individual.monthly[0].collective_source_heat_kwh, 0.0);
        assert!(!individual.gas_input_energy_available && !individual.carrier_allocation_available);
        let collective = assess_gas_heat_pump_monthly_draft(&sample(
            "groundwater_aquifer",
            SourceSystem::CollectiveGroundwaterSurfaceOrAtLeast15C,
        ));
        assert_eq!(collective.corrected_cop, Some(2.1));
        let heat = 1000.0 * (1.0 - 1.0 / 2.1);
        assert!((collective.monthly[0].collective_source_heat_kwh - heat).abs() < 1e-10);
        assert!(
            (collective.monthly[0].collective_source_correction_term_kwh - heat * 0.022).abs()
                < 1e-10
        );
        assert!(
            (collective.monthly[0].equation_962_input_term_kwh - (1000.0 / 2.1 - heat * 0.022))
                .abs()
                < 1e-10
        );
        let mut ground_input = sample("ground", SourceSystem::CollectiveGround);
        ground_input.forfait.drive = crate::gas_heat_pump_forfait_draft::GasPumpDrive::GasEngine;
        ground_input.collective_source_temperature_c = Some(14.9);
        ground_input.collective_source_temperature_reference = Some("source design".into());
        let ground = assess_gas_heat_pump_monthly_draft(&ground_input);
        assert_eq!(ground.status, "diagnostic_valid");
        assert_eq!(ground.collective_source_correction_factor, Some(0.009));
        assert!((ground.monthly[0].equation_962_input_term_kwh - 621.625).abs() < 1e-10);
        ground_input.collective_source_temperature_c = Some(15.0);
        let warmer_ground = assess_gas_heat_pump_monthly_draft(&ground_input);
        assert_eq!(warmer_ground.status, "diagnostic_valid");
        assert_eq!(
            warmer_ground.collective_source_correction_factor,
            Some(0.022)
        );
        assert!(
            warmer_ground.monthly[0].equation_962_input_term_kwh
                < ground.monthly[0].equation_962_input_term_kwh
        );
        ground_input.collective_source_temperature_c = None;
        let missing = assess_gas_heat_pump_monthly_draft(&ground_input);
        assert_eq!(missing.status, "invalid");
        assert!(missing.monthly.is_empty());
        assert!(missing
            .issues
            .iter()
            .any(|issue| issue.code == "collective_source_temperature_required"));
        ground_input.collective_source_temperature_c = Some(15.0);
        ground_input.collective_source_temperature_reference = None;
        let unreferenced = assess_gas_heat_pump_monthly_draft(&ground_input);
        assert_eq!(unreferenced.status, "invalid");
        assert!(unreferenced.monthly.is_empty());
    }

    #[test]
    fn mismatched_source_incomplete_months_and_overflow_emit_no_terms() {
        let mut input = sample("outdoor_air", SourceSystem::CollectiveGround);
        assert!(assess_gas_heat_pump_monthly_draft(&input)
            .monthly
            .is_empty());
        input.source_system = SourceSystem::Individual;
        input.generator_output_kwh.pop();
        let incomplete = assess_gas_heat_pump_monthly_draft(&input);
        assert!(incomplete.monthly.is_empty());
        assert!(incomplete
            .issues
            .iter()
            .any(|item| item.code == "months_incomplete"));
        input.generator_output_kwh.push(MonthlyEnergy {
            month: 12,
            energy_kwh: 1000.0,
        });
        input.forfait.application =
            crate::gas_heat_pump_forfait_draft::GasPumpApplication::ResidentialCollectiveAtMost25Kw;
        input.forfait.collective_building_installation = true;
        input.forfait.thermal_capacity_kw = 20.0;
        input.forfait.source = GasPumpSource::Ground;
        input.forfait.source_correction_factor = Some(0.1);
        input.forfait.source_correction_reference = Some("supplied source correction".into());
        input.generator_output_kwh[0].energy_kwh = f64::MAX;
        let invalid = assess_gas_heat_pump_monthly_draft(&input);
        assert_eq!(invalid.status, "invalid");
        assert!(invalid.monthly.is_empty() && invalid.corrected_cop.is_none());
    }

    #[test]
    fn invalid_forfait_field_is_exposed_at_its_submitted_path() {
        let mut input = sample("outdoor_air", SourceSystem::Individual);
        input.forfait.capacity_reference.clear();
        let result = assess_gas_heat_pump_monthly_draft(&input);
        assert_eq!(result.status, "invalid");
        assert!(result.issues.iter().any(|item| {
            item.code == "source_required" && item.path == "forfait.capacityReference"
        }));
        assert!(!result
            .issues
            .iter()
            .any(|item| item.code == "forfait_lookup_invalid"));
        assert!(result.monthly.is_empty());
        assert!(result.corrected_cop.is_none());
    }

    #[test]
    fn invalid_monthly_heat_does_not_claim_a_present_month_is_missing() {
        let mut input = sample("outdoor_air", SourceSystem::Individual);
        input.generator_output_kwh[0].energy_kwh = -1.0;
        let result = assess_gas_heat_pump_monthly_draft(&input);
        assert_eq!(result.status, "invalid");
        assert!(result.issues.iter().any(|item| {
            item.code == "monthly_heat_invalid" && item.path == "generatorOutputKwh[0].energyKwh"
        }));
        assert!(!result
            .issues
            .iter()
            .any(|item| item.code == "months_incomplete"));
        assert!(result.monthly.is_empty());
        assert!(result.corrected_cop.is_none());

        input.generator_output_kwh.push(MonthlyEnergy {
            month: 1,
            energy_kwh: 1000.0,
        });
        let duplicate = assess_gas_heat_pump_monthly_draft(&input);
        assert!(duplicate.issues.iter().any(|item| {
            item.code == "month_duplicate" && item.path == "generatorOutputKwh[12].month"
        }));
        assert!(!duplicate
            .issues
            .iter()
            .any(|item| item.code == "months_incomplete"));
        assert!(duplicate.monthly.is_empty());
    }
}
