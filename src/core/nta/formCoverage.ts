// Form coverage of the kernel input (docs/ui-redesign/formulierdekking.md).
//
// training-data/nta8800-input-options.json lists every enum variant and
// optional field of the project input and of both surveys, as serde lists
// them (crates/nta8800-core/tests/option_coverage.rs keeps it current). The
// check in src/__tests__/nta-form-coverage.test.ts counts an option as
// covered when its name occurs as a literal or a property in the form
// sources below. Options a form sets in a way that check cannot see, and
// options that stay JSON-only on purpose, are listed here with the reason.

/** Directories and files whose code makes up the input forms. */
export const FORM_SOURCES = [
  'src/components/NtaPerformancePanel',
  'src/components/BasisopnamePanel',
  'src/components/dialogs',
  'src/components/shell',
  'src/components/PropertiesPanel',
  'src/components/UnheatedSpacesPanel',
  'src/components/HeatPumpInventoryPanel',
  'src/components/HeatPumpForfaitDiagnosticPanel',
  'src/components/EvidenceLink',
  'src/core/nta/NtaSystemTemplates.ts',
  'src/core/nta/NtaFormModels.ts',
  'src/core/nta/NtaCalculationTemplate.ts',
  'src/core/nta/SurveyTemplates.ts',
  'src/core/nta/annexAaForm.ts',
] as const;

export type CoverageRoute = 'project' | 'residentialSurvey' | 'utilitySurvey';

export interface CoverageExemption {
  route: CoverageRoute;
  /** Schema path as in the catalogue (array indices as `[]`). */
  path: string;
  options: string[];
  /** `form`: a form sets it, but not by name; `json`: JSON-only on purpose. */
  kind: 'form' | 'json';
  reason: string;
}

export const FORM_COVERAGE_EXEMPTIONS: CoverageExemption[] = [
  {
    route: 'project', path: '/ntaCalculation/windowSolar/movableShading/device/colour', options: ['dark', 'white'], kind: 'form',
    reason: 'Zonwering per raam en de projectbrede zonwering kiezen het toestel als samengestelde waarde "soort:kleur".',
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
];
