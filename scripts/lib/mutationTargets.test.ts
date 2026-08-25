import { describe, expect, it } from 'vitest';
import {
  MUTATION_TARGETS,
  resolveMutationPlan,
  validateMutationTargets,
  type MutationTarget,
} from './mutationTargets.ts';

describe('MUTATION_TARGETS', () => {
  it('registers exactly the four accepted deterministic high-risk targets', () => {
    expect(MUTATION_TARGETS.map((target) => target.source)).toEqual([
      'src/shared/lib/changeObject/deepPatchJsonObject.ts',
      'src/shared/lib/changeObject/deepPutJsonObject.ts',
      'src/shared/lib/migrations/defineMigrations.ts',
      'src/shared/lib/migrations/defineVersion.ts',
    ]);
  });

  it('validates against the real repository filesystem', () => {
    expect(validateMutationTargets()).toEqual({ valid: true, errors: [] });
  });
});

describe('validateMutationTargets', () => {
  const fileExists = (filePath: string): boolean =>
    filePath === 'src/a.ts' || filePath === 'src/a.test.ts';

  it('accepts a well-formed single-target registry', () => {
    const targets: MutationTarget[] = [
      { source: 'src/a.ts', tests: ['src/a.test.ts'], reason: 'x' },
    ];

    expect(validateMutationTargets(targets, { fileExists })).toEqual({ valid: true, errors: [] });
  });

  it('rejects a registered source that does not exist', () => {
    const targets: MutationTarget[] = [
      { source: 'src/missing.ts', tests: ['src/a.test.ts'], reason: 'x' },
    ];

    expect(validateMutationTargets(targets, { fileExists }).errors).toContain(
      'mutation target source does not exist: src/missing.ts',
    );
  });

  it('rejects a registered owning test that does not exist', () => {
    const targets: MutationTarget[] = [
      { source: 'src/a.ts', tests: ['src/missing.test.ts'], reason: 'x' },
    ];

    expect(validateMutationTargets(targets, { fileExists }).errors).toContain(
      'mutation target src/a.ts owning test does not exist: src/missing.test.ts',
    );
  });

  it('rejects a duplicate source', () => {
    const targets: MutationTarget[] = [
      { source: 'src/a.ts', tests: ['src/a.test.ts'], reason: 'x' },
      { source: 'src/a.ts', tests: ['src/a.test.ts'], reason: 'y' },
    ];

    expect(validateMutationTargets(targets, { fileExists }).errors).toContain(
      'duplicate mutation target source: src/a.ts',
    );
  });

  it('rejects a target with zero owning tests', () => {
    const targets: MutationTarget[] = [{ source: 'src/a.ts', tests: [], reason: 'x' }];

    expect(validateMutationTargets(targets, { fileExists }).errors).toContain(
      'mutation target src/a.ts has zero owning tests',
    );
  });

  it('rejects an empty/whitespace reason', () => {
    const targets: MutationTarget[] = [
      { source: 'src/a.ts', tests: ['src/a.test.ts'], reason: '  ' },
    ];

    expect(validateMutationTargets(targets, { fileExists }).errors).toContain(
      'mutation target src/a.ts has an empty reason',
    );
  });

  it('rejects a malformed entry', () => {
    const targets = [{ source: 'src/a.ts' }];

    expect(validateMutationTargets(targets, { fileExists }).valid).toBe(false);
  });
});

describe('resolveMutationPlan', () => {
  it('selects exactly the registered target when its exact source changed', () => {
    const plan = resolveMutationPlan(['src/shared/lib/changeObject/deepPatchJsonObject.ts']);

    expect(plan).toEqual({
      mode: 'focused',
      sources: ['src/shared/lib/changeObject/deepPatchJsonObject.ts'],
      reasons: [
        'changed registered mutation source src/shared/lib/changeObject/deepPatchJsonObject.ts',
      ],
    });
  });

  it('selects exactly the registered target when its exact owning test changed', () => {
    const plan = resolveMutationPlan(['src/shared/lib/migrations/defineVersion.test.ts']);

    expect(plan).toEqual({
      mode: 'focused',
      sources: ['src/shared/lib/migrations/defineVersion.ts'],
      reasons: ['changed registered owning test for src/shared/lib/migrations/defineVersion.ts'],
    });
  });

  it('does not select an unrelated production source with a sibling unit test', () => {
    const plan = resolveMutationPlan(['src/shared/lib/cache/index.ts']);

    expect(plan.mode).toBe('skip');
    expect(plan.sources).toEqual([]);
  });

  it('returns skip for an empty changed-file set', () => {
    expect(resolveMutationPlan([]).mode).toBe('skip');
  });

  it('selects the complete registered inventory for a mutation-infrastructure change', () => {
    const plan = resolveMutationPlan(['stryker.config.mjs']);

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual(MUTATION_TARGETS.map((target) => target.source).sort());
  });

  it('selects the complete registered inventory for a registry change', () => {
    const plan = resolveMutationPlan(['scripts/lib/mutationTargets.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual(MUTATION_TARGETS.map((target) => target.source).sort());
  });

  it('unions multiple simultaneously affected registered targets', () => {
    const plan = resolveMutationPlan([
      'src/shared/lib/changeObject/deepPatchJsonObject.ts',
      'src/shared/lib/migrations/defineVersion.test.ts',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.sources).toEqual([
      'src/shared/lib/changeObject/deepPatchJsonObject.ts',
      'src/shared/lib/migrations/defineVersion.ts',
    ]);
  });

  it('fails closed before any selection when the registry is invalid', () => {
    const plan = resolveMutationPlan(['src/shared/lib/changeObject/deepPatchJsonObject.ts'], {
      fileExists: () => false,
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.reasons.length).toBeGreaterThan(0);
  });
});
