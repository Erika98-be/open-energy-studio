import type { IProject, ProjectImportIssue } from '../energy/types';

/**
 * What an importer did with the foreign file beyond copying values
 * (BRL 9500/9501: the adviser must be able to see which data came from
 * another tool and what the program filled in):
 * - `defaulted`: a value was missing and a default was used;
 * - `invalid`: a value could not be read (or was out of range) and a
 *   default was used instead;
 * - `clamped`: a value lay outside its range and was limited to it;
 * - `dropped`: data in the file (or needed by the NTA calculation) could
 *   not be carried over;
 * - `unknown_reference`: a reference to an element that is not in the file;
 * - `duplicate`: the same element appeared more than once; the first counts;
 * - `multiple`: the file holds more than one building, unit or object and
 *   only the first was read.
 */
export type ImportIssue = ProjectImportIssue;
export type ImportIssueKind = ProjectImportIssue['kind'];

export interface ImportResult {
  project: IProject;
  fileName?: string;
  /** SHA-256 (hex) of the file as read. */
  sha256?: string;
  issues: ImportIssue[];
}

/**
 * A file the importer cannot read at all. `code` selects the NL/EN text
 * (`import.error.<code>`); `message` is the Dutch fallback.
 */
export class ImportFormatError extends Error {
  readonly code: string;
  readonly params: Record<string, string | number>;

  constructor(code: string, message: string, params: Record<string, string | number> = {}) {
    super(message);
    this.name = 'ImportFormatError';
    this.code = code;
    this.params = params;
  }
}

