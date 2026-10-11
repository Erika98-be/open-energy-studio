/**
 * Smoke test of the full app against the real Rust kernel, without the API
 * server: every `/api/…` call is answered in-process by the `kernel_once`
 * example (crates/nta8800-service/examples/kernel_once.rs). Opens the example
 * terraced dwelling and office, waits for the kernel answer and checks the
 * status bar shows the kernel's own BENG values and kernel version; an edit
 * marks the result outdated until the new answer arrives.
 *
 * Opt-in: runs only when OES_KERNEL_ONCE names the built example binary.
 * scripts/verify-nta.sh builds it and sets the variable; a plain `vitest run`
 * skips this file.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { clearSessionEvidence } from '../core/nta/Evidence';
import type { ProjectPerformanceAssessment } from '../core/nta/KernelClient';
import { summarizeForPreview } from '../core/nta/PreviewSummary';
import { formatNumber } from '../i18n/format';
import { SLOW_UI_TEST_MS } from './timeouts';

const binary = process.env.OES_KERNEL_ONCE;
const root = resolve(__dirname, '../..');
const example = (file: string) => JSON.parse(readFileSync(resolve(root, 'training-data', file), 'utf8')) as Record<string, unknown>;

/** One kernel operation through `kernel_once`: the same answer the API server would give. */
function kernel(method: string, path: string, body?: unknown): { status: number; body: unknown } {
  const run = spawnSync(binary!, [method, path], { input: body == null ? '' : JSON.stringify(body), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(`kernel_once ${method} ${path} failed: ${run.stderr}`);
  return JSON.parse(run.stdout) as { status: number; body: unknown };
}

const projectBodies: unknown[] = [];

beforeEach(() => {
  projectBodies.length = 0;
  clearSessionEvidence();
  try { window.localStorage.clear(); } catch { /* ignore */ }
  window.history.replaceState(null, '', '/');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url).replace(/^\/api/, '');
    const body = init?.body ? JSON.parse(String(init.body)) as unknown : undefined;
    if (path.endsWith('/project/performance')) projectBodies.push(body);
    const outcome = kernel(init?.method ?? (body === undefined ? 'GET' : 'POST'), path, body);
    return {
      ok: outcome.status < 400,
      status: outcome.status,
      json: async () => outcome.body,
      text: async () => JSON.stringify(outcome.body),
    };
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type User = ReturnType<typeof userEvent.setup>;
const statusBar = () => document.querySelector('footer.status-bar') as HTMLElement;

async function openProjectFile(user: User, project: unknown) {
  const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
    if (this.type !== 'file') return;
    const file = new File([JSON.stringify({ version: '1.0', type: 'open-energy-studio', project })], 'project.oes.json', { type: 'application/json' });
    Object.defineProperty(this, 'files', { value: [file], configurable: true });
    this.onchange?.(new Event('change'));
  });
  await user.keyboard('{Control>}o{/Control}');
  click.mockRestore();
  await waitFor(() => expect(screen.getAllByRole('button', { name: /^Close tab/ })).toHaveLength(2));
}

/** The status bar of the settled answer agrees with the kernel's answer to the last request the app sent. */
async function expectKernelFigures() {
  await waitFor(() => expect(statusBar()).toHaveTextContent('Result current'), { timeout: 30_000 });
  const request = projectBodies[projectBodies.length - 1];
  const assessment = kernel('POST', '/v1/nta8800/project/performance', request).body as ProjectPerformanceAssessment;
  const summary = summarizeForPreview(assessment);
  expect(summary.beng1).not.toBeNull();
  const health = kernel('GET', '/health').body as { kernelVersion: string };
  const bar = statusBar();
  expect(bar).toHaveTextContent(`Kernel ${health.kernelVersion}`);
  expect(bar).toHaveTextContent(`BENG 1 ${formatNumber(summary.beng1, 'en', 1)}`);
  expect(bar).toHaveTextContent(`BENG 2 ${formatNumber(summary.beng2, 'en', 1)}`);
  return summary;
}

describe.skipIf(!binary)('full app against the real kernel (kernel_once)', () => {
  it('calculates the example terraced dwelling and recalculates after an edit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openProjectFile(user, example('nta8800-example-terraced-dwelling.json'));
    const before = await expectKernelFigures();

    // An overhang on the south window: the draft is applied, the result is outdated until the new answer.
    await user.click(within(screen.getByRole('navigation', { name: 'Workflow steps' })).getByRole('button', { name: /^Building/ }));
    const page = within(screen.getByRole('main'));
    await user.selectOptions(page.getByLabelText('Obstruction Raam S'), 'overhang');
    const group = within(page.getByRole('group', { name: 'Raam S' }));
    await user.type(group.getByLabelText('Relative height (h/a)'), '0,9');
    await user.type(group.getByLabelText('Source'), 'gevelaanzicht');
    const runs = projectBodies.length;
    await user.click(within(screen.getByRole('region', { name: 'NTA input draft' })).getByRole('button', { name: /^Apply/ }));
    await waitFor(() => expect(statusBar()).toHaveTextContent('Result outdated'), { timeout: 10_000 });
    await waitFor(() => expect(projectBodies.length).toBeGreaterThan(runs), { timeout: 10_000 });
    const after = await expectKernelFigures();
    expect(after.beng1).not.toBe(before.beng1);
  }, SLOW_UI_TEST_MS);

  it('calculates the example office', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openProjectFile(user, example('nta8800-example-office.json'));
    await expectKernelFigures();
  }, SLOW_UI_TEST_MS);
});
