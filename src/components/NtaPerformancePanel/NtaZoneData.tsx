import { useI18n } from '../../i18n/i18n';
import type { IProject } from '../../core/energy/types';
import { CheckField, NumberField, read, SelectField, TextField, type Draft, type Path } from './NtaFormFields';
import { SunroomsFields } from './NtaProjectExtras';

// Kernel input that only the JSON view reached before (form coverage,
// docs/ui-redesign/formulierdekking.md): per calculation zone its own use
// function, dwelling type, function areas, thermal mass and sunrooms
// (`zoneData`), a swimming pool in a sport ventilation function
// (§11.2.2.5.1) and the zone of the lighting. The collective shares are in
// NtaCollectiveShare.

type Change = (path: Path, value: unknown) => void;
interface SectionProps { draft: Draft; change: Change }

function list(draft: Draft, path: Path): Draft[] {
  const value = read(draft, path);
  return Array.isArray(value) ? value as Draft[] : [];
}

const USAGE_FUNCTIONS = ['residential', 'office', 'education', 'retail', 'other_assembly', 'assembly_child_care',
  'other_healthcare', 'healthcare_with_beds', 'lodging', 'cell', 'sport'];

/** The ventilation functions of a block (`base`: `['ventilation']` or a zone's): a swimming pool in a sport function doubles q_usi;spec. */
export function SwimmingPoolFields({ draft, change, base }: SectionProps & { base: Path }) {
  const { t } = useI18n();
  const functions = list(draft, [...base, 'functions']);
  return <>{functions.map((item, index) => item.function === 'sport'
    ? <CheckField key={index} draft={draft} onChange={change} path={[...base, 'functions', index, 'swimmingPool']}
      label={t('nta.vent.swimmingPool')} />
    : null)}</>;
}

/** The calculation zone a lighting block belongs to (`lighting[i].zoneId`); only asked with several zones. */
export function LightingZoneField({ draft, change, project, index }: SectionProps & { project: IProject; index: number }) {
  const { t } = useI18n();
  if (project.zones.length < 2) return null;
  return <SelectField draft={draft} onChange={change} path={['lighting', index, 'zoneId']} label={t('nta.light.zone')}
    options={project.zones.map((zone) => [zone.id, zone.name ? `${zone.name} (${zone.id})` : zone.id])} />;
}

const copy = (value: unknown) => JSON.parse(JSON.stringify(value)) as unknown;

/**
 * A zone's own data starts as a copy of the block's internal gains, ventilation flows and chapter 11
 * ventilation: with a `zoneData` entry the kernel takes these from the zone only (no fallback to the
 * block), and every entry needs internal gains.
 */
export function zoneDataTemplate(draft: Draft, zoneId: string): Draft {
  const gains = read(draft, ['internalGains']);
  const flows = read(draft, ['ventilationFlows']);
  const ventilation = read(draft, ['ventilation']);
  return {
    zoneId,
    internalGains: gains == null ? {} : copy(gains),
    ...(Array.isArray(flows) ? { ventilationFlows: copy(flows) } : {}),
    ...(ventilation != null ? { ventilation: copy(ventilation) } : {}),
  };
}

/**
 * Per calculation zone (§6.3): its own use function, dwelling type, function areas (§6.5.3),
 * thermal mass (table 7.10) and sunrooms (7.30b), instead of the block's. A zone without its
 * own data uses the block.
 */
