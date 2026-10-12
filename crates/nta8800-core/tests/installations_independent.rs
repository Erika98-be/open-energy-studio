//! Review 66: installation routes the two example projects do not reach, recalculated independently
//! from NTA 8800:2025+C1:2026 (heat pumps forfait and declared, hybrid, booster, external heat with and
//! without a declaration, CHP method 2, biomass, electric boilers, collective boilers with priority, hot-water
//! storage, shower heat recovery, cooling generators of method 3, external cold, PV with a battery). Every case
//! is an ISSO 54 v2.0 deeltest (training-data/reference-suites/isso54-v2.json) run in 2025+C1, optionally
//! with a small edit. The expected values come from a separate implementation written from the norm pages;
//! only numbers and page references are kept here.

use nta8800_core::project_performance::assess_project_performance;
use serde_json::Value;

const BASE: &str = include_str!("../../../training-data/isso54/EPW001.json");
const SUITE: &str = include_str!("../../../training-data/reference-suites/isso54-v2.json");

fn set(doc: &mut Value, pointer: &str, value: Option<Value>) {
    let parts: Vec<String> = pointer
        .split('/')
        .skip(1)
        .map(|part| part.replace("~1", "/").replace("~0", "~"))
        .collect();
    let (last, path) = parts.split_last().expect("pointer");
    let mut current = doc;
    for part in path {
        current = if current.is_array() {
            &mut current[part.parse::<usize>().expect("index")]
        } else {
            current
                .as_object_mut()
                .expect("object")
                .entry(part.clone())
                .or_insert_with(|| Value::Object(Default::default()))
        };
    }
    match (current, value) {
        (Value::Array(items), None) => {
            items.remove(last.parse::<usize>().expect("index"));
        }
        (Value::Array(items), Some(value)) => items[last.parse::<usize>().expect("index")] = value,
        (Value::Object(map), None) => {
            map.remove(last);
        }
        (Value::Object(map), Some(value)) => {
            map.insert(last.clone(), value);
        }
        _ => panic!("pointer {pointer}"),
    }
}

/// The case's project in 2025+C1 (default edition; the 2022/2023 emission block is dropped) with the edits.
fn performance(case: &str, edits: &str) -> Value {
    let mut project: Value = serde_json::from_str(BASE).expect("base");
    let suite: Value = serde_json::from_str(SUITE).expect("suite");
    let wanted = format!("isso54-v2-{case}");
    let entry = suite["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|item| item["caseId"] == wanted.as_str())
        .expect("case");
    assert_eq!(entry["projectFile"], "../isso54/EPW001.json");
    for op in entry["projectPatch"].as_array().expect("patch") {
        let pointer = op["pointer"].as_str().expect("pointer");
        let value = (op["op"] != "remove").then(|| op["value"].clone());
        set(&mut project, pointer, value);
    }
    let block = project["ntaCalculation"].as_object_mut().expect("block");
    block.remove("normVersion");
    if let Some(emission) = block.get_mut("emission").and_then(Value::as_object_mut) {
        emission.remove("edition2023");
    }
    let edits: Value = serde_json::from_str(edits).expect("edits");
    for edit in edits.as_array().expect("edits") {
        let pointer = edit["pointer"].as_str().expect("pointer");
        let value = (edit["op"] != "remove").then(|| edit["value"].clone());
        set(&mut project, pointer, value);
    }
    let result = assess_project_performance(&project);
    assert_eq!(
        result.status, "calculated_unverified",
        "{case}: {:?}",
        result.gaps
    );
    serde_json::to_value(result.performance.expect("performance")).expect("serializable")
}

fn row<'a>(p: &'a Value, service: &str, carrier: &str) -> &'a Value {
    p["energyByService"]["annual"]
        .as_array()
        .expect("rows")
        .iter()
        .find(|row| row["service"] == service && row["carrier"] == carrier)
        .expect("service row")
}

fn renewable(p: &Value, service: &str, month: u64) -> f64 {
    p["energyByService"]["renewable"]
        .as_array()
        .expect("renewable")
        .iter()
        .find(|row| row["service"] == service && row["month"] == month)
        .map_or(0.0, |row| {
            row["renewablePrimaryKwh"].as_f64().expect("number")
        })
}

fn close(label: &str, kernel: f64, expected: f64) {
    let diff = (kernel - expected).abs();
    let scale = kernel.abs().max(expected.abs()).max(1e-12);
    assert!(
        diff <= 1e-9 || diff / scale <= 1e-6,
        "{label}: kernel {kernel} independent {expected}"
    );
}

