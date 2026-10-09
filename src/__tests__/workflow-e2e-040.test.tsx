/**
 * The inputs added for kernel 0.4.0 end to end in the full app, as an adviser enters them: the step page,
 * the apply bar, the request the kernel gets, and what the app makes of the kernel's answer (result pages,
 * report, "Ga naar"). The HTTP kernel is stubbed with the real answers of the examples
 * (training-data/*.kernel-output.json), extended with what the kernel returns for the new input; the kernel
 * side of each input is covered by the Rust tests named per case.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { clearSessionEvidence } from '../core/nta/Evidence';

const root = resolve(__dirname, '../..');
const json = (file: string) => JSON.parse(readFileSync(resolve(root, 'training-data', file), 'utf8')) as Record<string, unknown>;
const officeProject = json('nta8800-example-office.json');
const officeOutput = json('nta8800-example-office.kernel-output.json');
const terracedProject = json('nta8800-example-terraced-dwelling.json');
const terracedOutput = json('nta8800-example-terraced-dwelling.kernel-output.json');

type Body = Record<string, unknown>;
type NtaBlock = Record<string, unknown>;
const requests: Array<{ url: string; body: Body | null }> = [];
let projectAnswer: (block: NtaBlock | undefined) => unknown;
let surveyAnswer: (body: Body | null) => unknown = () => ({});

const projectBodies = () => requests.filter((request) => request.url.endsWith('/project/performance'))
  .map((request) => (request.body as { project: { ntaCalculation?: NtaBlock } }).project);
const lastNta = () => projectBodies().slice(-1)[0]?.ntaCalculation as Record<string, any> | undefined;

beforeEach(() => {
  requests.length = 0;
  clearSessionEvidence();
  try { window.localStorage.clear(); } catch { /* ignore */ }
  window.history.replaceState(null, '', '/');
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) as Body : null;
    requests.push({ url: String(url), body });
    const answer = (value: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => structuredClone(value) });
    if (String(url).endsWith('/project/performance')) {
      return answer(projectAnswer((body as { project: { ntaCalculation?: NtaBlock } }).project.ntaCalculation));
    }
    if (String(url).endsWith('/opname/residential')) return answer(surveyAnswer(body));
    if (String(url).endsWith('/interpretations')) return answer([]);
    // Diagnostics: no answer, as with a kernel that is still busy.
    return new Promise(() => {});
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type User = ReturnType<typeof userEvent.setup>;
const nav = () => screen.getByRole('navigation', { name: 'Workflow steps' });
const main = () => within(screen.getByRole('main'));
const bar = () => within(screen.getByRole('region', { name: 'NTA input draft' }));

async function openStep(user: User, step: RegExp, sub?: string) {
  await user.click(within(nav()).getByRole('button', { name: step }));
  if (sub) await user.click(within(nav()).getByRole('button', { name: sub }));
}

async function kernelRuns(count: number) {
  await waitFor(() => expect(projectBodies().length).toBeGreaterThanOrEqual(count), { timeout: 5000 });
}

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

async function openProject(user: User, project: Record<string, unknown>) {
  render(<App />);
  await openProjectFile(user, structuredClone(project));
  await kernelRuns(1);
}

async function kernelSettled() {
  let seen = -1;
  let since = Date.now();
  await waitFor(() => {
    const count = projectBodies().length;
    if (count !== seen) { seen = count; since = Date.now(); }
    expect(Date.now() - since).toBeGreaterThan(700);
  }, { timeout: 5000, interval: 100 });
}

async function applyDraft(user: User) {
  const runs = projectBodies().length;
  await user.click(bar().getByRole('button', { name: /^Apply/ }));
  expect(screen.queryByRole('region', { name: 'NTA input draft' })).toBeNull();
  await kernelRuns(runs + 1);
  await kernelSettled();
}

/** Types into a number field (the field takes Dutch or English decimals). */
async function typeNumber(user: User, field: HTMLElement, value: string) {
  await user.clear(field);
  await user.type(field, value);
}

