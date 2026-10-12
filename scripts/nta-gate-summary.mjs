#!/usr/bin/env node
// Summary of a release gate run (BRL 9501 §6.2–6.3), read from what the gate
// itself wrote: the gate log of scripts/verify-nta.sh and the reference-suite
// report of reference_gate. scripts/release-nta.sh writes it as
// gate-samenvatting.json and fills the test report and the GitHub release
// text from it, so no test count in a delivery document is typed by hand.
//
//   node scripts/nta-gate-summary.mjs --log <gate.log> [--reference <reference-report.json>]
//        --out <gate-samenvatting.json>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normaliseNewlines } from './nta-kernel-version.mjs';

const RUST_RESULT = /^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored;/;
const VITEST_FILES = /^\s*Test Files\s+(.*)\((\d+)\)\s*$/;
const VITEST_TESTS = /^\s*Tests\s+(.*)\((\d+)\)\s*$/;
const STEP_TIME = /^\s*(\d+)s {2}(.+)$/;

function vitestCounts(text) {
  const count = (word) => Number((new RegExp(`(\\d+) ${word}`).exec(text) ?? [])[1] ?? 0);
  return { passed: count('passed'), failed: count('failed'), skipped: count('skipped') };
}

/**
 * The gate steps in run order with their Rust and Vitest counts, and the step
 * times of the closing "Gate step times:" table. A step that ran in the
 * background prints its own header again when it is collected; both parts
 * count towards the one step.
 */
export function summariseGateLog(logText) {
  const lines = normaliseNewlines(logText).split('\n');
  const steps = [];
  const byName = new Map();
  let current = null;
  let inTimes = false;
  const times = [];
  for (const line of lines) {
    if (line.startsWith('Gate step times:')) {
      inTimes = true;
      continue;
    }
    if (inTimes) {
      const time = STEP_TIME.exec(line);
      if (time) times.push({ name: time[2].trim(), seconds: Number(time[1]) });
      continue;
    }
    const header = /^==> (.+?)(?: \(started in the background, log .*\))?$/.exec(line);
    if (header) {
      const name = header[1].trim();
      current = byName.get(name);
      if (!current) {
        current = { name, rust: null, vitest: null };
        byName.set(name, current);
        steps.push(current);
      }
      continue;
    }
    if (!current) continue;
    const rust = RUST_RESULT.exec(line);
    if (rust) {
      current.rust ??= { binaries: 0, passed: 0, failed: 0, ignored: 0 };
      current.rust.binaries += 1;
      current.rust.passed += Number(rust[2]);
      current.rust.failed += Number(rust[3]);
      current.rust.ignored += Number(rust[4]);
      continue;
    }
    const files = VITEST_FILES.exec(line);
    if (files) {
      current.vitest ??= {};
      current.vitest.files = { ...vitestCounts(files[1]), total: Number(files[2]) };
      continue;
    }
    const tests = VITEST_TESTS.exec(line);
    if (tests) {
      current.vitest ??= {};
      current.vitest.tests = { ...vitestCounts(tests[1]), total: Number(tests[2]) };
    }
  }
  const totalTime = times.find((time) => time.name === 'total');
  for (const step of steps) {
    // A background step is timed as "<name> (background)".
    const time =
      times.find((entry) => entry.name === step.name) ??
      times.find((entry) => entry.name === `${step.name} (background)`);
    step.seconds = time ? time.seconds : null;
  }
  const passedLine = lines.some((line) => line.startsWith('All configured technical NTA gates passed'));
  return { steps, totalSeconds: totalTime ? totalTime.seconds : null, passed: passedLine };
}

/** Cases per suite and verdict from reference_gate's reference-report.json. */
export function summariseReferenceReport(report) {
  const suites = new Map();
  for (const item of report.cases ?? []) {
    const suite = item.suite ?? '(los)';
    const entry = suites.get(suite) ?? { suite, total: 0, compared: 0, passed: 0, pending: 0, other: 0 };
    entry.total += 1;
    const status = item.comparison?.status;
    if (status === 'compared_pass') {
      entry.compared += 1;
      entry.passed += 1;
    } else if (status === 'compared_fail') {
      entry.compared += 1;
    } else if (status === 'pending_expectation') {
      entry.pending += 1;
    } else {
      entry.other += 1;
    }
    suites.set(suite, entry);
  }
  return {
    verdict: report.comparisonVerdict ?? null,
    comparedCases: report.comparedCases ?? null,
    pendingExpectationCases: report.pendingExpectationCases ?? null,
    totalCases: (report.cases ?? []).length,
    kernelVersion: report.kernelVersion ?? null,
    suites: [...suites.values()],
  };
}

