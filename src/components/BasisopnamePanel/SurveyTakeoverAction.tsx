import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/i18n';
import { useEnergy } from '../../context/EnergyContext';
import { changedPaths, useNtaDraft } from '../../context/NtaDraftProvider';
import type { OpnameAssessment } from '../../core/nta/KernelClient';
import { parseKernelPath } from '../../core/nta/pathUtil';
import {
  applyGroundFloors, canTakeOver, defaultGroundSelection, groundFloorItems, previewValue, projectGroundSurfaces,
  proposeGroundPairs, surveyGroundFloors, surveyTakeover,
} from '../../core/nta/SurveyTakeover';
import { read, type Draft } from '../NtaPerformancePanel/NtaFormFields';
import { Button, Dialog } from '../ui';

/** Rows shown in the preview; the rest is counted. */
const MAX_ROWS = 60;

/**
 * "Overnemen in projectmodel": writes the NTA input derived from the survey
 * into the shared NTA draft after a preview of every changed value. Nothing
 * is applied here; the apply bar ("Toepassen") does that, and undo works.
 * The survey's floors to the ground go into the `groundFloors` entry of the
 * project floor the adviser pairs them with, value by value.
 */
export function SurveyTakeoverAction({ result }: { result: OpnameAssessment }) {
  const { t } = useI18n();
  const shared = useNtaDraft();
  const { state } = useEnergy();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pairs, setPairs] = useState<Record<string, string | null>>({});
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const available = shared != null && canTakeOver(result);
  const current = (shared?.draft ?? shared?.base ?? null) as Draft | null;
  const surfaces = useMemo(() => projectGroundSurfaces(state.project as never), [state.project]);
  const floors = useMemo(() => canTakeOver(result) ? surveyGroundFloors(result.derivedInput) : [], [result]);
  const preview = useMemo(() => {
    if (!open || !canTakeOver(result)) return null;
    const takeover = surveyTakeover(result.derivedInput, current);
    const changes = changedPaths(current ?? {}, takeover.next).map((path) => {
      const segments = parseKernelPath(path);
      return { path, from: read(current ?? {}, segments), to: read(takeover.next, segments) };
    });
    return { ...takeover, changes, ground: groundFloorItems(result.derivedInput, current, pairs) };
  }, [open, result, current, pairs]);

  const start = () => {
    if (!canTakeOver(result)) return;
    const proposed = proposeGroundPairs(floors, surfaces);
    setPairs(proposed);
    setAccepted(defaultGroundSelection(groundFloorItems(result.derivedInput, current, proposed)));
    setDone(false);
    setOpen(true);
  };
  const pair = (surveyId: string, surfaceId: string | null) => {
    if (!canTakeOver(result)) return;
    const next = { ...pairs, [surveyId]: surfaceId };
    setPairs(next);
    setAccepted(defaultGroundSelection(groundFloorItems(result.derivedInput, current, next)));
  };
  const toggle = (key: string) => setAccepted((selection) => {
    const next = new Set(selection);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const surfaceName = (id: string) => surfaces.find((surface) => surface.id === id)?.name ?? id;

  if (!shared) return null;
  return (
    <div className="opname-takeover">
      <Button variant="secondary" size="sm" disabled={!available} onClick={start}>
        {t('opname.takeover.button')}
      </Button>
      {!available && <small className="nta-form-note"> {t('opname.takeover.unavailable')}</small>}
      {done && <p className="nta-form-note" role="status">{t('opname.takeover.done')}</p>}
      {open && preview && <Dialog title={t('opname.takeover.title')} onClose={() => setOpen(false)} width={720}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('opname.takeover.cancel')}</Button>
          <Button variant="primary" disabled={preview.changes.length === 0 && accepted.size === 0} onClick={() => {
            if (!canTakeOver(result)) return;
            const derived = result.derivedInput;
            shared.update((draft) => applyGroundFloors(surveyTakeover(derived, draft).next, derived, pairs, accepted) as Draft);
            setOpen(false);
            setDone(true);
          }}>{t('opname.takeover.confirm')}</Button>
        </>}>
        <p>{t('opname.takeover.intro')}</p>
        <p><strong>{t('opname.takeover.count', { count: preview.changes.length })}</strong></p>
        {preview.changes.length === 0
          ? <p className="nta-form-note">{t('opname.takeover.noChanges')}</p>
          : <table className="opname-takeover__diff" aria-label={t('opname.takeover.title')}>
            <thead><tr>
              <th scope="col">{t('opname.takeover.path')}</th>
              <th scope="col">{t('opname.takeover.from')}</th>
              <th scope="col">{t('opname.takeover.to')}</th>
            </tr></thead>
            <tbody>
              {preview.changes.slice(0, MAX_ROWS).map((row) => <tr key={row.path}>
                <td><code>{row.path}</code></td>
                <td>{previewValue(row.from)}</td>
                <td>{previewValue(row.to)}</td>
              </tr>)}
            </tbody>
          </table>}
        {preview.changes.length > MAX_ROWS &&
          <p className="nta-form-note">{t('opname.takeover.more', { count: preview.changes.length - MAX_ROWS })}</p>}
        {floors.length > 0 && <section className="opname-takeover__ground" aria-label={t('opname.takeover.ground.title')}>
          <h4>{t('opname.takeover.ground.title')}</h4>
          <p className="nta-form-note">{t('opname.takeover.ground.intro')}</p>
          {floors.map((floor) => <div key={floor.id} className="nta-form-row">
            <label>{t('opname.takeover.ground.pair', { floor: floor.id, area: floor.areaM2 ?? '—' })}
              <select value={pairs[floor.id] ?? ''} onChange={(event) => pair(floor.id, event.target.value || null)}>
                <option value="">{t('opname.takeover.ground.none')}</option>
                {surfaces.map((surface) => {
                  // One project floor takes one survey floor.
                  const other = floors.find((item) => item.id !== floor.id && pairs[item.id] === surface.id);
                  return <option key={surface.id} value={surface.id} disabled={other != null}>
                    {`${surface.name} (${surface.areaM2} m²)`}
                    {other ? ` ${t('opname.takeover.ground.pairedElsewhere', { floor: other.id })}` : ''}
                  </option>;
                })}
              </select>
            </label>
          </div>)}
          {surfaces.length === 0 && <p className="nta-form-note">{t('opname.takeover.ground.noSurfaces')}</p>}
          {preview.ground.length > 0 &&
            <table className="opname-takeover__diff" aria-label={t('opname.takeover.ground.title')}>
              <thead><tr>
                <th scope="col">{t('opname.takeover.ground.accept')}</th>
                <th scope="col">{t('opname.takeover.path')}</th>
                <th scope="col">{t('opname.takeover.from')}</th>
                <th scope="col">{t('opname.takeover.to')}</th>
              </tr></thead>
              <tbody>
                {preview.ground.map((item) => {
                  const label = `${surfaceName(item.surfaceId)} — ${t(`opname.takeover.ground.field.${item.field}`)}`;
                  return <tr key={item.key} className={item.status === 'conflict' ? 'opname-takeover__conflict' : undefined}>
                    <td><input type="checkbox" checked={accepted.has(item.key)} onChange={() => toggle(item.key)}
                      aria-label={t('opname.takeover.ground.acceptItem', { item: label })} /></td>
                    <td><code>{label}</code>{item.status === 'conflict' && <> <small>{t('opname.takeover.ground.conflict')}</small></>}</td>
                    <td>{previewValue(item.from)}</td>
                    <td>{item.to === undefined ? t('opname.takeover.ground.remove') : previewValue(item.to)}</td>
                  </tr>;
                })}
              </tbody>
            </table>}
        </section>}
        <h4>{t('opname.takeover.skipped')}</h4>
        <ul className="opname-takeover__skipped">
          {[...new Set(preview.skipped.map((part) => part.reason))].map((reason) =>
            <li key={reason}>{t(`opname.takeover.skipped.${reason}`)}</li>)}
        </ul>
      </Dialog>}
    </div>
  );
}
