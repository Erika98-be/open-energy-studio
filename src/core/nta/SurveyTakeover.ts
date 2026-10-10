import type { BuildingPerformanceInput, OpnameAssessment } from './KernelClient';

/**
 * "Overnemen in projectmodel": the NTA input the kernel derived from the
 * basisopname (ISSO 82.1/75.1) written into the project's NTA draft. Only
 * the blocks with the same meaning in both models are taken over; the
 * geometry stays the project's own (zones, surfaces, windows), so the
 * survey's derived transmission and areas are left out and listed as such.
 */

type Loose = Record<string, unknown>;

/** Top-level blocks with the same shape in the derived input and `ntaCalculation`. */
const SAME_SHAPE = [
  'calculationScope', 'areaSourceReference', 'heatPumpRenewable', 'bacsFactor', 'bacsSourceReference',
  'useInventoryComplete', 'declaredUses', 'declaredRenewableHeat', 'productionInventoryComplete', 'onSiteProduction',
  'pvSystems', 'cooling', 'coolingSystems', 'hotWater', 'additionalHotWaterSystems', 'spaceHeatingSolar', 'lighting',
  'demandUsesFixedC1Ventilation', 'batteryStoragePresent', 'storage', 'externalSupply',
] as const;

/** Blocks of the main heating chain (`spaceHeating.<key>` → `<key>`). */
const HEATING_CHAIN = ['emission', 'distribution', 'generator', 'collectiveConnection'] as const;

/** Demand blocks of a single-zone survey (`spaceHeating.demand.<key>` → `<key>`). */
const DEMAND = ['usageFunction', 'dwellingType', 'setpoints', 'thermalMass', 'internalGains', 'ventilationFlows', 'ventilation'] as const;

/** Parts of the derived input that are not taken over, with the reason key. */
export type SkippedPart = { path: string; reason: 'geometry' | 'multi_zone' | 'additional_heating' };

export interface SurveyTakeover {
  /** The draft with the survey's blocks written in. */
  next: Loose;
  /** Top-level `ntaCalculation` keys the takeover writes. */
  keys: string[];
  skipped: SkippedPart[];
}

/** True when the survey result holds a derived input that may be taken over. */
export function canTakeOver(assessment: OpnameAssessment | null | undefined): assessment is OpnameAssessment & { derivedInput: BuildingPerformanceInput } {
  return assessment != null && assessment.derivedInput != null
    && (assessment.status === 'calculated_unverified' || assessment.status === 'calculated_legacy_edition');
}

function present(value: unknown): boolean {
  return value !== undefined;
}

/** Writes the derived survey input into a copy of the NTA draft. */
export function surveyTakeover(derived: BuildingPerformanceInput, current: Loose | null): SurveyTakeover {
  const source = derived as unknown as Loose;
  const next: Loose = structuredClone(current ?? {});
  const keys: string[] = [];
  const skipped: SkippedPart[] = [];
  const put = (key: string, value: unknown) => {
    if (!present(value)) return;
    next[key] = structuredClone(value);
    keys.push(key);
  };
  for (const key of SAME_SHAPE) put(key, source[key]);
  const heating = (source.spaceHeating ?? {}) as Loose;
  for (const key of HEATING_CHAIN) put(key, heating[key]);
  const demand = (heating.demand ?? {}) as Loose;
  const zones = Array.isArray(heating.additionalZones) ? heating.additionalZones : [];
  if (zones.length === 0) {
    for (const key of DEMAND) put(key, demand[key]);
  } else {
    skipped.push({ path: 'spaceHeating.additionalZones', reason: 'multi_zone' });
  }
  if (Array.isArray(source.additionalHeatingSystems) && source.additionalHeatingSystems.length > 0) {
    skipped.push({ path: 'additionalHeatingSystems', reason: 'additional_heating' });
  }
  skipped.push({ path: 'spaceHeating.demand.transmission', reason: 'geometry' });
  skipped.push({ path: 'totalUsableFloorAreaM2', reason: 'geometry' });
  return { next, keys, skipped };
}

