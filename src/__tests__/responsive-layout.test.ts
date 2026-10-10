import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Layout rules found in the responsive audit of 10 October 2026 (1024–1920 px).
// jsdom applies no media queries and computes no layout, so the rules are checked
// in the stylesheets themselves, like shell-empty-layout.test.ts does.

const read = (path: string) => readFileSync(resolve(__dirname, '..', path), 'utf8');
const shell = read('components/shell/shell.css');
const ui = read('components/ui/ui.css');
const nta = read('components/NtaPerformancePanel/NtaPerformancePanel.css');
const index = read('index.css');

/** The declarations of the first rule whose selector list contains `selector`. */
function declarations(css: string, selector: string): string {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(',').map((part) => part.trim().split('\n').pop()!.trim());
    if (selectors.includes(selector)) return match[2];
  }
  throw new Error(`no rule for ${selector}`);
}

/** The body of the media block with this exact condition. */
function media(css: string, condition: string): string {
  const start = css.indexOf(`@media ${condition}`);
  expect(start, `@media ${condition}`).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let index = css.indexOf('{', start); index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') { depth -= 1; if (depth === 0) return css.slice(css.indexOf('{', start) + 1, index); }
  }
  throw new Error('unclosed media block');
}

describe('responsive layout', () => {
  it('makes search, Opslaan and Herberekenen icon buttons below 1280 px, keeping their names', () => {
    // At 1024 px the document tabs were squeezed to their first letter.
    const narrow = media(shell, '(max-width: 1279px)');
    const label = declarations(narrow, '.top-bar .top-bar-label');
    expect(label).toMatch(/position:\s*absolute/);
    expect(label).toMatch(/clip:\s*rect\(0 0 0 0\)/);
    // Clipped, not removed: the text stays the accessible name.
    expect(label).not.toMatch(/display:\s*none/);
    // The narrow rule must come after the 1359 px rule that sets the search width.
    expect(shell.indexOf('@media (max-width: 1279px)')).toBeGreaterThan(shell.indexOf('@media (max-width: 1359px)'));
  });

  it('never squeezes the new-tab button', () => {
    // It was shrunk to a dot next to the document tabs.
    expect(declarations(shell, '.top-bar .document-tab-add')).toMatch(/flex:\s*none/);
  });

  it('scrolls the stepper instead of drawing its lines through the labels', () => {
    expect(declarations(ui, '.ui-stepper')).toMatch(/overflow-x:\s*auto/);
    const step = declarations(ui, '.ui-stepper__step');
    expect(step).not.toMatch(/min-width:\s*0/);
    expect(step).toMatch(/min-width:\s*max-content/);
  });

  it('gives the per-window tables the whole row of a section grid', () => {
    // They sat in one 200 px field column, with the window and surface names wrapped.
    expect(declarations(nta, '.nta-form-grid > .nta-performance-table')).toMatch(/grid-column:\s*1\s*\/\s*-1/);
  });

  it('draws one box around a NumberInput in a dialog field', () => {
    // .dialog-field input gave the inner control a second border (Bouwjaar on Registratie).
    const inner = declarations(index, '.dialog-field .ui-input .ui-input__control');
    expect(inner).toMatch(/border:\s*0/);
    expect(inner).toMatch(/background:\s*transparent/);
  });
  it('puts the separator after a stage, clipped at the end of a row', () => {
    // At 1024 px the stage cards on Installaties › Overzicht wrapped with a stray '›' at the start of
    // the second row. The separator now trails a stage; a stage that ends a row ends at the list's
    // edge, so its separator falls outside the padding and is clipped.
    expect(() => declarations(shell, '.chain-stages li + li::before')).toThrow();
    const separator = declarations(shell, '.chain-stages li:not(:last-child)::after');
    expect(separator).toMatch(/right:\s*-15px/);
    const list = declarations(shell, '.chain-stages');
    expect(list).toMatch(/overflow:\s*hidden/);
    expect(list).toMatch(/padding:\s*4px/);
    expect(list).toMatch(/margin:\s*-4px/);
  });
});
