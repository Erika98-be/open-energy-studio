// Form coverage of the kernel input (docs/ui-redesign/formulierdekking.md).
//
// training-data/nta8800-input-options.json lists every enum variant and
// optional field of the project input and of both surveys, as serde lists
// them (crates/nta8800-core/tests/option_coverage.rs keeps it current). The
// check in src/__tests__/nta-form-coverage.test.ts counts an option of a
// route as covered only when the form sources of that route write it: its
// name at a write site (an option value, a path or a template key, not a
// read, a comparison or a comment) in a file that also names its parent
// key. Options a form sets in a way that check cannot see, options that stay
// JSON-only on purpose, and options that still lack a form are listed here
// with the reason.

/** Directories and files whose code makes up the input forms, per route. */
export const FORM_SOURCES = {
  project: [
    'src/components/NtaPerformancePanel',
    'src/components/dialogs/ProjectInfoDialog',
    // The forfait heat pump of the project is entered here and copied into
    // ntaCalculation.generator.forfait (NtaSystemTemplates).
    'src/components/HeatPumpInventoryPanel',
    'src/components/HeatPumpForfaitDiagnosticPanel',
    'src/components/shell/pages/BuildingPages.tsx',
    'src/core/nta/NtaSystemTemplates.ts',
    'src/core/nta/NtaFormModels.ts',
    'src/core/nta/NtaCalculationTemplate.ts',
    'src/core/nta/annexAaForm.ts',
  ],
  residentialSurvey: [
    'src/components/BasisopnamePanel',
    'src/core/nta/SurveyTemplates.ts',
  ],
  utilitySurvey: [
    'src/components/BasisopnamePanel',
    'src/core/nta/SurveyTemplates.ts',
  ],
} as const;

export type CoverageRoute = 'project' | 'residentialSurvey' | 'utilitySurvey';

/**
 * Form files that build a whole kernel object in one literal (`return {
 * generatorId, scope, ... }`) rather than field by field; the check accepts
 * their keys for the objects named here.
 */
export const FORM_BUILDERS: Array<{ route: CoverageRoute; file: string; parents: string[] }> = [
  {
    route: 'project', file: 'HeatPumpForfaitDiagnosticPanel/HeatPumpForfaitDiagnosticPanel.tsx',
    parents: ['forfait', 'highEfficiencyEvidence', 'qualityDeclaration'],
  },
];

export interface CoverageExemption {
  route: CoverageRoute;
  /** Schema path as in the catalogue (array indices as `[]`). */
  path: string;
  options: string[];
  /**
   * `form`: a form sets it, but not by name; `json`: JSON-only on purpose;
   * `missing`: no form yet (to be added); `parallel`: a form is being added
   * in a parallel change and this entry goes when that lands.
   */
  kind: 'form' | 'json' | 'missing' | 'parallel';
  reason: string;
}

