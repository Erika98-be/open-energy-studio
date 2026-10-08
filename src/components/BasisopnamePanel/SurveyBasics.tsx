import {
  CheckField, NumberField, read, SelectField, TextField, TriStateField, type Draft, type Path,
} from '../NtaPerformancePanel/NtaFormFields';

// Survey answers that were only reachable through the JSON view: the dwelling
// or building type, the ceiling, a measured qv10, the ventilation principle
// and unit, the heating control and the hot-water taps (ISSO 82.1 / 75.1).

type Change = (path: Path, value: unknown) => void;
type T = (key: string, options?: Record<string, unknown>) => string;
interface Props { draft: Draft; change: Change; t: T }

function opts(t: T, prefix: string, keys: string[]): Array<[string, string]> {
  return keys.map((key) => [key, t(`${prefix}.${key}`)]);
}

/** ISSO 82.1 §7.1 afb. 7.1: single-family dwelling (position, roof) or apartment (floor, side). */
export function DwellingTypeFields({ draft, change, t }: Props) {
  const field = { draft, onChange: change };
  const kind = read(draft, ['dwelling', 'kind']);
  return <>
    <SelectField {...field} path={['dwelling', 'kind']} label={t('opname.dwelling.kind')}
      options={opts(t, 'opname.dwelling.kindKind', ['single_family', 'apartment'])}
      onChange={(_, value) => change(['dwelling'], value === 'apartment'
        ? { kind: 'apartment', floor: 'ground_or_intermediate', side: 'unknown' }
        : { kind: 'single_family', position: 'unknown', roofType: 'pitched' })} />
    {kind === 'single_family' && <>
      <SelectField {...field} path={['dwelling', 'position']} label={t('opname.dwelling.position')}
        options={opts(t, 'opname.dwelling.positionKind', ['terraced', 'end_or_corner', 'detached', 'unknown'])} />
      <SelectField {...field} path={['dwelling', 'roofType']} label={t('opname.dwelling.roofType')}
        options={opts(t, 'opname.dwelling.roofKind', ['pitched', 'partly_flat', 'flat'])} />
    </>}
    {kind === 'apartment' && <SelectField {...field} path={['dwelling', 'side']} label={t('opname.dwelling.side')}
      options={opts(t, 'opname.dwelling.sideKind', ['middle', 'end_or_corner', 'unknown'])} />}
  </>;
}

/** ISSO 75.1 §7.1: single-layer building (position, roof), whole multi-layer building or part of one. */
export function BuildingTypeFields({ draft, change, t }: Props) {
  const field = { draft, onChange: change };
  const kind = read(draft, ['buildingType', 'kind']);
  return <>
    <SelectField {...field} path={['buildingType', 'kind']} label={t('opname.buildingType.kind')}
      options={opts(t, 'opname.buildingType.kindKind', ['single_layer', 'multi_layer_whole', 'multi_layer_part'])}
      onChange={(_, value) => change(['buildingType'], value === 'single_layer'
        ? { kind: 'single_layer', position: 'detached', roof: 'pitched' }
        : value === 'multi_layer_part' ? { kind: 'multi_layer_part', level: 'intermediate', position: 'middle' }
          : { kind: 'multi_layer_whole' })} />
    {kind === 'single_layer' && <>
      <SelectField {...field} path={['buildingType', 'position']} label={t('opname.dwelling.position')}
        options={opts(t, 'opname.dwelling.positionKind', ['detached', 'end_or_corner', 'terraced'])} />
      <SelectField {...field} path={['buildingType', 'roof']} label={t('opname.dwelling.roofType')}
        options={opts(t, 'opname.dwelling.roofKind', ['pitched', 'partly_flat', 'flat'])} />
    </>}
    {kind === 'multi_layer_part' && <>
      <SelectField {...field} path={['buildingType', 'level']} label={t('opname.buildingType.level')}
        options={opts(t, 'opname.buildingType.levelKind', ['bottom', 'intermediate', 'top'])} />
      <SelectField {...field} path={['buildingType', 'position']} label={t('opname.dwelling.position')}
        options={opts(t, 'opname.buildingType.partPositionKind', ['end_or_corner', 'middle', 'whole_storey'])} />
    </>}
  </>;
}

