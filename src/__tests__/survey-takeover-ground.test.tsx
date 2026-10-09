import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useEnergy } from '../context/EnergyContext';
import { useNtaDraft } from '../context/NtaDraftProvider';
import type { IProject } from '../core/energy/types';
import type { BuildingPerformanceInput, OpnameAssessment } from '../core/nta/KernelClient';
import {
  applyGroundFloors, defaultGroundSelection, groundFloorItems, projectGroundSurfaces, proposeGroundPairs, surveyGroundFloors,
} from '../core/nta/SurveyTakeover';
import { SurveyTakeoverAction } from '../components/BasisopnamePanel/SurveyTakeoverAction';
import terraced from '../../training-data/nta8800-example-terraced-dwelling.json';
import fixture from '../../training-data/nta8800-survey-takeover-ground.json';
import { renderWithProviders } from './test-utils';

// "Overnemen in projectmodel" for floors to the ground. The fixture holds the
// survey floor the kernel derives (2015 detached house with a façade part
// against the ground) and the project entry the takeover must write from it;
// crates/nta8800-core/tests/survey_takeover.rs checks that the kernel still
// derives that floor and that a project floor with that entry calculates with
// the survey's ground conductance.

type Loose = Record<string, unknown>;

const derived = {
  spaceHeating: { demand: { transmission: { groundFloors: [fixture.surveyFloor] } } },
} as unknown as BuildingPerformanceInput;

const blankEntry = { surfaceId: 'floor', exposedPerimeterM: null, constructionResistanceM2kPerW: null, edgeThermalBridges: null, sourceReference: '' };

/** The terraced example with its floor at the survey floor's area. */
function project(): IProject {
  const value = structuredClone(terraced) as unknown as IProject;
  for (const zone of value.zones) for (const surface of zone.surfaces) if (surface.id === 'floor') surface.area = fixture.surveyFloor.areaM2;
  return value;
}

const entryOf = (draft: Loose) => (draft.groundFloors as Loose[]).find((item) => item.surfaceId === 'floor')!;

describe('survey takeover of floors to the ground', () => {
  it('writes the survey floor into a blank project entry, without the survey ΔU_for', () => {
    const pairs = { 'begane-grondvloer': 'floor' };
    const items = groundFloorItems(derived, { groundFloors: [blankEntry] }, pairs);
    expect(items.every((item) => item.status === 'new')).toBe(true);
    const next = applyGroundFloors({ groundFloors: [blankEntry] }, derived, pairs, defaultGroundSelection(items));
    expect(entryOf(next)).toEqual(fixture.projectEntry);
    expect((entryOf(next).heatedBasement as Loose).forfaitDeltaUWPerM2k).toBeUndefined();
  });

  it('creates the entry when the project floor has none yet', () => {
    const pairs = { 'begane-grondvloer': 'floor' };
    const next = applyGroundFloors({}, derived, pairs, defaultGroundSelection(groundFloorItems(derived, {}, pairs)));
    expect(entryOf(next)).toEqual(fixture.projectEntry);
  });

  it('never replaces a project value unasked', () => {
    const current = structuredClone(terraced.ntaCalculation) as unknown as Loose;
    const pairs = { 'begane-grondvloer': 'floor' };
    const items = groundFloorItems(derived, current, pairs);
    const byField = Object.fromEntries(items.map((item) => [item.field, item]));
    expect(byField.exposedPerimeterM).toMatchObject({ status: 'conflict', from: 10, to: 38 });
    expect(byField.constructionResistanceM2kPerW.status).toBe('conflict');
    expect(byField.heatedBasement.status).toBe('new');
    expect(byField.edgeThermalBridges).toBeUndefined(); // the same forfait on both sides

    const chosen = defaultGroundSelection(items);
    expect([...chosen]).toEqual([byField.heatedBasement.key]);
    const next = applyGroundFloors(current, derived, pairs, chosen);
    expect(entryOf(next)).toMatchObject({ exposedPerimeterM: 10, constructionResistanceM2kPerW: 3.87, heatedBasement: fixture.projectEntry.heatedBasement });
    expect(entryOf(next).sourceReference).toBe(`synthetic: Rc 3,7 + Rsi 0,17; ${fixture.projectEntry.sourceReference}`);

    // Taken over by choice, the conflict is replaced.
    const all = new Set([...chosen, byField.exposedPerimeterM.key]);
    expect(entryOf(applyGroundFloors(current, derived, pairs, all)).exposedPerimeterM).toBe(38);
  });

  it('offers to remove what the survey has not, but only by choice', () => {
    const current = { groundFloors: [{ ...fixture.projectEntry, below: { kind: 'crawlspace', depthClass: 'other', wallResistanceM2kPerW: 0, wallUValueWPerM2k: 0 } }] };
    const items = groundFloorItems(derived, current, { 'begane-grondvloer': 'floor' });
    expect(items).toEqual([expect.objectContaining({ field: 'below', status: 'conflict', to: undefined })]);
    expect(defaultGroundSelection(items).size).toBe(0);
    expect(entryOf(applyGroundFloors(current, derived, { 'begane-grondvloer': 'floor' }, new Set([items[0].key])))).not.toHaveProperty('below');
  });

  it('pairs by id, by the only floor, or by area', () => {
    const floors = surveyGroundFloors(derived);
    expect(floors).toEqual([expect.objectContaining({ id: 'begane-grondvloer', areaM2: 85 })]);
    const surfaces = projectGroundSurfaces(project() as never);
    expect(surfaces).toEqual([{ id: 'floor', name: expect.any(String), areaM2: 85 }]);
    expect(proposeGroundPairs(floors, surfaces)).toEqual({ 'begane-grondvloer': 'floor' });
    const two = [...surfaces, { id: 'f2', name: 'Aanbouw', areaM2: 12 }];
    expect(proposeGroundPairs(floors, two)).toEqual({ 'begane-grondvloer': 'floor' });
    expect(proposeGroundPairs(floors, [{ id: 'f2', name: 'Aanbouw', areaM2: 12 }, { id: 'f3', name: 'Garage', areaM2: 20 }]))
      .toEqual({ 'begane-grondvloer': null });
    expect(proposeGroundPairs([{ ...floors[0], id: 'f3' }], two.concat({ id: 'f3', name: 'x', areaM2: 1 }))).toEqual({ f3: 'f3' });
  });
});

