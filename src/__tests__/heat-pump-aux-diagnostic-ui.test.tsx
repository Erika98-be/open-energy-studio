import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { HeatPumpAuxDiagnosticPanel } from '../components/HeatPumpAuxDiagnosticPanel/HeatPumpAuxDiagnosticPanel';
import { useEnergy } from '../context/EnergyContext';
import type { INtaHeatPumpInput } from '../core/energy/types';
import { renderWithProviders, userEvent } from './test-utils';

const pump: INtaHeatPumpInput = {
  id: 'hp-measured', source: 'outdoor_air', sink: 'hydronic', drive: 'electric_compression',
  reversible: false, hybrid: false, booster: false,
  performanceEvidence: { kind: 'controlled_quality_declaration', reference: 'product schedule' },
};

afterEach(() => vi.unstubAllGlobals());

describe('draft heat-pump auxiliary UI', () => {
  it('clears an unsaved draft when the project changes but the pump ID does not', async () => {
    const user = userEvent.setup();
    function ProjectSwitch() {
      const { state, dispatch } = useEnergy();
      return <>
        <HeatPumpAuxDiagnosticPanel pump={pump} />
        <button type="button" onClick={() => dispatch({
          type: 'SET_PROJECT', payload: { ...state.project, id: 'another-project' },
        })}>Switch project</button>
      </>;
    }
    renderWithProviders(<ProjectSwitch />);
    fireEvent.change(screen.getByLabelText('Electronics standby power (W)'), { target: { value: '10' } });
    expect(screen.getByLabelText('Electronics standby power (W)')).toHaveValue('10');
    await user.click(screen.getByRole('button', { name: 'Switch project' }));
    expect(screen.getByLabelText('Electronics standby power (W)')).toHaveValue('');
  });

  it('reloads measured inputs when another project has the same pump ID', () => {
    const savedInput = (standbyElectronicsW: number, decemberKwh: number) => ({
      generatorId: pump.id, generatorSourceReference: 'product schedule',
      measurements: {
        standbyElectronicsW, deliveryPumpDuringCompressorW: 200,
        deliveryPumpPrePostW: 90, pumpPreRunSeconds: 300, pumpPostRunSeconds: 300,
        averageCompressorOnSeconds: 600, meanCompressorModulation: 0.5,
        nominalElectricDriveKw: 2, measurementSourceReference: 'meter',
        timingSourceReference: 'cycle',
      },
      inputEnergySourceReference: 'monthly meter',
      months: Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        generatorInputElectricityKwh: index === 11 ? decemberKwh : 100,
      })),
    });
    const view = renderWithProviders(<HeatPumpAuxDiagnosticPanel pump={{
      ...pump, heatingAuxMeasuredDraft: savedInput(10, 100),
    }} />);
    expect(screen.getByLabelText('Electronics standby power (W)')).toHaveValue('10');
    expect(screen.getByLabelText('Month 12')).toHaveValue('100');

    view.rerender(<HeatPumpAuxDiagnosticPanel pump={{
      ...pump, heatingAuxMeasuredDraft: savedInput(20, 250),
    }} />);
    expect(screen.getByLabelText('Electronics standby power (W)')).toHaveValue('20');
    expect(screen.getByLabelText('Month 12')).toHaveValue('250');
  });

  it('requires every month, sends traceable measured input and keeps the result scoped', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'input_valid', inputFingerprint: 'sha256:measured',
        finalEditionVerified: false, referenceVerified: false, bengCalculationAvailable: false,
        primaryElectricityFactorUsed: 1.45, usefulPumpFractionUsed: 0.5,
        derivedCoefficients: { aAnnualKwh: 87.6, bKw: 0.19, cDimensionless: 0.5,
          nominalElectricDriveKw: 2, sourceReference: 'meter; cycle' },
        auxiliary: { annualAuxiliaryElectricityKwh: 315.6,
          monthlyAuxiliaryElectricityKwh: Array.from({ length: 12 }, (_, index) => ({ month: index + 1, electricityKwh: 26.3 })) },
        issues: [],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const onSave = vi.fn();
    const view = renderWithProviders(<HeatPumpAuxDiagnosticPanel pump={pump} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Calculate draft diagnostic' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Complete every field');
    expect(fetchMock).not.toHaveBeenCalled();

    const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fill('Electronics standby power (W)', '10');
    fill('Delivery pump during compressor operation (W)', '200');
    fill('Delivery pump during pre/post-run (W)', '90');
    fill('Pump pre-run time (s)', '300');
    fill('Pump post-run time (s)', '300');
    fill('Average compressor on-time per cycle (s)', '600');
    fill('Mean compressor modulation (0–1)', '0.5');
    fill('Nominal electric input power (kW)', '2');
    fill('Power measurement source', 'meter');
    fill('Cycle/modulation source', 'cycle');
    fill('Monthly generator electricity source', 'monthly meter');
    for (let month = 1; month <= 12; month += 1) fill(`Month ${month}`, '100');
    await user.click(screen.getByRole('button', { name: 'Calculate draft diagnostic' }));

    expect(await screen.findByText('315.60 kWh/year')).toBeInTheDocument();
    expect(screen.getByText(/No forfait, annual heat pump performance, BENG result or energy label/)).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/nta8800/heat-pumps/heating-aux-measured-draft/diagnose');
    const input = JSON.parse(options.body).input;
    expect(input.generatorId).toBe('hp-measured');
    expect(input.generatorSourceReference).toBe('product schedule');
    expect(input.measurements.averageCompressorOnSeconds).toBe(600);
    expect(input.months).toHaveLength(12);
    expect(input.months[11]).toEqual({ month: 12, generatorInputElectricityKwh: 100 });

    fetchMock.mockResolvedValueOnce({
      ok: false, status: 422,
      json: async () => ({
        status: 'invalid', derivedCoefficients: null, auxiliary: null,
        issues: [{ code: 'aux_arithmetic_overflow', path: 'months[11].generatorInputElectricityKwh' }],
      }),
    });
    await user.click(screen.getByRole('button', { name: 'Calculate draft diagnostic' }));
    const audit = await screen.findByRole('alert');
    expect(audit).toHaveTextContent('The Rust audit rejects this input.');
    expect(audit).not.toHaveTextContent('Complete every field');
    expect(audit).toHaveTextContent('months[11].generatorInputElectricityKwh');
    expect(audit).toHaveTextContent('The auxiliary energy calculation is out of range.');
    expect(audit).not.toHaveTextContent('aux_arithmetic_overflow');
    expect(screen.queryByText('315.60 kWh/year')).not.toBeInTheDocument();

    fetchMock.mockResolvedValueOnce({
      ok: false, status: 422,
      json: async () => ({
        status: 'invalid', derivedCoefficients: null, auxiliary: null,
        issues: [{ code: 'coefficient_arithmetic_overflow', path: 'measurements.pumpPostRunSeconds' }],
      }),
    });
    await user.click(screen.getByRole('button', { name: 'Calculate draft diagnostic' }));
    const timingAudit = await screen.findByRole('alert');
    expect(timingAudit).toHaveTextContent('measurements.pumpPostRunSeconds');
    expect(timingAudit).toHaveTextContent('The coefficient calculation is out of range.');
    expect(timingAudit).not.toHaveTextContent('coefficient_arithmetic_overflow');
    expect(screen.queryByText('315.60 kWh/year')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save measured inputs' }));
    expect(onSave).toHaveBeenCalledWith(input);
    fill('Electronics standby power (W)', '11');
    expect(screen.queryByText('315.60 kWh/year')).not.toBeInTheDocument();
    view.unmount();
    renderWithProviders(<HeatPumpAuxDiagnosticPanel pump={{ ...pump, heatingAuxMeasuredDraft: input }} />);
    expect(screen.getByLabelText('Electronics standby power (W)')).toHaveValue('10');
    expect(screen.getByLabelText('Month 12')).toHaveValue('100');
    expect(screen.getByText(/Measured inputs saved in this project/)).toBeInTheDocument();

  });
});
