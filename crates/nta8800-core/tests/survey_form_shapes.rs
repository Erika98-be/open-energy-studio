//! The JSON the survey forms write (src/components/BasisopnamePanel/SurveyBasics.tsx)
//! must be read by the kernel. These cases mirror the expectations of
//! src/__tests__/survey-basics-forms.test.tsx: each is a form result that the
//! kernel used to refuse (review 7, 9 October 2026).

use nta8800_core::opname::utility::{assess_utility_survey, UtilitySurvey};
use nta8800_core::opname::{assess_residential_survey, ResidentialSurvey};
use serde_json::{json, Value};

fn utility_fixture() -> Value {
    serde_json::from_str(include_str!(
        "../../../training-data/nta8800-opname-utility-1985-office.json"
    ))
    .unwrap()
}

fn residential_fixture() -> Value {
    serde_json::from_str(include_str!(
        "../../../training-data/nta8800-opname-1930-terraced.json"
    ))
    .unwrap()
}

fn utility(value: Value) -> (UtilitySurvey, Vec<String>) {
    let survey: UtilitySurvey = serde_json::from_value(value).expect("the kernel reads the form JSON");
    let codes = assess_utility_survey(&survey)
        .issues
        .iter()
        .map(|issue| issue.code.to_string())
        .collect();
    (survey, codes)
}

fn residential(value: Value) -> Vec<String> {
    let survey: ResidentialSurvey =
        serde_json::from_value(value).expect("the kernel reads the form JSON");
    assess_residential_survey(&survey)
        .issues
        .iter()
        .map(|issue| issue.code.to_string())
        .collect()
}

#[test]
fn utility_survey_form_shapes_are_read() {
    let base = utility_fixture();
    let (_, before) = utility(base.clone());

    let mut value = base;
    // Fix 1: unchecking the last solar-control window writes an empty list.
    value["solarControlWindowIds"] = json!([]);
    // Fix 2: an unheated space from the list and a surface bordering it.
    value["envelope"]["unheatedSpaces"] = json!([{ "id": "onverwarmd-1", "description": "berging" }]);
    value["envelope"]["surfaces"][1]["boundary"] = json!({ "kind": "unheated_space", "spaceId": "onverwarmd-1" });
    // Fix 3: a door with a glass share and its glass type.
    value["envelope"]["doors"][0]["glassFraction"] = json!(0.4);
    value["envelope"]["doors"][0]["glass"] = json!("hr_plus_plus");
    // Fix 4: a declared variant from the select (table 11.5 code).
    value["ventilation"]["declaredVariant"] = json!("d5b");
    // Fix 6: recirculation present, percentage left empty (no field written).
    value["ventilation"]["recirculation"] = json!("present_percent_unknown");
    // Fix 7: the daylight select's default leaves the field out.
    value["lighting"][0]
        .as_object_mut()
        .unwrap()
        .remove("daylight");

    let (survey, after) = utility(value);
    assert!(survey.solar_control_window_ids.is_empty());
    for code in [
        "door_glass_required",
        "unheated_space_unknown",
        "solar_control_window_unknown",
    ] {
        assert!(!after.iter().any(|c| c == code), "{code} in {after:?}");
    }
    // The form shapes add no issue the plain fixture does not have, apart from
    // what the new answers legitimately bring.
    for code in &after {
        assert!(
            before.contains(code) || !code.contains("invalid"),
            "new invalid code {code}"
        );
    }
}

#[test]
fn residential_survey_form_shapes_are_read() {
    let mut value = residential_fixture();
    value["ventilation"]["declaredVariant"] = json!("c4a");
    if value["envelope"]["doors"].as_array().map_or(true, Vec::is_empty) {
        let surface = value["envelope"]["surfaces"][0]["id"].clone();
        value["envelope"]["doors"] = json!([{ "id": "deur-1", "surfaceId": surface, "areaM2": 2.0,
            "frame": "wood_or_plastic", "sourceReference": "" }]);
    }
    value["envelope"]["doors"][0]["glassFraction"] = json!(0.3);
    value["envelope"]["doors"][0]["glass"] = json!("double");
    let codes = residential(value);
    assert!(
        !codes.iter().any(|code| code == "door_glass_required"),
        "{codes:?}"
    );
}
