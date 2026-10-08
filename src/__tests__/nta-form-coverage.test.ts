import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import catalogue from '../../training-data/nta8800-input-options.json';
import { FORM_COVERAGE_EXEMPTIONS, FORM_SOURCES } from '../core/nta/formCoverage';

interface CatalogueEntry { route: string; kind: 'variant' | 'field'; path: string; options: string[] }

function sourceFiles(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    if (statSync(child).isDirectory()) return sourceFiles(child);
    return /\.tsx?$/.test(name) && !name.includes('.test.') ? [child] : [];
  });
}

const formText = FORM_SOURCES.flatMap((source) => sourceFiles(source))
  .map((file) => readFileSync(file, 'utf8')).join('\n');

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The option's name as a string literal, an object key or a property access in the form code. */
function named(option: string): boolean {
  const name = escape(option);
  return new RegExp(`['"\`]${name}['"\`]`).test(formText)
    || new RegExp(`\\b${name}\\s*\\??:`).test(formText)
    || new RegExp(`\\.${name}\\b`).test(formText);
}

const entries = catalogue as CatalogueEntry[];
const exempt = (route: string, path: string, option: string) => FORM_COVERAGE_EXEMPTIONS.find((item) =>
  item.route === route && item.path === path && item.options.includes(option));

describe('form coverage of the kernel input (docs/ui-redesign/formulierdekking.md)', () => {
  it('has a catalogue of the kernel input options', () => {
    const options = entries.reduce((sum, entry) => sum + entry.options.length, 0);
    expect(options).toBeGreaterThan(1500);
    expect(new Set(entries.map((entry) => entry.route))).toEqual(new Set(['project', 'residentialSurvey', 'utilitySurvey']));
  });

  it('offers every option in a form or lists it as JSON-only with a reason', () => {
    const missing = entries.flatMap((entry) => entry.options
      .filter((option) => !named(option) && !exempt(entry.route, entry.path, option))
      .map((option) => `${entry.route} ${entry.kind} ${entry.path}: ${option}`));
    expect(missing, 'add a form field, or an entry in FORM_COVERAGE_EXEMPTIONS with the reason').toEqual([]);
  });

  it('keeps no stale exemptions', () => {
    const stale = FORM_COVERAGE_EXEMPTIONS.flatMap((item) => item.options
      .filter((option) => {
        const entry = entries.find((candidate) => candidate.route === item.route && candidate.path === item.path);
        return entry == null || !entry.options.includes(option) || named(option);
      })
      .map((option) => `${item.route} ${item.path}: ${option}`));
    expect(stale).toEqual([]);
    for (const item of FORM_COVERAGE_EXEMPTIONS) expect(item.reason.length).toBeGreaterThan(20);
  });
});
