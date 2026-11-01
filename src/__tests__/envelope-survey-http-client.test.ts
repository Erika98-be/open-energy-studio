import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assessResidentialSurveyWithRust,
  assessUtilitySurveyWithRust,
  calculateConstructionsWithRust,
  calculateSpaceHeatingChainWithRust,
  calculateVentilationWithRust,
  type EnvelopeInput,
  type ResidentialSurvey,
  type SpaceHeatingChainInput,
  type UtilitySurvey,
  type VentilationInput,
} from '../core/nta/KernelClient';

afterEach(() => vi.unstubAllGlobals());

describe('envelope, survey and heating-chain HTTP assessment boundary', () => {
  const routes = [
    ['envelope', () => calculateConstructionsWithRust({} as EnvelopeInput)],
    ['ventilation', () => calculateVentilationWithRust({} as VentilationInput)],
    ['residential survey', () => assessResidentialSurveyWithRust({} as ResidentialSurvey)],
    ['utility survey', () => assessUtilitySurveyWithRust({} as UtilitySurvey)],
    ['space heating chain', () => calculateSpaceHeatingChainWithRust({} as SpaceHeatingChainInput)],
  ] as const;

  for (const [name, calculate] of routes) {
    it(`${name} returns a 422 invalid audit but rejects an HTTP 500`, async () => {
      const invalid = { status: 'invalid', issues: [{ code: 'input_invalid', path: 'input' }] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => invalid }));
      expect(await calculate()).toBe(invalid);

      const parseServerError = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: parseServerError }));
      await expect(calculate()).rejects.toThrow('HTTP 500');
      expect(parseServerError).not.toHaveBeenCalled();
    });
  }

  it('preserves a rejected derived survey as a 422 audit', async () => {
    const rejected = { status: 'derived_input_rejected', issues: [{ code: 'derived_input_invalid', path: 'survey' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => rejected }));
    expect(await assessResidentialSurveyWithRust({} as ResidentialSurvey)).toBe(rejected);
    expect(await assessUtilitySurveyWithRust({} as UtilitySurvey)).toBe(rejected);
  });
});