function Seed({ value }: { value: IProject }) {
  const { dispatch } = useEnergy();
  useEffect(() => { dispatch({ type: 'SET_PROJECT', payload: structuredClone(value) }); }, [dispatch, value]);
  return null;
}

function DraftProbe() {
  const shared = useNtaDraft();
  return <pre data-testid="draft">{JSON.stringify((shared?.draft ?? shared?.base ?? null) as Loose | null)}</pre>;
}

const assessment = {
  status: 'calculated_unverified', scope: 'residential', source: 'ISSO 82.1', appliedDefaults: [], warnings: [], issues: [],
  derivedInput: derived, performance: null, referenceVerified: false,
} as unknown as OpnameAssessment;

const draftFloor = () => entryOf(JSON.parse(screen.getByTestId('draft').textContent ?? '{}') as Loose);

describe('survey takeover dialog for floors to the ground', () => {
  it('lists the floor values, keeps a conflict unless ticked, and writes the heated basement', async () => {
    const seeded = project();
    renderWithProviders(<>
      <Seed value={seeded} />
      <SurveyTakeoverAction result={assessment} />
      <DraftProbe />
    </>);
    await waitFor(() => expect(draftFloor().exposedPerimeterM).toBe(10));
    fireEvent.click(screen.getByRole('button', { name: /projectmodel|project model/i }));
    const dialog = await screen.findByRole('dialog');
    const ground = within(dialog).getByRole('region', { name: /grond|ground/i });
    expect((within(ground).getByRole('combobox') as HTMLSelectElement).value).toBe('floor');
    const perimeter = within(ground).getByRole('checkbox', { name: /exposedPerimeterM/ }) as HTMLInputElement;
    const basement = within(ground).getByRole('checkbox', { name: /heatedBasement/ }) as HTMLInputElement;
    expect(perimeter.checked).toBe(false);
    expect(basement.checked).toBe(true);
    expect(ground.textContent).toMatch(/andere waarde|different value/);

    fireEvent.click(within(dialog).getByRole('button', { name: /in concept|into draft/i }));
    await waitFor(() => expect(draftFloor().heatedBasement).toEqual(fixture.projectEntry.heatedBasement));
    expect(draftFloor().exposedPerimeterM).toBe(10);
    expect(String(draftFloor().sourceReference)).toContain('basisopname, vloer begane-grondvloer');

    // A second takeover, now with the perimeter ticked.
    fireEvent.click(screen.getByRole('button', { name: /projectmodel|project model/i }));
    const again = within(await screen.findByRole('dialog')).getByRole('region', { name: /grond|ground/i });
    fireEvent.click(within(again).getByRole('checkbox', { name: /exposedPerimeterM/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /in concept|into draft/i }));
    await waitFor(() => expect(draftFloor().exposedPerimeterM).toBe(38));
  });

  it('takes no floor over when the adviser unpairs it', async () => {
    renderWithProviders(<>
      <Seed value={project()} />
      <SurveyTakeoverAction result={assessment} />
      <DraftProbe />
    </>);
    await waitFor(() => expect(draftFloor().exposedPerimeterM).toBe(10));
    fireEvent.click(screen.getByRole('button', { name: /projectmodel|project model/i }));
    const dialog = await screen.findByRole('dialog');
    const ground = within(dialog).getByRole('region', { name: /grond|ground/i });
    fireEvent.change(within(ground).getByRole('combobox'), { target: { value: '' } });
    expect(within(ground).queryAllByRole('checkbox')).toHaveLength(0);
    // Nothing else differs in this survey, so there is nothing to take over.
    expect((within(dialog).getByRole('button', { name: /in concept|into draft/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(draftFloor()).not.toHaveProperty('heatedBasement');
  });
});
