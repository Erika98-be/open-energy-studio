//! The blank search of the project route runs on a reduced copy of the NTA
//! block (lists of objects cut down to the elements that hold a null) and
//! checks the outcome on the whole block. These tests hold it to the search
//! on the whole block, which stays in the kernel as the oracle: the same
//! paths, in the same order, and the same residual flag.
//!
//! Covered here: every project fixture as is and with blanks (the variants of
//! the snapshot harness in `large_projects.rs`) and a seeded property test
//! of random blank sets. The dense building with blanks is compared in
//! `large_projects.rs`, next to its builder; the project-form guard
//! (`project_form_guard.rs`) compares every collected form state as well.

use nta8800_core::project_performance::{nta_blank_search, reduced_blank_searches};
use serde_json::Value;

fn training_data() -> std::path::PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../training-data")
}

/// Every project fixture: a file with zones and an NTA block.
fn project_fixtures() -> Vec<(String, Value)> {
    let mut paths: Vec<_> = std::fs::read_dir(training_data())
        .unwrap()
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "json"))
        .collect();
    paths.sort();
    paths
        .into_iter()
        .filter_map(|path| {
            let value: Value =
                serde_json::from_str(&std::fs::read_to_string(&path).ok()?).ok()?;
            (value.get("zones").is_some() && value.get("ntaCalculation").is_some()).then(|| {
                (
                    path.file_stem().unwrap().to_string_lossy().to_string(),
                    value,
                )
            })
        })
        .collect()
}

fn assert_same(name: &str, block: &Value) {
    let reduced = nta_blank_search(block, false);
    let whole = nta_blank_search(block, true);
    assert_eq!(reduced, whole, "{name}: reduced search differs from the whole-block search");
}

fn collect_pointers(value: &Value, pointer: String, numbers_only: bool, out: &mut Vec<String>) {
    match value {
        Value::Number(_) => out.push(pointer),
        Value::String(_) | Value::Bool(_) if !numbers_only => out.push(pointer),
        Value::Object(map) => {
            for (key, item) in map {
                let key = key.replace('~', "~0").replace('/', "~1");
                collect_pointers(item, format!("{pointer}/{key}"), numbers_only, out);
            }
        }
        Value::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                collect_pointers(item, format!("{pointer}/{index}"), numbers_only, out);
            }
        }
        _ => {}
    }
}

/// The snapshot harness's variants: every third leaf number of the NTA block
/// blanked, one at a time for the first 40, and all of them together.
#[test]
fn fixtures_with_blanks_give_the_same_gaps() {
    let fixtures = project_fixtures();
    assert!(fixtures.len() >= 18, "only {} fixtures", fixtures.len());
    let mut compared = 0;
    for (stem, project) in fixtures {
        let block = &project["ntaCalculation"];
        assert_same(&format!("{stem} as is"), block);
        let mut numbers = Vec::new();
        collect_pointers(block, String::new(), true, &mut numbers);
        let picked: Vec<&String> = numbers.iter().step_by(3).take(40).collect();
        let mut all = block.clone();
        for (index, pointer) in picked.iter().enumerate() {
            let mut copy = block.clone();
            *copy.pointer_mut(pointer).unwrap() = Value::Null;
            assert_same(&format!("{stem} blank {index} ({pointer})"), &copy);
            *all.pointer_mut(pointer).unwrap() = Value::Null;
            compared += 1;
        }
        assert_same(&format!("{stem} all blanks"), &all);
        compared += 2;
    }
    assert!(compared > 400, "only {compared} blocks compared");
    // The comparison only means something when the reduced search is used:
    // most blocks with a blank in a list of objects take it.
    let (confirmed, fell_back) = reduced_blank_searches();
    println!("reduced searches: {confirmed} confirmed, {fell_back} fell back");
    assert!(confirmed > 100, "{confirmed} confirmed, {fell_back} fell back");
}

/// A small deterministic generator (xorshift64*), so the property test needs
/// no crate and repeats exactly.
struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 >> 12;
        self.0 ^= self.0 << 25;
        self.0 ^= self.0 >> 27;
        self.0.wrapping_mul(0x2545_F491_4F6C_DD1D)
    }

    fn below(&mut self, bound: usize) -> usize {
        (self.next() % bound as u64) as usize
    }
}

/// Every location in the block: leaves, objects and list elements (a whole
/// object or element blanked is a null too).
fn all_pointers(value: &Value, pointer: String, out: &mut Vec<String>) {
    if !pointer.is_empty() {
        out.push(pointer.clone());
    }
    match value {
        Value::Object(map) => {
            for (key, item) in map {
                let key = key.replace('~', "~0").replace('/', "~1");
                all_pointers(item, format!("{pointer}/{key}"), out);
            }
        }
        Value::Array(items) => {
            for (index, item) in items.iter().enumerate() {
                all_pointers(item, format!("{pointer}/{index}"), out);
            }
        }
        _ => {}
    }
}

/// Random blank sets (1 to 8 locations, leaves and whole objects or list
/// elements) in fixtures with lists of objects, compared case by case.
#[test]
fn random_blank_sets_give_the_same_gaps() {
    let bases: Vec<(String, Value)> = project_fixtures()
        .into_iter()
        .filter(|(stem, _)| {
            [
                "nta8800-example-office",
                "nta8800-example-terraced-dwelling",
                "nta8800-public-comparison-c",
                "nta8800-public-comparison-h",
                "nta8800-public-comparison-k",
                "nta8800-public-comparison-n",
                "nta8800-evidence-link-project",
            ]
            .contains(&stem.as_str())
        })
        .map(|(stem, project)| (stem, project["ntaCalculation"].clone()))
        .collect();
    assert_eq!(bases.len(), 7);
    let pointers: Vec<Vec<String>> = bases
        .iter()
        .map(|(_, block)| {
            let mut out = Vec::new();
            all_pointers(block, String::new(), &mut out);
            out
        })
        .collect();
    let mut rng = Rng(0x0A11_C0DE_2026_1010);
    let cases = 600;
    let mut with_gaps = 0;
    for case in 0..cases {
        let base = rng.below(bases.len());
        let (stem, block) = &bases[base];
        let mut copy = block.clone();
        let count = 1 + rng.below(8);
        let mut chosen = Vec::new();
        for _ in 0..count {
            let pointer = &pointers[base][rng.below(pointers[base].len())];
            if let Some(slot) = copy.pointer_mut(pointer) {
                *slot = Value::Null;
                chosen.push(pointer.clone());
            }
        }
        let reduced = nta_blank_search(&copy, false);
        let whole = nta_blank_search(&copy, true);
        assert_eq!(
            reduced, whole,
            "case {case}: {stem} with {chosen:?} blanked"
        );
        if !whole.0.is_empty() {
            with_gaps += 1;
        }
    }
    assert!(with_gaps > cases / 4, "only {with_gaps} cases reported gaps");
    let (confirmed, fell_back) = reduced_blank_searches();
    println!("reduced searches: {confirmed} confirmed, {fell_back} fell back");
    assert!(confirmed > 100, "{confirmed} confirmed, {fell_back} fell back");
}
