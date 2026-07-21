import { describe, expect, it } from 'vitest';
import { resolveOnlyLabel, shouldRunMaterialTokenGuard } from './verifyEntry.mjs';

describe('verifyEntry', () => {
  it('resolves both supported --only forms', () => {
    expect(resolveOnlyLabel(['--only', 'unit-tests'])).toBe('unit-tests');
    expect(resolveOnlyLabel(['--only=visual'])).toBe('visual');
    expect(resolveOnlyLabel([])).toBeNull();
  });

  it('runs the Material token guard for full verification and the unit-test lane', () => {
    expect(shouldRunMaterialTokenGuard([])).toBe(true);
    expect(shouldRunMaterialTokenGuard(['--verbose'])).toBe(true);
    expect(shouldRunMaterialTokenGuard(['--only', 'unit-tests'])).toBe(true);
    expect(shouldRunMaterialTokenGuard(['--only=unit-tests'])).toBe(true);
  });

  it('does not repeat the guard in unrelated focused lanes', () => {
    expect(shouldRunMaterialTokenGuard(['--only', 'format'])).toBe(false);
    expect(shouldRunMaterialTokenGuard(['--only=visual'])).toBe(false);
    expect(shouldRunMaterialTokenGuard(['--only', 'mutation'])).toBe(false);
  });
});