export function ZoneDataFields({ draft, change, project }: SectionProps & { project: IProject }) {
  const { t } = useI18n();
  const field = { draft, onChange: change };
  const zoneData = list(draft, ['zoneData']);
  if (project.zones.length < 2 && zoneData.length === 0) return <p className="nta-form-note">{t('nta.zoneData.singleZone')}</p>;
  return <div className="nta-form-subsection">
    <p className="nta-form-note">{t('nta.zoneData.note')}</p>
    {project.zones.map((zone) => {
      const index = zoneData.findIndex((item) => String(item.zoneId) === zone.id);
      const title = zone.name ? `${zone.name} (${zone.id})` : zone.id;
      if (index < 0) {
        return <fieldset key={zone.id} className="nta-form-row"><legend>{title}</legend>
          <button type="button" onClick={() => change(['zoneData'], [...zoneData, zoneDataTemplate(draft, zone.id)])}>
            {t('nta.zoneData.add')}</button>
        </fieldset>;
      }
      const base: Path = ['zoneData', index];
      const usage = read(draft, [...base, 'usageFunction']) ?? read(draft, ['usageFunction']);
      const areas = list(draft, [...base, 'functionAreas']);
      const mass = read(draft, [...base, 'thermalMass']);
      return <fieldset key={zone.id} className="nta-form-row"><legend>{title}</legend>
        <SelectField {...field} path={[...base, 'usageFunction']} label={t('nta.zoneData.usageFunction')}
          options={USAGE_FUNCTIONS.map((key) => [key, t(`nta.form.usage.${key}`)])}
          onChange={(path, value) => change(path, value ?? undefined)} />
        {usage === 'residential' && <SelectField {...field} path={[...base, 'dwellingType']} label={t('nta.zoneData.dwellingType')}
          options={[['apartment_building', t('nta.form.dwellingType.apartment')], ['other', t('nta.form.dwellingType.other')]]}
          onChange={(path, value) => change(path, value ?? undefined)} />}
        {areas.map((_, area) => <div key={area} className="nta-form-row">
          <SelectField {...field} path={[...base, 'functionAreas', area, 'function']} label={t('nta.zoneData.functionArea.function')}
            options={USAGE_FUNCTIONS.map((key) => [key, t(`nta.form.usage.${key}`)])} />
          <NumberField {...field} path={[...base, 'functionAreas', area, 'areaM2']} label={t('nta.zoneData.functionArea.area')} unit="m²" />
          <button type="button" className="nta-form-remove"
            onClick={() => change([...base, 'functionAreas'], areas.filter((__, other) => other !== area))}>{t('nta.form.remove')}</button>
        </div>)}
        <button type="button" onClick={() => change([...base, 'functionAreas'],
          [...areas, { function: typeof usage === 'string' ? usage : 'office', areaM2: null }])}>{t('nta.zoneData.functionArea.add')}</button>
        <label className="nta-form-check">
          <input type="checkbox" checked={mass != null} onChange={(event) => change([...base, 'thermalMass'], event.target.checked
            ? { floor: 'heavy', wall: 'heavy', ceiling: 'open_or_none', sourceReference: '' } : undefined)} />
          {t('nta.zoneData.thermalMass')}
        </label>
        {mass != null && <>
          {(['floor', 'wall'] as const).map((part) => <SelectField key={part} {...field} path={[...base, 'thermalMass', part]}
            label={t(`nta.form.mass.${part}`)} options={[['light', t('nta.form.mass.light')], ['heavy', t('nta.form.mass.heavy')], ['very_heavy', t('nta.form.mass.veryHeavy')]]} />)}
          <SelectField {...field} path={[...base, 'thermalMass', 'ceiling']} label={t('nta.form.mass.ceiling')}
            options={[['open_or_none', t('nta.form.mass.open')], ['closed_or_suspended', t('nta.form.mass.closed')]]} />
          <TextField {...field} path={[...base, 'thermalMass', 'sourceReference']} label={t('nta.zoneData.thermalMass.source')} />
        </>}
        <SunroomsFields draft={draft} change={change} base={[...base, 'sunrooms']} />
        {read(draft, [...base, 'ventilation']) != null &&
          <SwimmingPoolFields draft={draft} change={change} base={[...base, 'ventilation']} />}
        <button type="button" className="nta-form-remove"
          onClick={() => change(['zoneData'], zoneData.filter((__, other) => other !== index))}>{t('nta.zoneData.remove')}</button>
      </fieldset>;
    })}
  </div>;
}