/// External heat with an annex P declaration on calculated values (9.6.7, p. 355-356): f_prac 0,95 in the
/// delivered energy of chapter 5, renewable 5.39g on Q_H;gen;out (p. 112), auxiliary 9.91 (p. 364-365); the
/// EMGforf run takes the forfait factors and f_prac 1 (5.3.1.3).
#[test]
fn external_heat_declaration_with_calculated_values() {
    let p = performance("EPW204i", r#"[]"#);
    close(
        "EPW204i W_H;gen;aux m1",
        p["spaceHeating"]["monthly"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        23.31147424060753,
    );
    close(
        "EPW204i delivered dh heating",
        row(&p, "heating", "dh")["deliveredKwh"]
            .as_f64()
            .expect("number"),
        4829.62758237179,
    );
    close(
        "EPW204i E_P dh heating (fP 0.5)",
        row(&p, "heating", "dh")["primaryFossilKwh"]
            .as_f64()
            .expect("number"),
        2414.813791185895,
    );
    close(
        "EPW204i E_Pren;dh 5.39g m1",
        renewable(&p, "heating", 1),
        413.47485743568706,
    );
    close(
        "EPW204i E_P;tot",
        p["annualPrimaryFossilKwh"].as_f64().expect("number"),
        7818.489537343233,
    );
    close(
        "EPW204i EMGforf E_P;tot",
        p["externalSupply"]["forfaitPrimaryFossilKwh"]
            .as_f64()
            .expect("number"),
        9533.00732908522,
    );
}

/// Central biomass boiler outside the thermal boundary, table 9.30 0,750 (p. 341), auxiliary 9.91/9.92 with
/// 10 W/kW automatic feed and t_on capped at t_mi (p. 364-365), bmB renewable 5.39 (p. 112).
#[test]
fn biomass_boiler_outside_with_capped_operating_time() {
    let p = performance(
        "EPW204c",
        r#"[{"pointer": "/ntaCalculation/generator/appliance", "value": "central_boiler"}, {"pointer": "/ntaCalculation/generator/location", "value": "outside_thermal_boundary"}, {"pointer": "/ntaCalculation/generator/automaticFuelFeed", "value": true}, {"pointer": "/ntaCalculation/generator/auxiliary", "value": {"electricallyConnectedDevices": 1, "nominalPowerKw": 2.0, "sourceReference": "r66 synthetic: small P_gen so t_on hits t_mi in winter"}}]"#,
    );
    close(
        "bio-boiler-out E_H;bm m1",
        p["spaceHeating"]["monthly"][0]["biomassKwh"]
            .as_f64()
            .expect("number"),
        1810.6928026450066,
    );
    close(
        "bio-boiler-out W_H;aux m1",
        p["spaceHeating"]["monthly"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        22.32,
    );
    close(
        "bio-boiler-out E_Pren;bmB m1",
        renewable(&p, "heating", 1),
        679.0098009918775,
    );
    close(
        "bio-boiler-out E_P;tot",
        p["annualPrimaryFossilKwh"].as_f64().expect("number"),
        8379.095063719344,
    );
}

/// Micro-CHP method 2, table 9.31 HRe 0,83/0,10 (p. 343), electricity 16.12 (p. 686), the monthly balance
/// 5.22-5.26 and the export credit at f_P 1,45 (5.10-5.13, p. 84-92).
#[test]
fn chp_method_2_with_export() {
    let p = performance("EPW204f", r#"[]"#);
    close(
        "EPW204f E_H;gas m1",
        p["spaceHeating"]["monthly"][0]["naturalGasKwh"]
            .as_f64()
            .expect("number"),
        1673.5299168462418,
    );
    close(
        "EPW204f E_el;chp;out;H m1",
        p["spaceHeating"]["monthly"][0]["chpElectricityKwh"]
            .as_f64()
            .expect("number"),
        167.35299168462421,
    );
    close(
        "EPW204f W_H;aux m1",
        p["spaceHeating"]["monthly"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        14.383469285945733,
    );
    close(
        "EPW204f exported el m1",
        p["electricityBalance"][0]["exportedKwh"]
            .as_f64()
            .expect("number"),
        113.7368966053311,
    );
    close(
        "EPW204f E_P;tot",
        p["annualPrimaryFossilKwh"].as_f64().expect("number"),
        10105.301597193567,
    );
}

/// Outdoor-air heat pump with a declared COP 3,137: rounded down to a multiple of 0,05 (9.1, p. 285) and
/// f_prac 0,95 (NEN question 3, kernel reading); auxiliary 9.85 (p. 359-360); renewable 5.31 (p. 103).
#[test]
fn declared_heat_pump_cop() {
    let p = performance(
        "EPW203d",
        r#"[{"pointer": "/ntaCalculation/generator/forfait/source", "value": "outdoor_air"}, {"pointer": "/ntaCalculation/generator/forfait/designSupplyTemperatureC", "value": 35.0}, {"pointer": "/ntaCalculation/generator/forfait/sourceCorrectionFactor", "op": "remove"}, {"pointer": "/ntaCalculation/generator/forfait/sourceCorrectionReference", "op": "remove"}, {"pointer": "/ntaCalculation/generator/forfait/qualityDeclaration", "value": {"declarationReference": "r66 synthetic BCRG", "generationEfficiency": 3.137}}]"#,
    );
    close(
        "hp-air-decl E_H;el m1",
        p["spaceHeating"]["monthly"][0]["generatorElectricityKwh"]
            .as_f64()
            .expect("number"),
        473.5529408403193,
    );
    close(
        "hp-air-decl W_H;aux m1",
        p["spaceHeating"]["monthly"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        33.41618485282008,
    );
    close(
        "hp-air-decl annual ambient heat",
        p["annualHeatPumpAmbientHeatKwh"].as_f64().expect("number"),
        3085.3839018823965,
    );
}

/// Hybrid heat pump: beta 9.56 and table 9.23 (p. 323-324), table 9.27 outdoor air 45 C 2,30 (p. 333),
/// table 9.25 supplementary HR107 LT 0,95 (p. 327), auxiliary 9.85 per appliance (p. 359-360).
#[test]
fn hybrid_heat_pump_single_zone() {
    let p = performance(
        "EPW001",
        r#"[{"pointer": "/ntaCalculation/generator/kind", "value": "hybrid_heat_pump"}, {"pointer": "/ntaCalculation/generator/designContext", "value": "new_build"}, {"pointer": "/ntaCalculation/generator/generators", "value": [{"id": "wp", "class": "heat_pump", "classificationReference": "ISSO 54 v2.0 EP-W203m: warmtepomp", "nominalThermalPowerKw": 10.0, "powerReference": "ISSO 54 v2.0 EP-W203m: 10 kW", "priorityEfficiency": 2.3, "efficiencyReference": "tabel 9.27 (2022) of de kwaliteitsverklaring"}, {"id": "ketel", "class": "other_boiler", "classificationReference": "ISSO 54 v2.0 EP-W203m: HR107-ketel", "nominalThermalPowerKw": 35.0, "powerReference": "ISSO 54 v2.0 EP-W203m: 35 kW", "priorityEfficiency": 0.95, "efficiencyReference": "tabel 9.25 (2022)"}]}, {"pointer": "/ntaCalculation/generator/forfait", "value": {"generatorId": "wp", "classificationSourceReference": "ISSO 54 v2.0 EP-W203m: elektrische lucht/waterwarmtepomp op buitenlucht", "scope": "residential_at_most25_kw", "source": "outdoor_air", "sink": "hydronic", "designSupplyTemperatureC": 45.0, "thermalCapacityKw": 10.0, "capacitySourceReference": "ISSO 54 v2.0 EP-W203m: vermogen warmtepomp 10 kW", "collectiveBuildingInstallation": false}}, {"pointer": "/ntaCalculation/generator/boiler/generatorId", "value": "ketel"}, {"pointer": "/ntaCalculation/generator/boiler/role", "value": "individual_supplementary"}, {"pointer": "/ntaCalculation/generator/boiler/equipmentReference", "value": "ISSO 54 v2.0 EP-W203m: HR107-ketel CW4, 35 kW, bijstook"}, {"pointer": "/ntaCalculation/generator/sourceSystem", "value": "individual"}, {"pointer": "/ntaCalculation/generator/sourceSystemReference", "value": "ISSO 54 v2.0 EP-W203m: individuele installatie binnen de thermische schil"}, {"pointer": "/ntaCalculation/heatPumpRenewable", "value": {"sourceBelow20C": true, "exhaustAirSource": false, "sourceReference": "ISSO 54 v2.0 EP-W203m: buitenlucht"}}]"#,
    );
    close(
        "hybrid-1zone Q_hp;out m1",
        p["spaceHeating"]["monthly"][0]["heatPumpOutputKwh"]
            .as_f64()
            .expect("number"),
        616.7290416537185,
    );
    close(
        "hybrid-1zone E_H;gas m1",
        p["spaceHeating"]["monthly"][0]["naturalGasKwh"]
            .as_f64()
            .expect("number"),
        818.8256517063388,
    );
    close(
        "hybrid-1zone W_H;aux m1",
        p["spaceHeating"]["monthly"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        35.413559439386766,
    );
}

/// Three collective boilers by priority (9.56-9.60, table 9.23, p. 322-324), table 9.25 collective HT
/// (p. 328), pilot flames 695 kWh/year x f_gebouw (p. 326), auxiliary 9.91 with f_gebouw (p. 364).
#[test]
fn three_collective_boilers_with_pilot_flames() {
    let p = performance("EPW205c", r#"[]"#);
    close(
        "EPW205c E_H;gas m1",
        p["spaceHeating"]["monthly"][0]["naturalGasKwh"]
            .as_f64()
            .expect("number"),
        1174.654243771543,
    );
    close(
        "EPW205c E_H;gas m6",
        p["spaceHeating"]["monthly"][5]["naturalGasKwh"]
            .as_f64()
            .expect("number"),
        11.424657534246576,
    );
    close(
        "EPW205c W_H;gen;aux m1",
        p["spaceHeating"]["monthly"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        9.60648497287223,
    );
}

/// Indirect VR boiler outside the boundary, table 13.28 0,75 (p. 645), 150 l label C vessel in an unheated
/// space, 13.59 with table 13.9 (p. 567-570), auxiliary 13.181 with 10 W standby (p. 647-648).
#[test]
fn indirect_vr_boiler_outside_with_label_c_vessel() {
    let p = performance(
        "EPW404a",
        r#"[{"pointer": "/ntaCalculation/hotWater/generator", "value": {"kind": "indirect_boiler", "boiler": "vr", "oil": false, "insideBoundary": false, "alsoSpaceHeating": false}}, {"pointer": "/ntaCalculation/hotWater/storage", "value": [{"id": "vat-1", "volumeL": 150.0, "loss": {"method": "label", "label": "c"}, "connectionFactor": 3, "inHeatedZone": false, "sourceReference": "r66 synthetic"}]}]"#,
    );
    close(
        "dhw-ind-out Q_W;sto;ls m1",
        p["hotWater"]["months"][0]["storageLossKwh"]
            .as_f64()
            .expect("number"),
        150.07649090190196,
    );
    close(
        "dhw-ind-out E_W;in m1",
        p["hotWater"]["months"][0]["naturalGasKwh"]
            .as_f64()
            .expect("number"),
        509.1005043003109,
    );
    close(
        "dhw-ind-out W_W;aux m1",
        p["hotWater"]["months"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        7.860007916047756,
    );
}

/// Electric boiler with a measured standby loss: 13.60 rounded up by annex X (2,083 -> 2,2 W/K, p. 568,
/// 1129-1130), 90 C for a boiling-water tap and the zone setpoint of 7.9.4 as ambient (13.58, p. 567).
#[test]
fn electric_boiler_with_measured_standby_and_boiling_tap() {
    let p = performance("EPW404c", r#"[]"#);
    close(
        "EPW404c Q_W;sto;ls m1",
        p["hotWater"]["months"][0]["storageLossKwh"]
            .as_f64()
            .expect("number"),
        119.41750358584353,
    );
    close(
        "EPW404c E_W;in m1",
        p["hotWater"]["months"][0]["electricityKwh"]
            .as_f64()
            .expect("number"),
        351.1663909091747,
    );
}

/// Booster heat pump with the forfait values, 13.162/13.163 (p. 632-633): 45 C held at 44 C, c_W;gen from
/// table 13.27 (individual hot-water heat pump, 13.8.4.7.3 c, p. 643-644).
#[test]
fn booster_heat_pump_forfait() {
    let p = performance("EPW406i", r#"[]"#);
    close(
        "EPW406i E_W;gen;in;prac;BWP;hj m1",
        p["hotWater"]["months"][0]["heatingSystemLoadKwh"]
            .as_f64()
            .expect("number"),
        280.540976745091,
    );
    close(
        "EPW406i W_W;aux;gen m1",
        p["hotWater"]["months"][0]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        67.65988262675725,
    );
}

/// Shower heat recovery with two units, 13.51/13.53 with table 13.8 (p. 563-565) and 13.9 (p. 532).
#[test]
fn two_showers_one_horizontal_one_vertical_recovery() {
    let p = performance("EPW403d", r#"[]"#);
    close(
        "EPW403d Q_W;rcd m1",
        p["hotWater"]["months"][0]["recoveredKwh"]
            .as_f64()
            .expect("number"),
        25.807663053351078,
    );
    close(
        "EPW403d Q_W;em (13.9) m1",
        p["hotWater"]["months"][0]["emissionInputKwh"]
            .as_f64()
            .expect("number"),
        205.94122426998013,
    );
}

/// Compression chiller with a declared EER 4,37: 4,35 (10.1, p. 366) with f_prpr 0,9 (NEN question 12).
#[test]
fn declared_eer_cooling() {
    let p = performance(
        "EPW301a",
        r#"[{"pointer": "/ntaCalculation/cooling/generators/0/generator", "value": {"kind": "compression", "declared": {"value": 4.37, "sourceReference": "r66 synthetic"}}}]"#,
    );
    close(
        "cool-decl E_C;el m7",
        p["cooling"]["months"][6]["electricityKwh"]
            .as_f64()
            .expect("number"),
        115.2930708095567,
    );
}

/// External cold, 10.78 with eta 1 and f_prpr 1 (p. 418-420), f_P;del;dc = 1,45/3 (table 5.2); no control
/// energy for external cold (kernel reading, NEN question 2).
#[test]
fn external_cold() {
    let p = performance(
        "EPW301a",
        r#"[{"pointer": "/ntaCalculation/cooling/generators/0/generator", "value": {"kind": "external_cold"}}, {"pointer": "/ntaCalculation/activeCooling/system", "value": "external_cold_with_cooling_emitter"}]"#,
    );
    close(
        "cool-ext Q_C;gen;ext;dc m7",
        p["cooling"]["months"][6]["districtColdKwh"]
            .as_f64()
            .expect("number"),
        451.3723722194145,
    );
    close(
        "cool-ext W_C;aux m7",
        p["cooling"]["months"][6]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        2.336096883903151,
    );
    close(
        "cool-ext E_P cooling/dc",
        row(&p, "cooling", "dc")["primaryFossilKwh"]
            .as_f64()
            .expect("number"),
        1087.6802333914536,
    );
}

/// Table chiller with a closed cooling tower: 10.80 with the table EER and 10.83 with table 10.33 0,033
/// (p. 420-423), control 10.87 (p. 425).
#[test]
fn chiller_with_closed_cooling_tower() {
    let p = performance(
        "EPW301a",
        r#"[{"pointer": "/ntaCalculation/cooling/generators/0/generator", "value": {"kind": "compression", "heatRejection": "closed_cooling_tower"}}]"#,
    );
    close(
        "cool-hr W_C;aux m7",
        p["cooling"]["months"][6]["auxiliaryElectricityKwh"]
            .as_f64()
            .expect("number"),
        29.636481261557392,
    );
}

/// Two PV systems, 16.2-16.4a (p. 678-682), table 17.15 full obstruction (p. 760-762) with c_sh held at
/// 0,75 below F 0,80 (kernel reading of table 16.3), export credit 5.13.
#[test]
fn pv_with_full_obstruction() {
    let p = performance("EPW501b", r#"[]"#);
    close(
        "EPW501b E_el;PV;out m6",
        p["electricityBalance"][5]["producedKwh"]
            .as_f64()
            .expect("number"),
        296.44091421696004,
    );
    close(
        "EPW501b E_exp;el m6",
        p["electricityBalance"][5]["exportedKwh"]
            .as_f64()
            .expect("number"),
        262.2325984274863,
    );
    close(
        "EPW501b E_P;tot (5.10)",
        p["annualPrimaryFossilKwh"].as_f64().expect("number"),
        6835.316507603183,
    );
}

/// PV with 5 kWh of building-bound storage: 5.14a/5.14b (p. 84-86) with f_BAT;cor 1.
#[test]
fn pv_with_a_battery() {
    let p = performance(
        "EPW501a",
        r#"[{"pointer": "/ntaCalculation/batteryStoragePresent", "value": true}, {"pointer": "/ntaCalculation/storage", "value": {"buildingBoundElectricalKwh": 5.0, "buildingBoundThermalKwh": 0.0, "sourceReference": "r66 synthetic battery"}}]"#,
    );
    close(
        "pv-bat E_P;BAT,out m6",
        p["energyByService"]["adjustments"][5]["storageCorrectionKwh"]
            .as_f64()
            .expect("number"),
        1.7104157894736849,
    );
    close(
        "pv-bat E_P;BAT annual",
        p["annualStorageCorrectionKwh"].as_f64().expect("number"),
        25.736696582757297,
    );
    close(
        "pv-bat E_P;tot (5.10)",
        p["annualPrimaryFossilKwh"].as_f64().expect("number"),
        6666.068113927736,
    );
}
