import { describe, expect, it } from 'vitest';
import strykerConfig from '../stryker.config.mjs';
import { MUTATION_TARGETS } from '../scripts/lib/mutationTargets.ts';

describe('stryker.config.mjs', () => {
  it('derives its complete mutate list only from the mutation target registry', () => {
    expect(strykerConfig.mutate).toEqual(MUTATION_TARGETS.map((target) => target.source));
  });

  it('loads the TypeScript registry natively, with no duplicated JavaScript copy', () => {
    expect(strykerConfig.mutate).toEqual([
      'src/shared/lib/changeObject/deepPatchJsonObject.ts',
      'src/shared/lib/changeObject/deepPutJsonObject.ts',
      'src/shared/lib/migrations/defineMigrations.ts',
      'src/shared/lib/migrations/defineVersion.ts',
    ]);
  });
});
