import { useState } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../context/EnergyContext';
import { read, write, type Draft, type Path } from '../components/NtaPerformancePanel/NtaFormFields';
import { NTA_SECTIONS } from '../components/NtaPerformancePanel/NtaSections';
import { renderWithProviders, userEvent } from './test-utils';

const StorageSection = NTA_SECTIONS.find((section) => section.id === 'storage')!.Component;

function Harness() {
  const [draft, update] = useState<Draft>({
    batteryStoragePresent: true,
    storage: {
      buildingBoundElectricalKwh: 3,
      buildingBoundThermalKwh: 2,
      sourceReference: 'installation record',
    },
  });
  const change = (path: Path, value: unknown) => update((current) => write(current, path, value));
  return <>
    <StorageSection draft={draft} change={change} update={update} project={createDefaultProject()} />
    <output data-testid="draft">{JSON.stringify(draft)}</output>
  </>;
}

describe('NTA building-bound storage form', () => {
  it('clears hidden storage evidence when the storage checkbox is switched off', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    const storage = screen.getByLabelText('Electrical or thermal storage present');
    expect(screen.getByLabelText('Building-bound electrical storage, kWh')).toBeInTheDocument();
    await user.click(storage);
    const draft = JSON.parse(screen.getByTestId('draft').textContent ?? '{}');
    expect(read(draft, ['batteryStoragePresent'])).toBe(false);
    expect(read(draft, ['storage'])).toBeNull();
    expect(screen.queryByLabelText('Building-bound electrical storage, kWh')).toBeNull();
  });
});
