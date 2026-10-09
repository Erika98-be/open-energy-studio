//! Allocation of common spaces (gemeenschappelijke ruimten) over the use
//! functions that rely on them.
//!
//! 6.2 (2025+C1 p. 142; 2023 p. 129): a common space goes pro rata to the
//! use functions it serves; a space serving one function belongs to that
//! function. 6.6.4 (2025+C1 p. 158; 2023 p. 145) applies the same rule twice:
//!
//! * for the use function in the building (Bbl limits, 5.3.1), by the
//!   initial areas of all functions served;
//! * for the use function within a calculation zone (6.5.3 values of the
//!   zone: setpoint, internal heat, ventilation capacity), only over the
//!   served functions that lie within that zone.
//!
//! Note 2 under 6.5.2 (2025+C1 p. 156) checks the 90 % rule after the
//! allocation. The kernel takes the initial (non-common) function areas per
//! zone and the common spaces with the functions they serve, and writes the
//! allocated areas into `functionAreas` of the zone, the zone's chapter 11
//! ventilation functions and `bblFunctions` (when not given).

use crate::bbl_requirements::{BblFunction, BblFunctionArea};
use crate::monthly_demand::{UsageFunction, UsageFunctionArea};
use serde::{Deserialize, Serialize};

/// A common space lying within a calculation zone.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommonSpace {
    #[serde(default)]
    pub id: Option<String>,
    /// Usable floor area of the common space (NEN 2580 4.5.1), m².
    pub area_m2: f64,
    /// Use functions that rely on this space; empty: all functions of the
    /// building.
    #[serde(default)]
    pub served_functions: Vec<UsageFunction>,
    pub source_reference: String,
}

/// Initial areas and common spaces of one zone.
#[derive(Debug, Clone)]
pub struct ZoneCommonSpaces<'a> {
    pub zone_id: &'a str,
    /// Index of the zone entry in `ntaCalculation.zoneData`.
    pub data_index: usize,
    pub floor_area_m2: f64,
    /// The zone's own function areas; empty for a single-function zone.
    pub initial: &'a [UsageFunctionArea],
    /// Zone usage function for a single-function zone.
    pub usage_function: UsageFunction,
    pub common_spaces: &'a [CommonSpace],
}

/// One common space and how it was allocated.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommonSpaceAllocation {
    pub zone_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub area_m2: f64,
    /// Share per function within the zone (6.6.4, last paragraph).
    pub within_zone: Vec<UsageFunctionArea>,
    /// Share per function for the building (6.6.4, first paragraph).
    pub building: Vec<UsageFunctionArea>,
}

/// Function areas of one zone after allocation.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoneFunctionAreas {
    pub zone_id: String,
    pub initial: Vec<UsageFunctionArea>,
    pub allocated: Vec<UsageFunctionArea>,
}

/// The traceable result of the allocation.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommonSpaceSplit {
    pub source: &'static str,
    pub spaces: Vec<CommonSpaceAllocation>,
    pub zones: Vec<ZoneFunctionAreas>,
    /// Use-function areas of the building (Bbl limits, hot water, lighting).
    pub building: Vec<UsageFunctionArea>,
}

/// A refusal with the path below `ntaCalculation`.
#[derive(Debug, Clone, PartialEq)]
pub struct CommonSpaceIssue {
    pub code: &'static str,
    pub path: String,
}

const SOURCE: &str = "6.2 and 6.6.4: a common space is allocated pro rata to the initial areas of the use functions it serves; within a calculation zone only over the served functions lying in that zone";

fn add(list: &mut Vec<UsageFunctionArea>, function: UsageFunction, area_m2: f64) {
    match list.iter_mut().find(|part| part.function == function) {
        Some(part) => part.area_m2 += area_m2,
        None => list.push(UsageFunctionArea { function, area_m2 }),
    }
}

/// Pro rata share of `area` over the `served` functions present in `base`.
fn share(
    area: f64,
    served: &[UsageFunction],
    base: &[UsageFunctionArea],
) -> Option<Vec<UsageFunctionArea>> {
    let parts: Vec<&UsageFunctionArea> = base
        .iter()
        .filter(|part| part.area_m2 > 0.0)
        .filter(|part| served.is_empty() || served.contains(&part.function))
        .collect();
    let total: f64 = parts.iter().map(|part| part.area_m2).sum();
    if parts.is_empty() || total <= 0.0 {
        return None;
    }
    Some(
        parts
            .iter()
            .map(|part| UsageFunctionArea {
                function: part.function,
                area_m2: area * part.area_m2 / total,
            })
            .collect(),
    )
}

