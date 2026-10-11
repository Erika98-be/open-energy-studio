import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

// A release from a fresh checkout ran the gate without ../dist, and Tauri's
// generate_context! refused to compile. The gate builds the frontend first.
describe('scripts/verify-nta.sh', () => {
  const gate = readFileSync(join(__dirname, '../../scripts/verify-nta.sh'), 'utf8');

  it('builds the frontend before the Tauri steps', () => {
    const build = gate.indexOf('npm run build');
    expect(build).toBeGreaterThan(-1);
    expect(build).toBeLessThan(gate.indexOf('step "Tauri check"'));
    expect(build).toBeLessThan(gate.indexOf('step "Tauri command tests"'));
  });

  it('runs the app against the real kernel through kernel_once, after the UI tests', () => {
    const e2e = gate.indexOf('step "app against the real kernel (kernel_once)"');
    expect(e2e).toBeGreaterThan(gate.indexOf('step "UI tests"'));
    expect(gate).toContain('--example kernel_once');
    expect(gate).toContain('OES_KERNEL_ONCE=');
    expect(gate).toContain('src/__tests__/real-kernel-e2e.test.tsx');
  });
});
