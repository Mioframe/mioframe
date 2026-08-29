import { describe, expect, it } from 'vitest';

import { validateE2ETargetTree } from './e2eOwnerTree.ts';

describe('validateE2ETargetTree', () => {
  it('accepts every discovered path when all are structurally valid', () => {
    const result = validateE2ETargetTree({
      listFilesRecursively: () => [
        'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
        'tests/e2e/helpers.ts',
      ],
      validatePath: () => ({
        valid: true,
        parsed: { owner: { kind: 'page', name: 'HomePane' }, isProductionArtifact: false },
        ownerId: 'page/HomePane',
        errors: [],
      }),
    });

    expect(result).toEqual({
      valid: true,
      errors: [],
      targetPaths: ['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'],
    });
  });

  it('ignores non-target-suffix files entirely', () => {
    const result = validateE2ETargetTree({
      listFilesRecursively: () => ['tests/e2e/helpers.ts', 'tests/e2e/release/fixtures/foo.mjs'],
      validatePath: () => {
        throw new Error('should not be called for non .e2e.spec.ts files');
      },
    });

    expect(result).toEqual({ valid: true, errors: [], targetPaths: [] });
  });

  it('fails closed on a target-shaped file outside pages/widgets', () => {
    const result = validateE2ETargetTree({
      listFilesRecursively: () => ['tests/e2e/rogue.e2e.spec.ts'],
      validatePath: () => ({
        valid: false,
        parsed: null,
        ownerId: null,
        errors: [
          'target E2E spec tests/e2e/rogue.e2e.spec.ts is outside the valid owner structure',
        ],
      }),
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'target E2E spec tests/e2e/rogue.e2e.spec.ts is outside the valid owner structure',
    ]);
  });
});
