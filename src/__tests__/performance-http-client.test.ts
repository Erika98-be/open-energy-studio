import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateBuildingPerformanceWithRust,
  calculateProjectPerformanceWithRust,
  diagnoseIndicatorsDraftWithRust,
  type BuildingPerformanceInput,
  type IndicatorsDraftInput,
} from '../core/nta/KernelClient';
import type { IProject } from '../core/energy/types';

afterEach(() => vi.unstubAllGlobals());

describe('BENG and performance HTTP assessment boundary', () => {
  const routes = [
    ['draft indicators', () => diagnoseIndicatorsDraftWithRust({} as IndicatorsDraftInput)],
    ['building performance', () => calculateBuildingPerformanceWithRust({} as BuildingPerformanceInput)],
    ['project performance', () => calculateProjectPerformanceWithRust({} as IProject)],
  ] as const;

  for (const [name, calculate] of routes) {
    it(`${name} returns a 422 invalid audit but throws on HTTP 500`, async () => {
      const invalid = { status: 'invalid', issues: [{ code: 'input_invalid', path: 'input' }] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => invalid }));
      expect(await calculate()).toBe(invalid);

      const parseServerError = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: parseServerError }));
      await expect(calculate()).rejects.toThrow('HTTP 500');
      expect(parseServerError).not.toHaveBeenCalled();

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false, status: 422, json: async () => ({ status: 'calculated_unverified' }),
      }));
      await expect(calculate()).rejects.toThrow('HTTP 422');
    });
  }

  it('returns an incomplete project as a 422 assessment with its gap paths', async () => {
    const incomplete = { status: 'incomplete', gaps: [{ code: 'nta_value_missing', path: 'ntaCalculation.generator' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => incomplete }));
    expect(await calculateProjectPerformanceWithRust({} as IProject)).toBe(incomplete);
  });
});