/** Table 7.4/7.5: lighter ceiling, and (utility only) a closed or suspended ceiling; a measured qv10 (NEN 2686). */
export function ConstructionExtrasFields({ draft, change, t, utility }: Props & { utility: boolean }) {
  const field = { draft, onChange: change };
  const measured = read(draft, ['measuredInfiltration']);
  return <>
    <SelectField {...field} path={['construction', 'floor']} label={t('opname.construction.floor')}
      options={opts(t, 'opname.construction.massKind', ['light', 'heavy', 'very_heavy'])} />
    <SelectField {...field} path={['construction', 'wall']} label={t('opname.construction.wall')}
      options={opts(t, 'opname.construction.massKind', ['light', 'heavy', 'very_heavy'])} />
    <CheckField {...field} path={['construction', 'lighterCeiling']} label={t('opname.construction.lighterCeiling')} />
    {utility && <CheckField {...field} path={['construction', 'closedOrSuspendedCeiling']}
      label={t('opname.construction.closedCeiling')} />}
    <label className="nta-form-check">
      <input type="checkbox" checked={measured != null} onChange={(event) => change(['measuredInfiltration'],
        event.target.checked ? { qv10Dm3PerSM2: null, sourceReference: '' } : null)} />
      {t('opname.measuredInfiltration')}
    </label>
    {measured != null && <>
      <NumberField {...field} path={['measuredInfiltration', 'qv10Dm3PerSM2']} label={t('opname.measuredInfiltration.qv10')}
        unit="dm³/(s·m²)" />
      <TextField {...field} path={['measuredInfiltration', 'sourceReference']} label={t('opname.sourceReference')} />
    </>}
  </>;
}

/** ISSO 82.1/75.1 chapter 11: the ventilation principle and the unit the survey found. */
export function VentilationBasicsFields({ draft, change, t }: Props) {
  const field = { draft, onChange: change };
  const yesNo = { yes: t('opname.yes'), no: t('opname.no') };
  const principle = read(draft, ['ventilation', 'principle']);
  return <>
    <SelectField {...field} path={['ventilation', 'principle']} label={t('opname.ventilation.principle')}
      options={opts(t, 'opname.ventilation.principleKind', ['natural', 'mechanical_supply', 'mechanical_extract', 'balanced'])} />
    {(principle === 'natural' || principle === 'mechanical_extract') && <>
      <TriStateField {...field} {...yesNo} path={['ventilation', 'selfRegulatingVents']} label={t('opname.ventilation.selfRegulating')} />
      <SelectField {...field} path={['ventilation', 'pressureClass']} label={t('opname.ventilation.pressureClass')}
        options={opts(t, 'opname.ventilation.pressureClassKind', ['at_most1_pa', 'from1_to5_pa', 'from5_to10_pa'])} />
    </>}
    <NumberField {...field} path={['ventilation', 'installationYear']} label={t('opname.ventilation.installationYear')} optional step="1" />
    {principle !== 'natural' && <>
      <NumberField {...field} path={['ventilation', 'unitManufactureYear']} label={t('opname.ventilation.unitYear')} optional step="1" />
      <SelectField {...field} path={['ventilation', 'motor']} label={t('opname.ventilation.motor')}
        options={opts(t, 'opname.ventilation.motorKind', ['ac', 'dc', 'unknown'])} />
    </>}
    <TextField {...field} path={['ventilation', 'declaredVariant']} label={t('opname.ventilation.declaredVariant')} />
  </>;
}

/** ISSO 82.1/75.1 §9: room control and the pipes in unheated spaces (afb. 9.1). */
export function HeatingControlFields({ draft, change, t }: Props) {
  const field = { draft, onChange: change };
  const pipes = read(draft, ['heating', 'unheatedPipes', 'kind']);
  return <>
    <SelectField {...field} path={['heating', 'control']} label={t('opname.heating.control')}
      options={opts(t, 'opname.heating.controlKind', ['room_thermostat', 'central_with_radiator_valves', 'individual_room_control', 'unknown'])} />
    <label>{t('opname.heating.unheatedPipes')}
      <select value={typeof pipes === 'string' ? pipes : ''} onChange={(event) => change(['heating', 'unheatedPipes'],
        event.target.value === '' ? null : event.target.value === 'absent' ? { kind: 'absent' } : { kind: 'present', lengthM: null })}>
        <option value="">{t('opname.heating.unheatedPipes.default')}</option>
        <option value="absent">{t('opname.heating.unheatedPipes.absent')}</option>
        <option value="present">{t('opname.heating.unheatedPipes.present')}</option>
      </select>
    </label>
    {pipes === 'present' && <NumberField {...field} path={['heating', 'unheatedPipes', 'lengthM']}
      label={t('opname.heating.unheatedPipes.length')} optional unit="m" />}
  </>;
}

/** Hot-water taps: showers, and for dwellings the connected bathrooms and kitchens (13.19a); utility draw-off length. */
export function HotWaterTapsFields({ draft, change, t, utility }: Props & { utility: boolean }) {
  const field = { draft, onChange: change };
  return <>
    <NumberField {...field} path={['hotWater', 'showers']} label={t('opname.hotWater.showers')} optional step="1" />
    {utility
      ? <NumberField {...field} path={['hotWater', 'meanDrawOffLengthM']} label={t('opname.hotWater.meanDrawOff')} optional unit="m" />
      : <>
        <NumberField {...field} path={['hotWater', 'connectedBathrooms']} label={t('opname.hotWater.connectedBathrooms')} optional step="1" />
        <NumberField {...field} path={['hotWater', 'connectedKitchens']} label={t('opname.hotWater.connectedKitchens')} optional step="1" />
      </>}
  </>;
}
