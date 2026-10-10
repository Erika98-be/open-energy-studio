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
});