/** A short display of a value in the diff preview. */
export function previewValue(value: unknown, locale?: string): string {
  if (value === undefined) return '—';
  // A plain number follows the UI language (decimal comma in Dutch); objects stay JSON.
  if (typeof value === 'number' && locale && Number.isFinite(value)) {
    return value.toLocaleString(locale, { maximumFractionDigits: 6 });
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

/*
 * Ground floors. The takeover leaves the geometry to the project, so the
 * survey's floors to the ground (perimeter P, crawlspace or unheated cellar,
 * a heated basement from a façade part against the ground) only reach the
 * project through the `ntaCalculation.groundFloors` entry of a project floor.
 * The adviser pairs each survey floor with a project floor and accepts per
 * value; a value the project already holds is never replaced unasked.
 */

/** The `groundFloors` members a survey floor can carry into a project floor. */
export const GROUND_FIELDS = [
  'exposedPerimeterM', 'constructionResistanceM2kPerW', 'edgeThermalBridges', 'edgeInsulation', 'below', 'heatedBasement',
] as const;
export type GroundField = typeof GROUND_FIELDS[number];

/** Members whose absence in the survey means "none" (no crawlspace, no basement). */
const OPTIONAL_GROUND: ReadonlySet<GroundField> = new Set<GroundField>(['edgeInsulation', 'below', 'heatedBasement']);

/** A floor to the ground in the derived survey input. */
export interface SurveyGroundFloor { id: string; areaM2: number | null; floor: Loose }

/** A floor to the ground in the project geometry. */
export interface ProjectGroundSurface { id: string; name: string; areaM2: number }

/** One value of a survey floor offered for a project floor. */
export interface GroundFloorItem {
  key: string;
  surveyId: string;
  surfaceId: string;
  field: GroundField;
  from: unknown;
  to: unknown;
  /** `new`: the project has no value; `conflict`: it has another one. */
  status: 'new' | 'conflict';
}

const demandsOf = (derived: BuildingPerformanceInput): Loose[] => {
  const heating = ((derived as unknown as Loose).spaceHeating ?? {}) as Loose;
  const zones = Array.isArray(heating.additionalZones) ? heating.additionalZones as Loose[] : [];
  return [heating.demand as Loose | undefined, ...zones.map((zone) => zone.demand as Loose | undefined)]
    .filter((demand): demand is Loose => demand != null);
};

/** The survey's floors to the ground, in all its zones. */
export function surveyGroundFloors(derived: BuildingPerformanceInput): SurveyGroundFloor[] {
  return demandsOf(derived).flatMap((demand) => {
    const transmission = (demand.transmission ?? {}) as Loose;
    const floors = Array.isArray(transmission.groundFloors) ? transmission.groundFloors as Loose[] : [];
    return floors.map((floor) => ({
      id: String(floor.id ?? ''),
      areaM2: typeof floor.areaM2 === 'number' ? floor.areaM2 : null,
      floor,
    }));
  });
}

type SurfaceLike = { id?: unknown; name?: unknown; type?: unknown; thermalBoundary?: unknown; area?: unknown };

/** The project's floor surfaces to the ground (walls and roofs to the ground are refused by the kernel). */
export function projectGroundSurfaces(project: { zones?: Array<{ surfaces?: SurfaceLike[] }> } | null | undefined): ProjectGroundSurface[] {
  return (project?.zones ?? []).flatMap((zone) => zone.surfaces ?? [])
    .filter((surface) => surface.thermalBoundary === 'ground' && surface.type !== 'wall' && surface.type !== 'roof')
    .map((surface) => ({ id: String(surface.id), name: String(surface.name || surface.id), areaM2: Number(surface.area) || 0 }));
}

/**
 * The project floor proposed for each survey floor: the same id, else the only
 * floor on both sides, else the one free floor of the same area (±2 %);
 * otherwise none, and the adviser picks.
 */
export function proposeGroundPairs(floors: SurveyGroundFloor[], surfaces: ProjectGroundSurface[]): Record<string, string | null> {
  const pairs: Record<string, string | null> = {};
  const taken = new Set<string>();
  for (const floor of floors) {
    const same = surfaces.find((surface) => surface.id === floor.id);
    if (same) { pairs[floor.id] = same.id; taken.add(same.id); }
  }
  for (const floor of floors) {
    if (floor.id in pairs) continue;
    const free = surfaces.filter((surface) => !taken.has(surface.id));
    let pick: ProjectGroundSurface | undefined;
    if (floors.length === 1 && surfaces.length === 1) pick = free[0];
    else if (floor.areaM2 != null) {
      const area = floor.areaM2;
      const near = free.filter((surface) => Math.abs(surface.areaM2 - area) <= 0.02 * Math.max(area, 1));
      if (near.length === 1) pick = near[0];
    }
    pairs[floor.id] = pick?.id ?? null;
    if (pick) taken.add(pick.id);
  }
  return pairs;
}

/**
 * The value a survey floor gives for a member of a project's `groundFloors`
 * entry. ΔU_for of a heated basement is left out: on the forfait route the
 * kernel takes it from the project's own envelope (8.38 with 8.2.1).
 */
function surveyValue(floor: Loose, field: GroundField, project: unknown): unknown {
  const value = floor[field];
  if (field === 'heatedBasement' && value != null && typeof value === 'object') {
    const rest = { ...(value as Loose) };
    delete rest.forfaitDeltaUWPerM2k;
    // A ΔU_for the adviser entered on the project floor stays theirs.
    const own = project != null && typeof project === 'object' ? (project as Loose).forfaitDeltaUWPerM2k : undefined;
    if (own !== undefined && own !== null) rest.forfaitDeltaUWPerM2k = own;
    return rest;
  }
  return blank(value) ? undefined : value;
}

/** JSON with sorted object keys, so that member order does not count as a difference. */
const canonical = (value: unknown): string => JSON.stringify(value, (_key, item: unknown) =>
  item != null && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item as Loose).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
    : item);
const sameValue = (a: unknown, b: unknown) => canonical(a) === canonical(b);
/** Absent, null or an empty list (no edge insulation) all mean "none". */
const blank = (value: unknown) => value === undefined || value === null || (Array.isArray(value) && value.length === 0);

const entryOf = (draft: Loose | null, surfaceId: string): Loose | undefined =>
  (Array.isArray(draft?.groundFloors) ? draft.groundFloors as Loose[] : []).find((item) => item.surfaceId === surfaceId);

/** Every value that would change in the paired project floors; unchanged values are left out. */
export function groundFloorItems(derived: BuildingPerformanceInput, current: Loose | null, pairs: Record<string, string | null>): GroundFloorItem[] {
  const items: GroundFloorItem[] = [];
  const used = new Set<string>();
  for (const { id, floor } of surveyGroundFloors(derived)) {
    const surfaceId = pairs[id];
    // One project floor takes one survey floor: a second pairing to it is ignored.
    if (!surfaceId || used.has(surfaceId)) continue;
    used.add(surfaceId);
    const entry = entryOf(current, surfaceId) ?? {};
    for (const field of GROUND_FIELDS) {
      const to = surveyValue(floor, field, entry[field]);
      const from = entry[field] ?? undefined;
      if (blank(to) && !OPTIONAL_GROUND.has(field)) continue;
      if ((blank(from) && blank(to)) || sameValue(from, to)) continue;
      items.push({ key: `${id}→${surfaceId}.${field}`, surveyId: id, surfaceId, field, from, to, status: blank(from) ? 'new' : 'conflict' });
    }
  }
  return items;
}

/** Accepted by default: values the project does not have yet. A conflict needs the adviser's choice. */
export function defaultGroundSelection(items: GroundFloorItem[]): Set<string> {
  return new Set(items.filter((item) => item.status === 'new').map((item) => item.key));
}

/** The source reference of a project floor that took values over from a survey floor. */
function withSurveySource(current: unknown, floor: Loose, surveyId: string): string {
  const marker = `basisopname, vloer ${surveyId}`;
  const note = floor.sourceReference ? `${marker}: ${String(floor.sourceReference)}` : marker;
  const text = typeof current === 'string' ? current.trim() : '';
  const notes = text.split(';').map((part) => part.trim());
  if (notes.some((part) => part === marker || part.startsWith(`${marker}:`))) return text;
  return text ? `${text}; ${note}` : note;
}

/** Writes the accepted survey values into the paired `groundFloors` entries of a copy of the draft. */
export function applyGroundFloors(
  draft: Loose | null, derived: BuildingPerformanceInput, pairs: Record<string, string | null>, accepted: ReadonlySet<string>,
): Loose {
  const next: Loose = structuredClone(draft ?? {});
  const items = groundFloorItems(derived, draft, pairs).filter((item) => accepted.has(item.key));
  if (items.length === 0) return next;
  const list = Array.isArray(next.groundFloors) ? next.groundFloors as Loose[] : [];
  next.groundFloors = list;
  const floors = new Map(surveyGroundFloors(derived).map((item) => [item.id, item.floor]));
  for (const item of items) {
    let entry = list.find((candidate) => candidate.surfaceId === item.surfaceId);
    if (!entry) {
      entry = { surfaceId: item.surfaceId, sourceReference: '' };
      list.push(entry);
    }
    if (item.to === undefined) delete entry[item.field];
    else entry[item.field] = structuredClone(item.to);
    entry.sourceReference = withSurveySource(entry.sourceReference, floors.get(item.surveyId) ?? {}, item.surveyId);
  }
  return next;
}
