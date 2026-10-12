import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  renderGateSummaryEnglish,
  renderGateSummaryMarkdown,
  summariseGateLog,
  summariseReferenceReport,
} from '../../scripts/nta-gate-summary.mjs';
import { readIdentity } from '../../scripts/nta-leveringsdocument.mjs';
import { renderGithubRelease } from '../../scripts/nta-github-release.mjs';

const root = join(__dirname, '../..');

// The shape scripts/verify-nta.sh writes: step headers, cargo and Vitest
// result lines, a background step collected later, and the closing table.
const LOG = [
  '==> kernel version and release notes',
  '    (0s)',
  '==> tests crates/nta8800-core',
  'test result: ok. 985 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.45s',
  'test result: ok. 0 passed; 0 failed; 3 ignored; 0 measured; 0 filtered out; finished in 0.00s',
  'test result: ok. 7 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 21.66s',
  '==> core on Rust 1.77.2 (started in the background, log /tmp/x/core-on-rust-1.77.2.log)',
  '==> reference suites (report in nta-evidence/gate/reference)',
  '==> planned reference comparisons skipped (no plan or case directory configured)',
  '==> core on Rust 1.77.2',
  'test result: ok. 992 passed; 0 failed; 5 ignored; 0 measured; 0 filtered out; finished in 9.48s',
  '==> UI tests',
  ' Test Files  172 passed | 1 skipped (173)',
  '      Tests  1616 passed | 7 skipped (1623)',
  '==> app against the real kernel (kernel_once)',
  ' Test Files  1 passed (1)',
  '      Tests  7 passed (7)',
  'All configured technical NTA gates passed; reference verification and attestation require separate evidence.',
  '',
  'Gate step times:',
  '    0s  kernel version and release notes',
  '  348s  tests crates/nta8800-core',
  '  415s  core on Rust 1.77.2 (background)',
  '   11s  reference suites (report in nta-evidence/gate/reference)',
  '    0s  planned reference comparisons skipped (no plan or case directory configured)',
  '  391s  UI tests',
  '   54s  app against the real kernel (kernel_once)',
  ' 1743s  total',
].join('\n');

const REPORT = {
  kernelVersion: '0.4.0',
  comparisonVerdict: 'passed',
  comparedCases: 2,
  pendingExpectationCases: 1,
  cases: [
    { suite: 'openbare-gevallen.json', comparison: { status: 'compared_pass' } },
    { suite: 'openbare-gevallen.json', comparison: { status: 'compared_fail' } },
    { suite: 'isso54-v2.json', comparison: { status: 'pending_expectation' } },
  ],
};

describe('gate summary (scripts/nta-gate-summary.mjs)', () => {
  it('reads every step with its Rust and Vitest counts and its time', () => {
    const gate = summariseGateLog(LOG);
    expect(gate.passed).toBe(true);
    expect(gate.totalSeconds).toBe(1743);
    const core = gate.steps.find((step) => step.name === 'tests crates/nta8800-core')!;
    expect(core.rust).toEqual({ binaries: 3, passed: 992, failed: 0, ignored: 5 });
    expect(core.seconds).toBe(348);
    const msrv = gate.steps.find((step) => step.name === 'core on Rust 1.77.2')!;
    expect(msrv.rust?.passed).toBe(992);
    expect(msrv.seconds).toBe(415);
    expect(gate.steps.filter((step) => step.name === 'core on Rust 1.77.2')).toHaveLength(1);
    const ui = gate.steps.find((step) => step.name === 'UI tests')!;
    expect(ui.vitest?.tests).toEqual({ passed: 1616, failed: 0, skipped: 7, total: 1623 });
    expect(ui.vitest?.files).toEqual({ passed: 172, failed: 0, skipped: 1, total: 173 });
  });

  it('names the reference step without the machine-local archive path', () => {
    const local = '/home/someone/repo/release/dry-run-x/evidence/reference';
    const gate = summariseGateLog(
      `==> reference suites (report in ${local})\nGate step times:\n   11s  reference suites (report in ${local})\n`,
    );
    expect(gate.steps[0].name).toBe('reference suites (report in evidence/reference)');
    expect(gate.steps[0].seconds).toBe(11);
  });

  it('is not passed without the closing gate line', () => {
    expect(summariseGateLog(LOG.replace(/All configured.*\n/, '')).passed).toBe(false);
  });

  it('counts the reference cases per suite and keeps the verdict', () => {
    const reference = summariseReferenceReport(REPORT);
    expect(reference.verdict).toBe('passed');
    expect(reference.totalCases).toBe(3);
    expect(reference.suites).toEqual([
      { suite: 'openbare-gevallen.json', total: 2, compared: 2, passed: 1, pending: 0, other: 0 },
      { suite: 'isso54-v2.json', total: 1, compared: 0, passed: 0, pending: 1, other: 0 },
    ]);
  });

  it('fills the test report with the counts from the gate, and says when the gate was skipped', () => {
    const summary = { gate: summariseGateLog(LOG), reference: summariseReferenceReport(REPORT) };
    const markdown = renderGateSummaryMarkdown(summary);
    expect(markdown).toContain('| UI tests | Vitest: 1616 van 1623 tests geslaagd, 7 overgeslagen, 172 van 173 bestanden | 391 |');
    expect(markdown).toContain('| planned reference comparisons skipped (no plan or case directory configured) | overgeslagen | 0 |');
    expect(markdown).toContain('| isso54-v2.json | 1 | 0 | 0 | 1 | 0 |');
    expect(renderGateSummaryMarkdown(null)).toMatch(/overgeslagen/);
    const template = readFileSync(join(root, 'docs/templates/nta8800-testrapport.md'), 'utf8');
    expect(template).toContain('{{GATE_SUMMARY}}');
  });

  it('puts the counts in the GitHub release text instead of a typed number', () => {
    const summary = { gate: summariseGateLog(LOG), reference: summariseReferenceReport(REPORT) };
    expect(renderGateSummaryEnglish(summary)).toContain('1616 UI tests in 172 files');
    const body = renderGithubRelease({
      identity: readIdentity(root),
      tag: 'oes-vX-kernel-vY',
      commit: 'a'.repeat(40),
      notesText: '## Onuitgebracht\n',
      assets: [],
      gateSummary: summary,
    });
    expect(body).toContain('1984 Rust tests passed');
    expect(body).toContain('2 of 3 cases compared');
    expect(body).toContain('gate-samenvatting.json');
  });
});
