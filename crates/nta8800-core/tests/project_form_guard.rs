//! Structural guard for the project forms. `src/__tests__/
//! nta-project-form-guard.test.tsx` exercises every NTA section (every
//! choice through all its options, every checkbox, every "add" button, every
//! number emptied) and collects each resulting project the way "Toepassen"
//! and the kernel call produce it. This test runs every collected project
//! through the kernel. The gate passes the file with `NTA_FORM_GUARD_DOCS`
//! after the UI tests; without it the test has nothing to check.
//!
//! Refused: a shape the kernel cannot read (the form wrote a member, type or
//! null the kernel types do not allow), a gap without a route in
//! `gapRoutes.ts`, and a code from `LEFTOVER_STATE`: state a form left behind
//! that no field on the page can clear (reviews 7 and 8). A gap that only
//! asks for a value is the expected outcome of an emptied field, but only for
//! a member the kernel needs: a null member reads as absent (review 9), so a
//! `nta_value_missing` on a member with a kernel default is refused too.

mod support;

use nta8800_core::project_performance::{assess_project_performance, nta_blank_search};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use support::{check_outcome, checked, entries, panic_message};

/// The kernel could not read what the form wrote.
const SHAPE_REFUSALS: [&str; 5] = [
    "nta_calculation_block_invalid",
    "project_shape_invalid",
    "derived_input_shape_invalid",
    "derived_input_rejected",
    "derived_input_rejected_without_reason",
];

/// A value a form left behind after the input it depends on changed, which
/// the page offers no way to clear (docs/nta8800-releasenotes.md, reviews 7
/// and 8). Grows with every such bug found.
const LEFTOVER_STATE: [&str; 13] = [
    // This guard: BACS classes kept after "BACS present" was unticked.
    "absent_bacs_has_classes",
    // Review 8: a series kept after a second further generator.
    "hot_water_series_requires_two_generators",
    // Review 8, and the use function of the general section (this guard).
    "dwelling_type_not_applicable",
    // Review 7: a buffer vessel or delivery set on an individual installation.
    "buffer_vessel_collective_only",
    "buffer_vessel_included_in_forfait_psi",
    "delivery_set_requires_collective_installation",
    // Review 8: zone data copied with zone 1's area.
    "ventilation_area_mismatch",
    // Review 8: a residential part offered in a zone.
    "function_areas_residential_mixed",
    // Review 7: a source offered for heat pumps in series that has no value.
    "hot_water_heat_pump_series_source_invalid",
    // Review 7: a solar-control window id kept after its window went.
    "solar_control_window_unknown",
    // This guard: balancing left when the emission system changed (table 9.3 footnote a).
    "emission_balancing_inconsistent",
    // This guard: a table 11.5 variant offered for a category it has no f_ctrl for.
    "variant_not_applicable_to_category",
    // This guard: declared lighting offered for a dwelling (§5.5).
    "residential_lighting_must_be_omitted",
];

#[test]
fn every_project_form_state_is_read_by_the_kernel() {
    let Ok(file) = std::env::var("NTA_FORM_GUARD_DOCS") else {
        eprintln!("NTA_FORM_GUARD_DOCS not set: the gate sets it after the UI tests");
        return;
    };
    let text = std::fs::read_to_string(&file)
        .unwrap_or_else(|error| panic!("{file}: {error} (run the UI tests first)"));
    let docs: Vec<Value> = text
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert!(
        docs.len() > 500,
        "only {} form states collected",
        docs.len()
    );

    let threads = std::thread::available_parallelism().map_or(4, |n| n.get());
    let chunk = docs.len().div_ceil(threads);
    let outcomes: Vec<(Vec<String>, BTreeMap<String, usize>)> = std::thread::scope(|scope| {
        let handles: Vec<_> = docs
            .chunks(chunk)
            .map(|part| {
                scope.spawn(move || {
                    part.iter().map(check_doc).fold(
                        (Vec::new(), BTreeMap::new()),
                        |(mut failures, mut seen), (failure, codes)| {
                            failures.extend(failure);
                            for code in codes {
                                *seen.entry(code).or_insert(0) += 1;
                            }
                            (failures, seen)
                        },
                    )
                })
            })
            .collect();
        handles
            .into_iter()
            .map(|handle| handle.join().unwrap())
            .collect()
    });
    let mut failures = Vec::new();
    let mut seen = BTreeMap::<String, usize>::new();
    for (part, codes) in outcomes {
        failures.extend(part);
        for (code, count) in codes {
            *seen.entry(code).or_insert(0) += count;
        }
    }
    if std::env::var("NTA_FORM_GUARD_REPORT").is_ok() {
        for (code, count) in &seen {
            eprintln!("{count:6} {code}");
        }
    }
    failures.sort();
    failures.dedup();
    assert!(
        failures.is_empty(),
        "{} of {} form states fail:\n{}",
        failures.len(),
        docs.len(),
        failures.join("\n")
    );
}

