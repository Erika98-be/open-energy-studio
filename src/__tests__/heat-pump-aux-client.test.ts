import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  diagnoseHeatingAuxDraftWithRust,
  diagnoseHeatingAuxMeasuredDraftWithRust,
  diagnoseForfaitHeatPumpMonthlyDraftWithRust,
  diagnoseGeneratorDispatchDraftWithRust,
  diagnoseBoilerForfaitDraftWithRust,
  diagnoseHybridHeatPumpMonthlyDraftWithRust,
  type HeatingAuxDraftInput,
  type HeatingAuxMeasuredDraftInput,
  type ForfaitHeatPumpMonthlyDraftInput,
  type GeneratorDispatchDraftInput,
  type BoilerForfaitDraftInput,
  type HybridHeatPumpMonthlyDraftInput,
} from '../core/nta/KernelClient';

afterEach(() => vi.unstubAllGlobals());

describe('heat pump and linked heating HTTP diagnostic boundary', () => {
  const routes = [
    ['supplied coefficients', () => diagnoseHeatingAuxDraftWithRust({} as HeatingAuxDraftInput)],
    ['measured components', () => diagnoseHeatingAuxMeasuredDraftWithRust({} as HeatingAuxMeasuredDraftInput)],
    ['monthly heat pump', () => diagnoseForfaitHeatPumpMonthlyDraftWithRust({} as ForfaitHeatPumpMonthlyDraftInput)],
    ['generator dispatch', () => diagnoseGeneratorDispatchDraftWithRust({} as GeneratorDispatchDraftInput)],
    ['boiler forfait', () => diagnoseBoilerForfaitDraftWithRust({} as BoilerForfaitDraftInput)],
    ['hybrid heat pump', () => diagnoseHybridHeatPumpMonthlyDraftWithRust({} as HybridHeatPumpMonthlyDraftInput)],
  ] as const;

  for (const [route, diagnose] of routes) {
    it(`${route} keeps a Rust 422 audit separate from transport failures`, async () => {
      const invalid = { status: 'invalid', issues: [{ code: 'aux_input_invalid', path: 'coefficients.cDimensionless' }] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false, status: 422, json: async () => invalid,
      }));
      expect(await diagnose()).toBe(invalid);

      const parseServerError = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false, status: 500, json: parseServerError,
      }));
      await expect(diagnose()).rejects.toThrow('HTTP 500');
      expect(parseServerError).not.toHaveBeenCalled();

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false, status: 422, json: async () => ({ status: 'input_valid' }),
      }));
      await expect(diagnose()).rejects.toThrow('HTTP 422');
    });
  }
});