/** Own-property lookup: a code such as `constructor` or `__proto__` never resolves to Object.prototype. */
export function lookup<T>(table: Record<string | number, T>, key: string | number): T | undefined {
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

/**
 * Reads a number written by a Dutch or an English tool: "0,35", "0.35",
 * "1.234,5" (thousands dot with decimal comma) and "1 234,5". Null for
 * anything that is not a finite number.
 */
export function parseDecimalText(text: string | undefined | null): number | null {
  if (text == null) return null;
  let value = String(text).trim().replace(/[\s  ]/g, '');
  if (value === '') return null;
  if (value.includes(',')) {
    // A comma is the decimal separator; dots before it are thousands separators.
    if (value.indexOf(',') !== value.lastIndexOf(',')) return null;
    value = value.replace(/\./g, '').replace(',', '.');
  }
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export interface NumberRule {
  /** Used when the value is missing or unreadable; recorded as an issue. */
  fallback: number;
  /** Lower bound; `minExclusive` makes it exclusive (e.g. qv10 > 0). */
  min?: number;
  minExclusive?: boolean;
  max?: number;
  /** Limit an out-of-range value to the bound instead of using the fallback. */
  clamp?: boolean;
  /** No issue when the value is missing (the fallback is the documented meaning of "absent"). */
  silentWhenMissing?: boolean;
  /** Why the fallback is used, for the issue text. */
  fallbackReason?: string;
}

/** Collects the issues of one import. */
export class ImportIssues {
  readonly list: ImportIssue[] = [];

  add(kind: ImportIssueKind, path: string, message: string, value?: string | number): void {
    this.list.push({ path, kind, message, ...(value === undefined ? {} : { value }) });
  }

  /**
   * Reads `text` as a number under `rule`. A missing value gives the
   * fallback (`defaulted`), an unreadable one the fallback (`invalid`), an
   * out-of-range one the bound (`clamped`) or the fallback (`invalid`).
   */
  number(path: string, text: string | undefined | null, rule: NumberRule): number {
    const reason = rule.fallbackReason ? ` (${rule.fallbackReason})` : '';
    if (text == null || String(text).trim() === '') {
      if (!rule.silentWhenMissing) {
        this.add('defaulted', path, `Waarde ontbreekt in het bestand; ${rule.fallback} aangenomen${reason}.`, rule.fallback);
      }
      return rule.fallback;
    }
    const value = parseDecimalText(text);
    if (value === null) {
      this.add('invalid', path, `"${String(text).slice(0, 40)}" is geen getal; ${rule.fallback} aangenomen${reason}.`, String(text).slice(0, 40));
      return rule.fallback;
    }
    const belowMin = rule.min !== undefined && (rule.minExclusive ? value <= rule.min : value < rule.min);
    const aboveMax = rule.max !== undefined && value > rule.max;
    if (!belowMin && !aboveMax) return value;
    if (rule.clamp) {
      const bound = belowMin ? rule.min! : rule.max!;
      this.add('clamped', path, `${value} ligt buiten het bereik; begrensd op ${bound}.`, value);
      return bound;
    }
    this.add('invalid', path, `${value} ligt buiten het bereik; ${rule.fallback} aangenomen${reason}.`, value);
    return rule.fallback;
  }
}

/** Fields each format carries; anything else in the project is left out on export. */
const EXPORTED = {
  project: ['id', 'name', 'description', 'buildingFunction', 'address', 'city', 'zones', 'heatingSystems',
    'ventilationSystems', 'coolingSystems', 'hotWaterSystems', 'solarPV', 'solarThermal', 'constructions'],
  zone: ['id', 'name', 'floorArea', 'volume', 'height', 'surfaces', 'thermalBridges', 'airTightness'],
  surface: ['id', 'name', 'type', 'area', 'orientation', 'constructionId', 'zoneId', 'windows'],
  window: ['id', 'name', 'area', 'uValue', 'gValue', 'orientation', 'surfaceId'],
  thermalBridge: ['id', 'name', 'psiValue', 'length', 'zoneId'],
} as const;

/** Fields the program keeps for itself and never writes to a foreign format. */
const NOT_INPUT = new Set(['importLog']);

/**
 * The project data a UNIEC3 or VABI export leaves out, as path patterns
 * (`zones[*].surfaces[*].thermalBoundary`). Empty lists and absent fields
 * count as nothing lost.
 */
export function droppedOnExport(project: IProject, format: 'UNIEC3' | 'VABI'): string[] {
  const dropped = new Set<string>();
  const present = (item: unknown) => item !== undefined && item !== null && !(Array.isArray(item) && item.length === 0);
  const check = (value: unknown, keep: readonly string[], prefix: string) => {
    if (value == null || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (keep.includes(key) || !present(item)) continue;
      dropped.add(`${prefix}${key}`);
    }
  };
  for (const [key, item] of Object.entries(project)) {
    if (NOT_INPUT.has(key) || (EXPORTED.project as readonly string[]).includes(key) || !present(item)) continue;
    dropped.add(key);
  }
  for (const zone of project.zones ?? []) {
    check(zone, EXPORTED.zone, 'zones[*].');
    if (zone.airTightness?.assumed) dropped.add('zones[*].airTightness.assumed');
    for (const surface of zone.surfaces ?? []) {
      check(surface, EXPORTED.surface, 'zones[*].surfaces[*].');
      for (const window of surface.windows ?? []) check(window, EXPORTED.window, 'zones[*].surfaces[*].windows[*].');
    }
    for (const bridge of zone.thermalBridges ?? []) check(bridge, EXPORTED.thermalBridge, 'zones[*].thermalBridges[*].');
  }
  // VABI carries a construction's layers; UNIEC3 only its Rc and U.
  const constructionKeep = format === 'VABI'
    ? ['id', 'name', 'layers', 'rcValue', 'uValue']
    : ['id', 'name', 'rcValue', 'uValue'];
  for (const construction of project.constructions ?? []) check(construction, constructionKeep, 'constructions[*].');
  return [...dropped].sort();
}

/**
 * The NTA 8800 input neither format carries; recorded once per import so
 * the adviser knows the NTA input still has to be entered.
 */
export function ntaInputNotInFormat(issues: ImportIssues, tool: string): void {
  issues.add('dropped', 'ntaCalculation',
    `${tool} bevat geen NTA 8800-rekeninvoer (rekenblok, grens per vlak, onverwarmde ruimten, puntkoudebruggen); vul die aan bij de NTA-invoer.`);
}

/** Strips a UTF-8 byte-order mark. */
export function withoutBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
