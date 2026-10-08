import { useState, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { write, type Draft, type Path } from '../components/NtaPerformancePanel/NtaFormFields';
import { LightingZoneField, SwimmingPoolFields, ZoneDataFields } from '../components/NtaPerformancePanel/NtaZoneData';
import { CollectiveCoolingField, CollectivePvField } from '../components/NtaPerformancePanel/NtaCollectiveShare';
import { HotWaterCirculationFields } from '../components/NtaPerformancePanel/NtaPipeGeometry';
import { AdditionalHotWaterSystemsFields } from '../components/NtaPerformancePanel/NtaSystemSections';
import type { IProject } from '../core/energy/types';
import { renderWithProviders } from './test-utils';

// Project forms for kernel options that were JSON-only (docs/ui-redesign/formulierdekking.md).
// The kernel reads the same shapes in crates/nta8800-core/tests/project_form_shapes.rs.

function Harness({ initial, children }: {
  initial: Draft;
  children: (draft: Draft, change: (path: Path, value: unknown) => void) => ReactElement;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const change = (path: Path, value: unknown) => setDraft((current) => write(current, path, value));
  return <form aria-label="test">
    {children(draft, change)}
    <output data-testid="draft">{JSON.stringify(draft)}</output>
  </form>;
}

const draft = () => JSON.parse(screen.getByTestId('draft').textContent ?? '{}');
const select = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const setNumber = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const project = (ids: string[]) => ({ zones: ids.map((id) => ({ id, name: id === 'z1' ? 'Begane grond' : 'Verdieping' })) }) as unknown as IProject;

describe('project forms that had no form', () => {
  it('starts zone data as a copy of the block and writes the zone answers', () => {
    const block = {
      usageFunction: 'office',
      internalGains: { method: 'utility' },
      ventilationFlows: [{ id: 'f1', months: [] }],
      ventilation: { functions: [{ function: 'sport', areaM2: 100, swimmingPool: false }] },
    };
    renderWithProviders(<Harness initial={block}>
      {(d, change) => <ZoneDataFields draft={d} change={change} project={project(['z1', 'z2'])} />}</Harness>);
    fireEvent.click(screen.getAllByText('Own data for this calculation zone')[1]);
    let zone = draft().zoneData[0];
    expect(zone).toEqual({ zoneId: 'z2', internalGains: block.internalGains, ventilationFlows: block.ventilationFlows,
      ventilation: block.ventilation });
    select(/Use function of the calculation zone/, 'retail');
    fireEvent.click(screen.getByText(/Add a part with another use function/));
    setNumber(/Usable floor area of this part/, '80');
    fireEvent.click(screen.getByLabelText(/Own thermal mass for this calculation zone/));
    fireEvent.click(screen.getByText('Add sunroom'));
    fireEvent.click(screen.getByLabelText(/Room with a swimming pool/));
    zone = draft().zoneData[0];
    expect(zone.usageFunction).toBe('retail');
    expect(zone.functionAreas).toEqual([{ function: 'retail', areaM2: 80 }]);
    expect(zone.thermalMass).toEqual({ floor: 'heavy', wall: 'heavy', ceiling: 'open_or_none', sourceReference: '' });
    expect(zone.sunrooms).toHaveLength(1);
    expect(zone.ventilation.functions[0].swimmingPool).toBe(true);
    // The block stays as it was.
    expect(draft().usageFunction).toBe('office');
    expect(draft().ventilation.functions[0].swimmingPool).toBe(false);
    fireEvent.click(screen.getByText("Remove this calculation zone's own data"));
    expect(draft().zoneData).toEqual([]);
  });

  it('offers the swimming pool only for a sport function', () => {
    renderWithProviders(<Harness initial={{ ventilation: { functions: [{ function: 'office', areaM2: 10 }, { function: 'sport', areaM2: 20 }] } }}>
      {(d, change) => <SwimmingPoolFields draft={d} change={change} base={['ventilation']} />}</Harness>);
    expect(screen.getAllByLabelText(/Room with a swimming pool/)).toHaveLength(1);
    fireEvent.click(screen.getByLabelText(/Room with a swimming pool/));
    expect(draft().ventilation.functions[1].swimmingPool).toBe(true);
  });

  it('writes the circulation of a hot-water system in the kernel shape', () => {
    renderWithProviders(<Harness initial={{ hotWater: {} }}>
      {(d, change) => <HotWaterCirculationFields draft={d} change={change} base={['hotWater']} />}</Harness>);
    fireEvent.click(screen.getByLabelText('Circulation pipe present (§13.5)'));
    expect(draft().hotWater.circulation).toEqual({ insulation: 'unknown', fittingsInsulated: false, floorCount: 1,
      pump: { control: 'uncontrolled_or_unknown' }, sourceReference: '' });
    select(/Insulation of the circulation pipe/, 'mm15');
    setNumber(/Length of the circulation pipe/, '30');
    select(/Control of the circulation pump/, 'constant_pressure');
    setNumber(/Length of the circulation pipe/, '');
    const circulation = draft().hotWater.circulation;
    expect(circulation.insulation).toBe('mm15');
    expect(circulation.pump.control).toBe('constant_pressure');
    expect('lengthM' in circulation).toBe(false);
    // A declared Ψ hides the calculated one: they exclude each other (hot_water_psi_declared_and_calculated).
    setNumber(/Declared Ψ of the circulation pipe/, '0.2');
    expect(screen.queryByLabelText(/calculated/i)).toBeNull();
  });

  it('gives a further hot-water system its circulation, further generators and series', () => {
    renderWithProviders(<Harness initial={{ hotWater: { need: { method: 'residential' } }, additionalHotWaterSystems: [] }}>
      {(d, change) => <AdditionalHotWaterSystemsFields draft={d} change={change} residential />}</Harness>);
    fireEvent.click(screen.getByText(/Add hot-water system/i));
    fireEvent.click(screen.getByLabelText('Circulation pipe present (§13.5)'));
    fireEvent.click(screen.getByText('Add hot-water generator (13.8.2)'));
    select(/Series arrangement/, 'hotfill_electric_boiler');
    const system = draft().additionalHotWaterSystems[0];
    expect(system.circulation.floorCount).toBe(1);
    expect(system.additionalGenerators).toHaveLength(1);
    expect(system.series).toEqual({ kind: 'hotfill_electric_boiler' });
    // Removing the only further generator also removes the series, which needs exactly one.
    const extra = [...document.querySelectorAll('legend')].find((legend) => legend.textContent === 'Additional hot-water generator 1');
    const remove = [...(extra?.parentElement?.querySelectorAll(':scope > button') ?? [])].at(-1) as HTMLElement;
    fireEvent.click(remove);
    expect(draft().additionalHotWaterSystems[0].additionalGenerators).toEqual([]);
    expect(draft().additionalHotWaterSystems[0].series).toBeNull();
  });

  it('writes the collective share of cooling and of a PV system', () => {
    renderWithProviders(<Harness initial={{ cooling: { generators: [] }, pvSystems: [{ id: 'pv' }] }}>
      {(d, change) => <>
        <CollectiveCoolingField draft={d} change={change} />
        <CollectivePvField draft={d} change={change} base={['pvSystems', 0]} />
      </>}</Harness>);
    fireEvent.click(screen.getByLabelText(/Cooling collective for the building/));
    fireEvent.click(screen.getByLabelText(/PV system shared by the building/));
    const [coolingArea, pvArea] = screen.getAllByLabelText(/Usable floor area of the whole building/);
    fireEvent.change(coolingArea, { target: { value: '1200' } });
    fireEvent.change(pvArea, { target: { value: '900' } });
    expect(draft().cooling.collective).toEqual({ buildingUsableFloorAreaM2: 1200, sourceReference: '' });
    expect(draft().pvSystems[0].collective).toEqual({ buildingUsableFloorAreaM2: 900, sourceReference: '' });
  });

  it('asks the zone of the lighting only with several zones', () => {
    const { unmount } = renderWithProviders(<Harness initial={{ lighting: [{ zoneId: 'z1' }] }}>
      {(d, change) => <LightingZoneField draft={d} change={change} project={project(['z1'])} index={0} />}</Harness>);
    expect(screen.queryByLabelText('Calculation zone of the lighting')).toBeNull();
    unmount();
    renderWithProviders(<Harness initial={{ lighting: [{ zoneId: 'z1' }] }}>
      {(d, change) => <LightingZoneField draft={d} change={change} project={project(['z1', 'z2'])} index={0} />}</Harness>);
    select('Calculation zone of the lighting', 'z2');
    expect(draft().lighting[0].zoneId).toBe('z2');
  });
});