/// Allocates the common spaces of all zones. `None` when no zone has one.
pub fn allocate(
    zones: &[ZoneCommonSpaces<'_>],
) -> Option<Result<CommonSpaceSplit, Vec<CommonSpaceIssue>>> {
    if zones.iter().all(|zone| zone.common_spaces.is_empty()) {
        return None;
    }
    let mut issues = Vec::new();
    // Initial (non-common) areas per zone.
    let mut initial_by_zone = Vec::with_capacity(zones.len());
    for zone in zones {
        let common: f64 = zone.common_spaces.iter().map(|space| space.area_m2).sum();
        let initial: Vec<UsageFunctionArea> = if zone.initial.is_empty() {
            vec![UsageFunctionArea {
                function: zone.usage_function,
                area_m2: zone.floor_area_m2 - common,
            }]
        } else {
            zone.initial.to_vec()
        };
        initial_by_zone.push(initial);
        for (index, space) in zone.common_spaces.iter().enumerate() {
            let path = format!("zoneData[{}].commonSpaces[{index}]", zone.data_index);
            if !(space.area_m2.is_finite() && space.area_m2 > 0.0) {
                issues.push(CommonSpaceIssue {
                    code: "common_space_invalid",
                    path: format!("{path}.areaM2"),
                });
            }
            if space.source_reference.trim().is_empty() {
                issues.push(CommonSpaceIssue {
                    code: "source_reference_required",
                    path: format!("{path}.sourceReference"),
                });
            }
            let mut seen = Vec::new();
            for function in &space.served_functions {
                if seen.contains(function) {
                    issues.push(CommonSpaceIssue {
                        code: "common_space_invalid",
                        path: format!("{path}.servedFunctions"),
                    });
                    break;
                }
                seen.push(*function);
            }
        }
    }
    let mut building_initial = Vec::new();
    for initial in &initial_by_zone {
        for part in initial {
            add(&mut building_initial, part.function, part.area_m2);
        }
    }
    let mut spaces = Vec::new();
    let mut building = building_initial.clone();
    let mut zone_results = Vec::new();
    for (zone, initial) in zones.iter().zip(&initial_by_zone) {
        if initial.iter().any(|part| !(part.area_m2 > 0.0)) {
            issues.push(CommonSpaceIssue {
                code: "common_space_exceeds_zone",
                path: format!("zoneData[{}].commonSpaces", zone.data_index),
            });
            continue;
        }
        let mut allocated = initial.clone();
        for (index, space) in zone.common_spaces.iter().enumerate() {
            let path = format!(
                "zoneData[{}].commonSpaces[{index}].servedFunctions",
                zone.data_index
            );
            let within = share(space.area_m2, &space.served_functions, initial);
            let whole = share(space.area_m2, &space.served_functions, &building_initial);
            match (within, whole) {
                (Some(within), Some(whole)) => {
                    for part in &within {
                        add(&mut allocated, part.function, part.area_m2);
                    }
                    for part in &whole {
                        add(&mut building, part.function, part.area_m2);
                    }
                    spaces.push(CommonSpaceAllocation {
                        zone_id: zone.zone_id.to_string(),
                        id: space.id.clone(),
                        area_m2: space.area_m2,
                        within_zone: within,
                        building: whole,
                    });
                }
                _ => issues.push(CommonSpaceIssue {
                    code: "common_space_function_outside_zone",
                    path,
                }),
            }
        }
        zone_results.push(ZoneFunctionAreas {
            zone_id: zone.zone_id.to_string(),
            initial: initial.clone(),
            allocated,
        });
    }
    if !issues.is_empty() {
        return Some(Err(issues));
    }
    Some(Ok(CommonSpaceSplit {
        source: SOURCE,
        spaces,
        zones: zone_results,
        building,
    }))
}

/// Bbl function of a utility use function; `None` for the residential
/// function, whose Bbl category (1a–1e) the use function does not fix.
pub fn bbl_function(function: UsageFunction) -> Option<BblFunction> {
    Some(match function {
        UsageFunction::AssemblyChildCare => BblFunction::AssemblyChildCare,
        UsageFunction::OtherAssembly => BblFunction::OtherAssembly,
        UsageFunction::Cell => BblFunction::Cell,
        UsageFunction::HealthcareWithBeds => BblFunction::HealthcareWithBeds,
        UsageFunction::OtherHealthcare => BblFunction::OtherHealthcare,
        UsageFunction::Office => BblFunction::Office,
        UsageFunction::Lodging => BblFunction::LodgingInLodgingBuilding,
        UsageFunction::Education => BblFunction::Education,
        UsageFunction::Sport => BblFunction::Sport,
        UsageFunction::Retail => BblFunction::Retail,
        UsageFunction::Residential => return None,
    })
}

/// The building split as Bbl functions; `None` when a residential function
/// takes part.
pub fn bbl_functions(split: &CommonSpaceSplit) -> Option<Vec<BblFunctionArea>> {
    split
        .building
        .iter()
        .map(|part| {
            Some(BblFunctionArea {
                function: bbl_function(part.function)?,
                area_m2: part.area_m2,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn area(function: UsageFunction, area_m2: f64) -> UsageFunctionArea {
        UsageFunctionArea { function, area_m2 }
    }

    fn space(area_m2: f64, served: Vec<UsageFunction>) -> CommonSpace {
        CommonSpace {
            id: None,
            area_m2,
            served_functions: served,
            source_reference: "test".into(),
        }
    }

    /// Public case H (Uniec 3.2.9.2, NTA 8800:2023): 49,20 m² common space in
    /// RZ-1 serving all four functions; sport lies in RZ-2.
    #[test]
    fn case_h_split_within_zone_and_building() {
        let rz1 = [
            area(UsageFunction::Office, 14.70),
            area(UsageFunction::OtherAssembly, 26.30),
            area(UsageFunction::OtherHealthcare, 27.60),
        ];
        let spaces = [space(49.20, Vec::new())];
        let zones = [
            ZoneCommonSpaces {
                zone_id: "rz1",
                data_index: 0,
                floor_area_m2: 117.8,
                initial: &rz1,
                usage_function: UsageFunction::OtherHealthcare,
                common_spaces: &spaces,
            },
            ZoneCommonSpaces {
                zone_id: "rz2",
                data_index: 1,
                floor_area_m2: 626.0,
                initial: &[],
                usage_function: UsageFunction::Sport,
                common_spaces: &[],
            },
        ];
        let split = allocate(&zones).unwrap().unwrap();
        let rz1 = &split.zones[0].allocated;
        let get = |list: &[UsageFunctionArea], function| {
            list.iter()
                .find(|part| part.function == function)
                .map(|part| part.area_m2)
                .unwrap_or_default()
        };
        assert!((get(rz1, UsageFunction::Office) - 25.24).abs() < 0.01);
        assert!((get(rz1, UsageFunction::OtherAssembly) - 45.16).abs() < 0.01);
        assert!((get(rz1, UsageFunction::OtherHealthcare) - 47.40).abs() < 0.01);
        assert_eq!(get(rz1, UsageFunction::Sport), 0.0);
        let building = &split.building;
        assert!((get(building, UsageFunction::Office) - 15.74).abs() < 0.01);
        assert!((get(building, UsageFunction::OtherAssembly) - 28.16).abs() < 0.01);
        assert!((get(building, UsageFunction::OtherHealthcare) - 29.55).abs() < 0.01);
        assert!((get(building, UsageFunction::Sport) - 670.35).abs() < 0.01);
        let total: f64 = building.iter().map(|part| part.area_m2).sum();
        assert!((total - 743.80).abs() < 1e-9);
        assert_eq!(bbl_functions(&split).unwrap().len(), 4);
    }

    #[test]
    fn served_functions_restrict_the_split() {
        let initial = [
            area(UsageFunction::Office, 60.0),
            area(UsageFunction::Retail, 40.0),
        ];
        let spaces = [space(20.0, vec![UsageFunction::Office])];
        let zones = [ZoneCommonSpaces {
            zone_id: "z",
            data_index: 0,
            floor_area_m2: 120.0,
            initial: &initial,
            usage_function: UsageFunction::Office,
            common_spaces: &spaces,
        }];
        let split = allocate(&zones).unwrap().unwrap();
        assert_eq!(split.zones[0].allocated[0].area_m2, 80.0);
        assert_eq!(split.zones[0].allocated[1].area_m2, 40.0);
    }

    #[test]
    fn refusals() {
        let initial = [area(UsageFunction::Office, 60.0)];
        let spaces = [
            space(0.0, Vec::new()),
            space(10.0, vec![UsageFunction::Retail]),
        ];
        let zones = [ZoneCommonSpaces {
            zone_id: "z",
            data_index: 2,
            floor_area_m2: 70.0,
            initial: &initial,
            usage_function: UsageFunction::Office,
            common_spaces: &spaces,
        }];
        let issues = allocate(&zones).unwrap().unwrap_err();
        let codes: Vec<_> = issues.iter().map(|issue| issue.code).collect();
        assert!(codes.contains(&"common_space_invalid"), "{codes:?}");
        assert!(issues
            .iter()
            .any(|issue| issue.code == "common_space_function_outside_zone"
                && issue.path == "zoneData[2].commonSpaces[1].servedFunctions"));
        // A single-function zone whose common spaces fill the whole zone.
        let spaces = [space(80.0, Vec::new())];
        let zones = [ZoneCommonSpaces {
            zone_id: "z",
            data_index: 0,
            floor_area_m2: 70.0,
            initial: &[],
            usage_function: UsageFunction::Office,
            common_spaces: &spaces,
        }];
        let issues = allocate(&zones).unwrap().unwrap_err();
        assert_eq!(issues[0].code, "common_space_exceeds_zone");
        assert!(allocate(&[]).is_none());
    }
}
