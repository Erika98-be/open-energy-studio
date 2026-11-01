import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateMonthlyDemandWithRust,
  diagnoseBacsDraftWithRust,
  diagnoseDeclaredDhwWithRust,
  diagnoseDeclaredHeatingTableWithRust,
  diagnoseEpusDraftWithRust,
  diagnoseFinalEnergyDraftWithRust,
  type BacsDraftInput,
  type DeclaredHeatingTableInput,
  type EpusDraftInput,
  type FinalEnergyDraftInput,
  type MonthlyDemandInput,
} from '../core/nta/KernelClient';
import type { INtaHeatPumpInput } from '../core/energy/types';

afterEach(() => vi.unstubAllGlobals());

describe('energy input and demand HTTP assessment boundary', () => {
  const routes = [
    ['declared heating', () => diagnoseDeclaredHeatingTableWithRust({} as DeclaredHeatingTableInput)],
    ['declared hot water', () => diagnoseDeclaredDhwWithRust({} as INtaHeatPumpInput)],
    ['final energy', () => diagnoseFinalEnergyDraftWithRust({} as FinalEnergyDraftInput)],
    ['EPus', () => diagnoseEpusDraftWithRust({} as EpusDraftInput)],
    ['monthly demand', () => calculateMonthlyDemandWithRust({} as MonthlyDemandInput)],
    ['BACS', () => diagnoseBacsDraftWithRust({} as BacsDraftInput)],
  ] as const;

  for (const [name, diagnose] of routes) {
    it(`${name} returns a 422 input audit and rejects an HTTP 500`, async () => {
      const invalid = { status: 'invalid', issues: [{ code: 'input_invalid', path: 'input' }] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => invalid }));
      expect(await diagnose()).toBe(invalid);

      const parseServerError = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: parseServerError }));
      await expect(diagnose()).rejects.toThrow('HTTP 500');
      expect(parseServerError).not.toHaveBeenCalled();
    });
  }

  it('keeps incomplete BACS, EPus and final-energy assessments as HTTP 200 results', async () => {
    const incomplete = { status: 'incomplete', issues: [{ code: 'inventory_incomplete', path: 'input' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => incomplete }));
    expect(await diagnoseBacsDraftWithRust({} as BacsDraftInput)).toBe(incomplete);
    expect(await diagnoseEpusDraftWithRust({} as EpusDraftInput)).toBe(incomplete);
    expect(await diagnoseFinalEnergyDraftWithRust({} as FinalEnergyDraftInput)).toBe(incomplete);
  });
});