describe('common spaces (6.6.4)', () => {
  it('enters a common space on a single utility zone, lets the kernel fill hot water and lighting, and reports the split', async () => {
    const user = userEvent.setup();
    // What crates/nta8800-core/src/common_space.rs returns for this input (tests: case_h_common_space_*).
    const split = {
      source: 'NTA 8800:2025+C1:2026 6.6.4',
      spaces: [{ zoneId: 'z1', areaM2: 40,
        withinZone: [{ function: 'office', areaM2: 33.33 }, { function: 'other_assembly', areaM2: 6.67 }],
        building: [{ function: 'office', areaM2: 33.33 }, { function: 'other_assembly', areaM2: 6.67 }] }],
      zones: [{ zoneId: 'z1', initial: [{ function: 'office', areaM2: 300 }, { function: 'other_assembly', areaM2: 60 }],
        allocated: [{ function: 'office', areaM2: 333.33 }, { function: 'other_assembly', areaM2: 66.67 }] }],
      building: [{ function: 'office', areaM2: 333.33 }, { function: 'other_assembly', areaM2: 66.67 }],
      withinZones: [{ function: 'office', areaM2: 333.33 }, { function: 'other_assembly', areaM2: 66.67 }],
      filled: ['zoneData[0].ventilation.functions', 'hotWater.need.areas', 'lighting[0].functions', 'bblFunctions', 'labelFunctions'],
    };
    projectAnswer = (block) => ((block?.zoneData as unknown[] | undefined)?.length ? { ...officeOutput, commonSpaces: split } : officeOutput);
    await openProject(user, officeProject);

    // A single utility zone: its own data hold the function areas and the common space.
    await openStep(user, /^Building/, 'Calculation zones');
    await user.click(main().getByRole('button', { name: 'Own data for this calculation zone' }));
    await user.click(main().getByRole('button', { name: 'Add a part with another use function (§6.5.3)' }));
    await user.click(main().getByRole('button', { name: 'Add a part with another use function (§6.5.3)' }));
    const parts = main().getAllByLabelText('Use function of this part of the calculation zone');
    const areas = main().getAllByLabelText(/Usable floor area of this part/);
    await user.selectOptions(parts[0], 'office');
    await typeNumber(user, areas[0], '300');
    await user.selectOptions(parts[1], 'other_assembly');
    await typeNumber(user, areas[1], '60');
    await user.click(main().getByRole('button', { name: 'Add a common space (6.6.4)' }));
    const space = within(main().getByRole('group', { name: 'Common space in this calculation zone (6.6.4)' }));
    await typeNumber(user, space.getByLabelText(/Usable floor area of the common space/), '40');
    await user.click(space.getByLabelText('Office'));
    await user.click(space.getByLabelText('Assembly, other'));
    await user.type(space.getByLabelText(/Source of the common space/), 'NEN 2580-meetstaat');

    // Hot water and lighting: the kernel fills their function lists from the split.
    await openStep(user, /^Installations/, 'Domestic hot water');
    await user.click(main().getByLabelText('Let the kernel split the areas per function from the common spaces (6.6.4)'));
    await openStep(user, /^Installations/, 'Lighting');
    await user.click(main().getByLabelText('Let the kernel split the areas per function from the common spaces (6.6.4)'));
    await applyDraft(user);

    const nta = lastNta()!;
    expect(nta.zoneData[0].zoneId).toBe('z1');
    expect(nta.zoneData[0].functionAreas).toEqual([{ function: 'office', areaM2: 300 }, { function: 'other_assembly', areaM2: 60 }]);
    expect(nta.zoneData[0].commonSpaces).toEqual([
      { areaM2: 40, servedFunctions: ['office', 'other_assembly'], sourceReference: 'NEN 2580-meetstaat' }]);
    expect(nta.hotWater.need.areas).toEqual([]);
    expect(nta.lighting[0].functions).toEqual([]);

    // The report traces the split and the lists the kernel filled.
    await openStep(user, /^Report/);
    const preview = () => (main().getByTestId('report-builder-preview') as HTMLIFrameElement).getAttribute('srcdoc') ?? '';
    await user.click(await main().findByRole('radio', { name: /^Detailed/ }, { timeout: 10000 }));
    await waitFor(() => expect(preview()).toContain('Gemeenschappelijke ruimten (6.6.4)'));
    expect(preview()).toContain('office 333,33 m²');
    expect(preview()).toContain('hotWater.need.areas');
    expect(preview()).toContain('lighting[0].functions');
  }, 60000);
});
