//! The JSON the project forms added for form coverage write
//! (docs/ui-redesign/formulierdekking.md; NtaZoneData.tsx,
//! NtaCollectiveShare.tsx, the circulation and further-generator forms of
//! NtaPipeGeometry.tsx / NtaSystemSections.tsx) must be read and calculated
//! by the kernel. Each patch mirrors a form template; src/__tests__/
//! nta-form-coverage-project.test.tsx checks that the forms write it.

use nta8800_core::project_performance::assess_project_performance;
use serde_json::{json, Value};

fn office() -> Value {
    serde_json::from_str(include_str!(
        "../../../training-data/nta8800-example-office.json"
    ))
    .unwrap()
}

fn gap_codes(value: &Value) -> (String, Vec<String>) {
    let result = assess_project_performance(value);
    let codes = result
        .gaps
        .iter()
        .map(|gap| format!("{} @ {}", gap.code, gap.path))
        .collect();
    (result.status.to_string(), codes)
}

/// The circulation template of `circulationTemplate()` with its required source filled in.
fn circulation() -> Value {
    json!({ "insulation": "mm15", "fittingsInsulated": true, "floorCount": 2, "lengthM": 30.0,
        "pump": { "control": "constant_pressure" }, "sourceReference": "tekening W-01" })
}

#[test]
fn zone_data_of_the_zone_editor_is_calculated() {
    let base = office();
    let (status, before) = gap_codes(&base);
    let mut value = base;
    // `zoneDataTemplate()` copies the block's internal gains, flows and ventilation.
    let gains = value["ntaCalculation"]["internalGains"].clone();
    let flows = value["ntaCalculation"]["ventilationFlows"].clone();
    let ventilation = value["ntaCalculation"]["ventilation"].clone();
    value["ntaCalculation"]["zoneData"] = json!([{
        "zoneId": "z1",
        "internalGains": gains,
        "ventilationFlows": flows,
        "ventilation": ventilation,
        "usageFunction": "office",
        "functionAreas": [{ "function": "office", "areaM2": 300.0 }, { "function": "retail", "areaM2": 100.0 }],
        "thermalMass": { "floor": "heavy", "wall": "very_heavy", "ceiling": "open_or_none", "sourceReference": "bestek" },
        "sunrooms": [],
    }]);
    let (after_status, after) = gap_codes(&value);
    assert_eq!(after_status, status, "{after:?}");
    assert_eq!(after, before);
}

#[test]
fn circulation_and_further_generators_are_calculated() {
    let base = office();
    let (status, before) = gap_codes(&base);
    let mut value = base;
    value["ntaCalculation"]["hotWater"]["circulation"] = circulation();
    let mut further = value["ntaCalculation"]["hotWater"].clone();
    further["need"]["areas"][0]["areaM2"] = json!(100.0);
    further["circulation"] = circulation();
    further["nominalPowerKw"] = json!(3.0);
    further["additionalGenerators"] = json!([{
        "generator": { "kind": "electric_boiler" }, "nominalPowerKw": 2.0, "equipmentReference": "typeplaat",
    }]);
    value["ntaCalculation"]["hotWater"]["need"]["areas"][0]["areaM2"] = json!(300.0);
    value["ntaCalculation"]["additionalHotWaterSystems"] = json!([further]);
    let (after_status, after) = gap_codes(&value);
    assert_eq!(after_status, status, "{after:?}");
    for gap in &after {
        assert!(before.contains(gap), "new gap {gap} in {after:?}");
    }
}

#[test]
fn collective_pv_swimming_pool_and_lighting_zone_are_read() {
    let base = office();
    let (status, before) = gap_codes(&base);
    let mut value = base;
    value["ntaCalculation"]["pvSystems"][0]["collective"] =
        json!({ "buildingUsableFloorAreaM2": 1200.0, "sourceReference": "NEN 2580 gebouw" });
    value["ntaCalculation"]["lighting"][0]["zoneId"] = json!("z1");
    let (after_status, after) = gap_codes(&value);
    assert_eq!(after_status, status, "{after:?}");
    assert_eq!(after, before);

    // The swimming-pool check only exists for a sport function (§11.2.2.5.1).
    let mut sport = value.clone();
    sport["ntaCalculation"]["ventilation"]["functions"][0] =
        json!({ "function": "sport", "areaM2": 400.0, "swimmingPool": true });
    let (_, codes) = gap_codes(&sport);
    assert!(
        !codes
            .iter()
            .any(|code| code.starts_with("swimming_pool_requires_sport_function")),
        "{codes:?}"
    );
}