/// The failure of one collected form state, if any, and its codes.
fn check_doc(doc: &Value) -> (Option<String>, BTreeSet<String>) {
    let label = format!(
        "{} / {} / {}",
        doc["fixture"].as_str().unwrap_or(""),
        doc["section"].as_str().unwrap_or(""),
        doc["action"].as_str().unwrap_or("")
    );
    let project = &doc["project"];
    let result = match std::panic::catch_unwind(|| assess_project_performance(project)) {
        Ok(result) => result,
        Err(panic) => {
            return (
                Some(format!("{label}: panic {}", panic_message(&*panic))),
                BTreeSet::new(),
            )
        }
    };
    let value = match checked(&result) {
        Ok(value) => value,
        Err(error) => return (Some(format!("{label}: {error}")), BTreeSet::new()),
    };
    // The blank search runs on a reduced copy of the block and confirms it
    // on the whole block; it must report what the search on the whole
    // block reports (blank_search_equivalence.rs).
    let block = &project["ntaCalculation"];
    if has_null(block) {
        let reduced = nta_blank_search(block, false);
        let whole = nta_blank_search(block, true);
        if reduced != whole {
            return (
                Some(format!(
                    "{label}: blank search {reduced:?} differs from the whole-block search {whole:?}"
                )),
                BTreeSet::new(),
            );
        }
    }
    let status = value["status"].as_str().unwrap_or("").to_string();
    let codes = match check_outcome(true, &value, &status) {
        Ok((_, codes)) => codes,
        Err(error) => return (Some(format!("{label}: {error}")), BTreeSet::new()),
    };
    if let Some(failure) = defaulted_blank(project, &value) {
        return (Some(format!("{label}: {failure}")), codes);
    }
    for code in SHAPE_REFUSALS.iter().chain(LEFTOVER_STATE.iter()) {
        if codes.contains(*code) {
            let mut detail = Vec::new();
            entries(&value, code, &mut detail);
            return (
                Some(format!("{label}: {code} {}", detail.join("; "))),
                codes,
            );
        }
    }
    (None, codes)
}

fn has_null(value: &Value) -> bool {
    match value {
        Value::Null => true,
        Value::Object(map) => map.values().any(has_null),
        Value::Array(items) => items.iter().any(has_null),
        _ => false,
    }
}

/// A null object member means the same as an absent one (review 9). A
/// `nta_value_missing` is only right for a member the kernel needs: when the
/// same project without that member raises no gap at its path, a field with a
/// kernel default was reported as missing.
fn defaulted_blank(project: &Value, value: &Value) -> Option<String> {
    let gaps = value["gaps"].as_array()?;
    for gap in gaps {
        if gap["code"] != "nta_value_missing" {
            continue;
        }
        let path = gap["path"].as_str()?;
        let pointer = pointer_of(path);
        let (parent, key) = pointer.rsplit_once('/')?;
        if !project.pointer(&pointer).is_some_and(Value::is_null)
            || !project.pointer(parent).is_some_and(Value::is_object)
        {
            continue;
        }
        let mut absent = project.clone();
        absent
            .pointer_mut(parent)
            .and_then(Value::as_object_mut)?
            .remove(key);
        let result = serde_json::to_value(assess_project_performance(&absent)).ok()?;
        let still = result["gaps"].as_array().is_some_and(|gaps| {
            gaps.iter().any(|other| {
                other["path"].as_str() == Some(path)
                    || other["code"] == "nta_calculation_block_invalid"
            })
        });
        if !still {
            return Some(format!(
                "nta_value_missing at {path}, but the kernel accepts the member absent (a default)"
            ));
        }
    }
    None
}

/// `a.b[0].c` as a JSON pointer `/a/b/0/c`.
fn pointer_of(path: &str) -> String {
    let mut pointer = String::new();
    for part in path.split('.') {
        let mut rest = part;
        let key_end = rest.find('[').unwrap_or(rest.len());
        pointer.push('/');
        pointer.push_str(&rest[..key_end]);
        rest = &rest[key_end..];
        while let Some(close) = rest.find(']') {
            pointer.push('/');
            pointer.push_str(&rest[1..close]);
            rest = &rest[close + 1..];
        }
    }
    pointer
}