function rustText(rust) {
  const extra = [rust.failed ? `${rust.failed} mislukt` : '', rust.ignored ? `${rust.ignored} genegeerd` : '']
    .filter(Boolean)
    .join(', ');
  return `Rust: ${rust.passed} geslaagd${extra ? ` (${extra})` : ''}, ${rust.binaries} ${rust.binaries === 1 ? 'testprogramma' : 'testprogramma’s'}`;
}

function vitestText(vitest) {
  const parts = [];
  if (vitest.tests) {
    const skipped = vitest.tests.skipped ? `, ${vitest.tests.skipped} overgeslagen` : '';
    const failed = vitest.tests.failed ? `, ${vitest.tests.failed} mislukt` : '';
    parts.push(`Vitest: ${vitest.tests.passed} van ${vitest.tests.total} tests geslaagd${failed}${skipped}`);
  }
  if (vitest.files) parts.push(`${vitest.files.passed} van ${vitest.files.total} bestanden`);
  return parts.join(', ');
}

/** The summary as Markdown, for the test report (Dutch, like the template). */
export function renderGateSummaryMarkdown(summary) {
  if (!summary) return 'Gate overgeslagen (proefvrijgave): geen uitvoer om samen te vatten.';
  const { gate, reference } = summary;
  const lines = [
    `Uit \`gate.log\` en \`evidence/reference/reference-report.json\` van deze vrijgave. ` +
      `Gate ${gate.passed ? 'geslaagd' : 'niet geslaagd'}` +
      (gate.totalSeconds !== null ? `, totale duur ${gate.totalSeconds} s.` : '.'),
    '',
    '| Stap | Resultaat | Duur (s) |',
    '|---|---|---|',
  ];
  for (const step of gate.steps) {
    const result = [step.rust ? rustText(step.rust) : '', step.vitest ? vitestText(step.vitest) : '']
      .filter(Boolean)
      .join('; ');
    const fallback = /\bskipped\b/.test(step.name) ? 'overgeslagen' : 'geslaagd';
    lines.push(`| ${step.name} | ${result || fallback} | ${step.seconds ?? ''} |`);
  }
  if (reference) {
    lines.push(
      '',
      `Referentiesuites: oordeel \`${reference.verdict}\`, ${reference.comparedCases} van ` +
        `${reference.totalCases} gevallen vergeleken, ${reference.pendingExpectationCases} zonder verwachting.`,
      '',
      '| Suite | Gevallen | Vergeleken | Binnen de band | Zonder verwachting | Overig |',
      '|---|---|---|---|---|---|',
    );
    for (const suite of reference.suites) {
      lines.push(
        `| ${suite.suite} | ${suite.total} | ${suite.compared} | ${suite.passed} | ${suite.pending} | ${suite.other} |`,
      );
    }
  }
  return lines.join('\n');
}

/** One English sentence for the GitHub release body. */
export function renderGateSummaryEnglish(summary) {
  if (!summary) return '';
  const { gate, reference } = summary;
  let rust = 0;
  let ui = null;
  for (const step of gate.steps) {
    if (step.rust) rust += step.rust.passed;
    if (step.name === 'UI tests' && step.vitest?.tests) ui = step.vitest;
  }
  const parts = [`${rust} Rust tests passed across all gate steps (the kernel counted again on Rust 1.77.2)`];
  if (ui) parts.push(`${ui.tests.passed} UI tests in ${ui.files.passed} files`);
  if (reference) {
    parts.push(
      `reference suites: ${reference.comparedCases} of ${reference.totalCases} cases compared ` +
        `(verdict \`${reference.verdict}\`), ${reference.pendingExpectationCases} without expected values`,
    );
  }
  const time = gate.totalSeconds !== null ? ` Gate time ${Math.round(gate.totalSeconds / 60)} min.` : '';
  return `${parts.join('; ')}.${time}`;
}

function main(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) options[argv[i].replace(/^--/, '')] = argv[i + 1];
  if (!options.log || !options.out) {
    console.error('--log en --out zijn verplicht');
    return 2;
  }
  const gate = summariseGateLog(readFileSync(options.log, 'utf8'));
  const reference =
    options.reference && existsSync(options.reference)
      ? summariseReferenceReport(JSON.parse(readFileSync(options.reference, 'utf8')))
      : null;
  writeFileSync(options.out, `${JSON.stringify({ gate, reference }, null, 2)}\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main(process.argv.slice(2)));
}