export const FORM_COVERAGE_EXEMPTIONS: CoverageExemption[] = [
  {
    route: 'project', path: '/ntaCalculation/windowSolar/movableShading/device/colour', options: ['dark', 'white', 'other', 'unknown'], kind: 'form',
    reason: 'Zonwering per raam en de projectbrede zonwering kiezen het toestel als samengestelde waarde "soort:kleur" (NtaWindowShadings).',
  },
  {
    route: 'project', path: '/ntaCalculation/windowSolar/movableShading/device/kind',
    options: ['external_screen', 'external_venetian_blind', 'external_roller_shutter'], kind: 'form',
    reason: 'Zonwering per raam en de projectbrede zonwering kiezen het toestel als samengestelde waarde "soort:kleur" (NtaWindowShadings).',
  },
  {
    route: 'project', path: '/ntaCalculation/distributionSystem', options: ['usageFunction'], kind: 'form',
    reason: 'Het sjabloon van het distributiesysteem neemt de gebruiksfunctie van het blok over (distributionSystemTemplate).',
  },
  {
    route: 'project', path: '/ntaCalculation/internalGains/lighting/method', options: ['resolved'], kind: 'json',
    reason: 'Interne waarde: de kern vult Φ_int;L zelf in uit hoofdstuk 14; geen invoerkeuze.',
  },
  {
    route: 'project', path: '/ntaCalculation/lighting/[]', options: ['burningHoursFactor'], kind: 'json',
    reason: 'Alleen voor maatwerkadvies (ISSO 75.2 tabel 2.7); het maatwerkadvies zet hem, nooit voor het energielabel.',
  },
  {
    route: 'project', path: '/ntaCalculation/ventilation', options: ['practice'], kind: 'json',
    reason: 'Alleen voor maatwerkadvies (ISSO 82.2/75.2 praktijkfactoren); het maatwerkadvies zet hem.',
  },
  {
    route: 'project', path: '/ntaCalculation/zoneData/[]/ventilation', options: ['practice'], kind: 'json',
    reason: 'Alleen voor maatwerkadvies (ISSO 82.2/75.2 praktijkfactoren); het maatwerkadvies zet hem.',
  },
  {
    route: 'project', path: '/ntaCalculation/ventilation', options: ['overventilation'], kind: 'json',
    reason: 'Maandwaarden die de kern uit de warmtepompketen afleidt; alleen opgeven bij afwijkende meetgegevens (expert).',
  },
  {
    route: 'project', path: '/ntaCalculation/zoneData/[]/ventilation', options: ['overventilation'], kind: 'json',
    reason: 'Maandwaarden die de kern uit de warmtepompketen afleidt; alleen opgeven bij afwijkende meetgegevens (expert).',
  },
  {
    route: 'project', path: '/ntaCalculation/ventilationFlows/[]/months/[]', options: ['coolingConductanceWPerK', 'coolingSupplyTemperatureC'], kind: 'json',
    reason: 'Afwijkende koelwaarden per maand van een opgegeven luchtstroom; leeg is de verwarmingswaarde (expert).',
  },
  {
    route: 'project', path: '/ntaCalculation/thermalMass', options: ['annexBElements'], kind: 'json',
    reason: 'Bijlage B per bouwdeel vervangt tabel 7.10; vraagt een lagenopbouw per element (expert).',
  },
  {
    route: 'project', path: '/ntaCalculation/zoneData/[]/thermalMass', options: ['annexBElements'], kind: 'json',
    reason: 'Bijlage B per bouwdeel vervangt tabel 7.10; vraagt een lagenopbouw per element (expert).',
  },
  {
    route: 'project', path: '/ntaCalculation/generator', options: ['auxiliaryMeasurements'], kind: 'json',
    reason: 'Componentmetingen volgens bijlage O (9.86–9.90) uit een meetrapport; de opgegeven A/B/C uit een kwaliteitsverklaring hebben wel een formulier.',
  },
  {
    route: 'project', path: '/ntaCalculation/hotWater/generator', options: ['annexT', 'annexTConditions'], kind: 'json',
    reason: 'Beproevingsrapport volgens bijlage T (gaskeur-koppeling); zeldzaam, uit het rapport over te nemen.',
  },
  {
    route: 'project', path: '/ntaCalculation/distributionSystem', options: ['unheatedPipeTransmittance'], kind: 'json',
    reason: 'Afwijkende Ψ voor het deel in onverwarmde ruimten; leeg geldt de Ψ van het hele systeem.',
  },
  {
    route: 'project', path: '/ntaCalculation/additionalHotWaterSystems/[]', options: ['circulation', 'additionalGenerators', 'series'], kind: 'missing',
    reason: 'Circulatie, extra opwekkers en serieschakeling van een verder tapwatersysteem: het hoofdsysteem heeft ze, een verder systeem nog niet. Te bouwen.',
  },
  {
    route: 'project', path: '/ntaCalculation/cooling', options: ['boosterHeatPumpExtractionKwh'], kind: 'json',
    reason: 'Maandwaarden van de warmte die een boosterwarmtepomp aan de koeling onttrekt; uit een meetrapport (expert).',
  },
  {
    route: 'project', path: '/ntaCalculation/cooling', options: ['collective'], kind: 'missing',
    reason: 'Nog geen formulier; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'project', path: '/ntaCalculation/pvSystems/[]', options: ['collective'], kind: 'missing',
    reason: 'Nog geen formulier; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'project', path: '/ntaCalculation/lighting/[]', options: ['zoneId'], kind: 'missing',
    reason: 'Verlichting per rekenzone koppelen aan een zone: alleen via Geavanceerd (JSON). Te bouwen voor meerzonige utiliteit.',
  },
  {
    route: 'project', path: '/ntaCalculation/ventilation/fans/control', options: ['monthly'], kind: 'json',
    reason: 'Maandfracties van de ventilatorregeling uit een meetrapport (expert); de forfaitaire regeling heeft een formulier.',
  },
  {
    route: 'project', path: '/ntaCalculation/ventilation/functions/[]', options: ['swimmingPool'], kind: 'missing',
    reason: 'Zwembad in een sportfunctie (§11.2.2.5.1); de ventilatiefuncties volgen nu de labelfunctie en hebben geen eigen lijst. Te bouwen.',
  },
  {
    route: 'project', path: '/ntaCalculation/zoneData/[]/ventilation/functions/[]', options: ['swimmingPool'], kind: 'missing',
    reason: 'Zwembad in een sportfunctie (§11.2.2.5.1); de ventilatiefuncties volgen nu de labelfunctie en hebben geen eigen lijst. Te bouwen.',
  },
  {
    route: 'project', path: '/ntaCalculation/zoneData/[]', options: ['functionAreas', 'sunrooms', 'usageFunction', 'dwellingType', 'thermalMass'], kind: 'missing',
    reason: 'Per rekenzone alleen via Geavanceerd (JSON); de projectbrede waarde heeft een formulier. Te bouwen voor meerzonige projecten.',
  },
  {
    route: 'residentialSurvey', path: '/hotWater/showerHeatRecovery', options: ['vertical', 'horizontal'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/pv/[]/moduleType', options: ['amorphous_single_junction', 'amorphous_multi_junction'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/pv/[]/mounting', options: ['not_ventilated', 'strongly_ventilated'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '', options: ['areaSourceReference', 'storage'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/envelope', options: ['panels'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/envelope/surfaces/[]', options: ['orientation', 'tiltDeg', 'cavity', 'exposedPerimeterM'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/envelope/windows/[]', options: ['obstruction'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/heating', options: ['balanced', 'storeys'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/pv/[]', options: ['mounting', 'obstructionFactors'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/ventilation', options: ['bypassPresent'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/hotWater/showerHeatRecovery', options: ['vertical', 'horizontal'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/pv/[]/moduleType', options: ['amorphous_single_junction', 'amorphous_multi_junction'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/pv/[]/mounting', options: ['not_ventilated', 'strongly_ventilated'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '', options: ['areaSourceReference', 'storage'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/envelope', options: ['panels'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/envelope/surfaces/[]', options: ['orientation', 'tiltDeg', 'cavity', 'exposedPerimeterM'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/envelope/windows/[]', options: ['obstruction'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/heating', options: ['balanced', 'storeys'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/pv/[]', options: ['mounting', 'obstructionFactors'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/ventilation', options: ['bypassPresent'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/hotWater/served', options: ['kitchen_and_bathroom', 'bathroom_only', 'kitchen_only'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'residentialSurvey', path: '/hotWater', options: ['served', 'kitchenLengthM', 'bathroomLengthM'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/cooling', options: ['designTemperature', 'control', 'pipesInsulated'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/hotWater', options: ['circulation', 'storage'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/hotWater/storage/[]', options: ['id', 'label', 'producedFrom2018', 'connection'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
  {
    route: 'utilitySurvey', path: '/ventilation/ahu', options: ['insideThermalZone'], kind: 'missing',
    reason: 'Nog geen veld in de opname; alleen via Geavanceerd (JSON). Te bouwen.',
  },
];
