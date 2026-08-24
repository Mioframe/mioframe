import { describe, expect, it } from 'vitest';

import {
  MUTATION_TARGETS,
  resolveMutationPlan,
  validateMutationRegistry,
  type MutationTarget,
} from './mutationTargets.ts';

// Oracle: docs/testing/verify-target-architecture.md "# Mutation architecture"
// (Goal through "Mutation acceptance") plus the architect's verified bounded
// audit of the 7 justified high-risk targets (all 14 source/test paths
// confirmed to exist on disk). `mutationTargets.ts` does not exist yet; this
// whole suite is expected to fail at import time (valid new-API red).
//
// Contract sentences this file proves, by group:
// - "Registry validation" bullet list (Goal doc section) -> `describe('validateMutationRegistry ...')`.
// - "the real MUTATION_TARGETS constant must validate successfully" -> `validateMutationRegistry() defaults`.
// - "registered source change -> exact mutation target" -> `resolveMutationPlan source match`.
// - "registered owning-test change selects exact registered source" -> `resolveMutationPlan owning-test match`.
// - "focused stays narrow, not broad" (Must reject #3) -> single-target-selects-only-itself tests.
// - "unregistered source with adjacent tests -> mutation skip" (core adjacency regression, Must reject #1) -> sibling-file tests.
// - "registry/Stryker config change ... -> all registered targets or invalid, never silent skip" -> `resolveMutationPlan semantic-change full mode`.
// - "invalid dominates everything else" (Plan model doc) -> invalid-dominates tests.
// - real end-to-end proof with >= 2 of the 7 confirmed real targets -> `resolveMutationPlan real MUTATION_TARGETS`.

const EVERYTHING_EXISTS = () => true;
const NOTHING_EXISTS = () => false;

function makeTarget(overrides: Partial<MutationTarget> = {}): MutationTarget {
  return {
    name: 'sample-target',
    source: 'src/shared/lib/sample/sample.ts',
    tests: ['src/shared/lib/sample/sample.test.ts'],
    reason: 'Concrete high-risk reason for the sample target.',
    ...overrides,
  };
}

// Three deterministic fixture targets, alphabetically ordered by source path
// (alpha < beta < gamma) so sort/dedup assertions are unambiguous.
const TARGET_ALPHA: MutationTarget = {
  name: 'alpha-target',
  source: 'src/shared/lib/alpha/alpha.ts',
  tests: ['src/shared/lib/alpha/alpha.test.ts'],
  reason: 'Alpha primitive is shared by every consumer; a wrong result is silent.',
};

const TARGET_BETA: MutationTarget = {
  name: 'beta-target',
  source: 'src/shared/lib/beta/beta.ts',
  tests: ['src/shared/lib/beta/beta.test.ts'],
  reason: 'Beta boundary check guards a security-relevant path.',
};

const TARGET_GAMMA: MutationTarget = {
  name: 'gamma-target',
  source: 'src/shared/lib/gamma/gamma.ts',
  tests: ['src/shared/lib/gamma/gamma.test.ts'],
  reason: 'Gamma precedence resolution silently shows the wrong value if wrong.',
};

const FIXTURE_TARGETS: readonly MutationTarget[] = [TARGET_ALPHA, TARGET_BETA, TARGET_GAMMA];

describe('validateMutationRegistry', () => {
  it('accepts a well-formed single target when its source and tests exist', () => {
    const result = validateMutationRegistry([makeTarget()], { fileExists: EVERYTHING_EXISTS });

    expect(result.valid).toBe(true);
  });

  it('fails invalid when a target source does not exist on disk', () => {
    const result = validateMutationRegistry([makeTarget()], {
      fileExists: (filePath) => filePath !== 'src/shared/lib/sample/sample.ts',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('fails invalid when an owning test does not exist on disk', () => {
    const result = validateMutationRegistry([makeTarget()], {
      fileExists: (filePath) => filePath !== 'src/shared/lib/sample/sample.test.ts',
    });

    expect(result.valid).toBe(false);
  });

  it('fails invalid when an owning test path is not shaped like a Vitest test (no .test.ts suffix)', () => {
    const result = validateMutationRegistry(
      [makeTarget({ tests: ['src/shared/lib/sample/sampleHelper.ts'] })],
      { fileExists: EVERYTHING_EXISTS },
    );

    expect(result.valid).toBe(false);
  });

  it('fails invalid when two different targets register the same source', () => {
    const result = validateMutationRegistry(
      [
        makeTarget({ name: 'first', source: 'src/shared/lib/sample/sample.ts' }),
        makeTarget({ name: 'second', source: 'src/shared/lib/sample/sample.ts' }),
      ],
      { fileExists: EVERYTHING_EXISTS },
    );

    expect(result.valid).toBe(false);
  });

  it('fails invalid when the same target entry is listed twice in the registry', () => {
    const duplicate = makeTarget();
    const result = validateMutationRegistry([duplicate, duplicate], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(result.valid).toBe(false);
  });

  it('fails invalid when tests is empty', () => {
    const result = validateMutationRegistry([makeTarget({ tests: [] })], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(result.valid).toBe(false);
  });

  it('fails invalid when reason is empty', () => {
    const result = validateMutationRegistry([makeTarget({ reason: '' })], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(result.valid).toBe(false);
  });

  it('fails invalid when name is empty', () => {
    const result = validateMutationRegistry([makeTarget({ name: '' })], {
      fileExists: EVERYTHING_EXISTS,
    });

    expect(result.valid).toBe(false);
  });

  it('fails invalid when two targets share the same name', () => {
    const result = validateMutationRegistry(
      [
        makeTarget({ name: 'shared-name', source: 'src/shared/lib/sample/sample.ts' }),
        makeTarget({
          name: 'shared-name',
          source: 'src/shared/lib/other/other.ts',
          tests: ['src/shared/lib/other/other.test.ts'],
        }),
      ],
      { fileExists: EVERYTHING_EXISTS },
    );

    expect(result.valid).toBe(false);
  });

  it('never accepts a broken registry as valid regardless of how it broke (fail-closed shape)', () => {
    // Must reject #6: a validator that accepts a nonexistent source or a
    // duplicate source is a false-negative validator, which would let
    // resolveMutationPlan silently mutate the wrong (or a nonexistent)
    // file instead of failing invalid.
    const missingSource = validateMutationRegistry([makeTarget()], { fileExists: NOTHING_EXISTS });
    const duplicateSource = validateMutationRegistry(
      [makeTarget({ name: 'first' }), makeTarget({ name: 'second' })],
      { fileExists: EVERYTHING_EXISTS },
    );

    expect(missingSource.valid).toBe(false);
    expect(duplicateSource.valid).toBe(false);
  });

  it('accepts the real MUTATION_TARGETS registry against the real filesystem by default', () => {
    const result = validateMutationRegistry();

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.targets).toBe(MUTATION_TARGETS);
    }
  });

  it('the real MUTATION_TARGETS registry contains exactly the 7 confirmed audited entries', () => {
    // Guards against silent invention/addition/removal of targets: the
    // architect's bounded audit selected exactly these 7 sources.
    const sources = MUTATION_TARGETS.map((entry) => entry.source)
      .slice()
      .sort();

    expect(sources).toEqual([
      'src/shared/lib/automergeAdapter/filenameCodecV3.ts',
      'src/shared/lib/automergeAdapter/storageKeyHelpers.ts',
      'src/shared/lib/changeObject/deepPatchJsonObject.ts',
      'src/shared/lib/databaseDocument/effectiveValue.ts',
      'src/shared/lib/reorder/reorderArray.ts',
      'src/shared/lib/zipArchive/zipArchiveCodec.ts',
      'src/shared/lib/zipArchive/zipArchivePathSafety.ts',
    ]);
  });
});

describe('resolveMutationPlan registry-invalid dominance', () => {
  it('returns invalid (not skip/focused) when the injected registry itself is broken', () => {
    // Must reject #2: a resolver that silently drops a target on a broken
    // registry instead of returning invalid.
    const brokenTargets = [makeTarget({ reason: '' })];

    const plan = resolveMutationPlan(['src/shared/lib/sample/sample.ts'], {
      targets: brokenTargets,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.sources).toEqual([]);
  });

  it('stays invalid even when a changed file would otherwise trigger the full semantic-change path', () => {
    const brokenTargets = [makeTarget({ tests: [] })];

    const plan = resolveMutationPlan(['stryker.config.mjs'], {
      targets: brokenTargets,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.sources).toEqual([]);
  });
});

describe('resolveMutationPlan focused source/test selection', () => {
  it('selects only the exact registered source for a changed file equal to that source', () => {
    // Must reject #3: selecting the whole registry instead of the one
    // matched target.
    const plan = resolveMutationPlan([TARGET_ALPHA.source], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.sources).toEqual([TARGET_ALPHA.source]);
  });

  it("selects the exact registered source for a changed file equal to that target's owning test", () => {
    // Must reject #4: treating a changed owning-test file as mutation-irrelevant.
    const plan = resolveMutationPlan([TARGET_BETA.tests[0]], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.sources).toEqual([TARGET_BETA.source]);
  });

  it('selects both matched sources, deduplicated and sorted, when two changed files match different targets', () => {
    const plan = resolveMutationPlan([TARGET_GAMMA.source, TARGET_ALPHA.tests[0]], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.sources).toEqual([TARGET_ALPHA.source, TARGET_GAMMA.source]);
  });

  it('deduplicates when the same target is matched twice (via source and its own test in the same changeset)', () => {
    const plan = resolveMutationPlan([TARGET_ALPHA.source, TARGET_ALPHA.tests[0]], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.sources).toEqual([TARGET_ALPHA.source]);
  });
});

describe('resolveMutationPlan adjacency and unrelated changes never select mutation', () => {
  it('does not select mutation for a same-directory sibling of a registered source that is not itself registered', () => {
    // Must reject #1 -- the core acceptance criterion this whole pass exists
    // for: proximity/naming similarity to a registered target must not
    // select mutation.
    const plan = resolveMutationPlan(['src/shared/lib/alpha/siblingHelper.ts'], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('skip');
    expect(plan.sources).toEqual([]);
  });

  it('does not select mutation for a file unrelated to any registered target', () => {
    const plan = resolveMutationPlan(['src/entities/someEntity/someEntity.ts'], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('skip');
    expect(plan.sources).toEqual([]);
  });

  it('skips for an empty changed-files list', () => {
    const plan = resolveMutationPlan([], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('skip');
    expect(plan.sources).toEqual([]);
  });
});

describe('resolveMutationPlan registry/config semantic-change full mode', () => {
  it('selects full mode with every registered source when stryker.config.mjs changes', () => {
    // Must reject #5: treating a Stryker-config change as ordinary/skip
    // instead of the required all-registered-targets full case.
    const plan = resolveMutationPlan(['stryker.config.mjs'], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual([TARGET_ALPHA.source, TARGET_BETA.source, TARGET_GAMMA.source]);
  });

  it('selects full mode with every registered source when the mutation registry module itself changes', () => {
    const plan = resolveMutationPlan(['scripts/lib/mutationTargets.ts'], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual([TARGET_ALPHA.source, TARGET_BETA.source, TARGET_GAMMA.source]);
  });

  it('full dominates focused when a semantic-change path and an ordinary target change land in the same changeset', () => {
    const plan = resolveMutationPlan(['stryker.config.mjs', TARGET_ALPHA.source], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual([TARGET_ALPHA.source, TARGET_BETA.source, TARGET_GAMMA.source]);
  });

  it('does not select full mode merely for an ordinary single-target change (full is not the default outcome)', () => {
    const plan = resolveMutationPlan([TARGET_ALPHA.source], {
      targets: FIXTURE_TARGETS,
      fileExists: EVERYTHING_EXISTS,
    });

    expect(plan.mode).not.toBe('full');
  });
});

describe('resolveMutationPlan against the real MUTATION_TARGETS registry', () => {
  it('resolves the reorder array target end to end for a source change (no options override)', () => {
    const plan = resolveMutationPlan(['src/shared/lib/reorder/reorderArray.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.sources).toEqual(['src/shared/lib/reorder/reorderArray.ts']);
  });

  it('resolves the zip archive path-safety target end to end for its owning test change (no options override)', () => {
    const plan = resolveMutationPlan(['src/shared/lib/zipArchive/zipArchivePathSafety.test.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.sources).toEqual(['src/shared/lib/zipArchive/zipArchivePathSafety.ts']);
  });

  it('does not select mutation for a real unregistered sibling of a registered reorder target', () => {
    // Same directory as the registered src/shared/lib/reorder/reorderArray.ts
    // target; a real file confirmed to exist and confirmed not registered.
    const plan = resolveMutationPlan(['src/shared/lib/reorder/reorderAutoscrollGeometry.ts']);

    expect(plan.mode).toBe('skip');
    expect(plan.sources).toEqual([]);
  });

  it('selects full mode with all 7 real registered sources when stryker.config.mjs changes (no options override)', () => {
    const plan = resolveMutationPlan(['stryker.config.mjs']);

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual(
      MUTATION_TARGETS.map((entry) => entry.source)
        .slice()
        .sort((left, right) => left.localeCompare(right)),
    );
  });
});

// Oracle: docs/testing/verify-mutation-impact-correction.md "One Vitest
// test-path owner" plus scripts/lib/REVIEW.md section B2 "Problem B -- false
// Vitest ownership heuristic". validateMutationRegistry()'s current
// isTestShapedPath is a bare `.endsWith('.test.ts')` heuristic that disagrees
// with vitest.config.ts's real include/exclude test-discovery contract
// (mirrored more accurately today by scripts/lib/unitRisk.ts's own
// isTestShapedPath -- see that file for oracle evidence). This describe
// block proves both directions of the disagreement.
describe('validateMutationRegistry real Vitest ownership', () => {
  it('accepts a real Vitest-owned scripts/**/*.test.mjs owning test (scripts/agentEnvironment.test.mjs) instead of rejecting it as non-Vitest-owned', () => {
    // Must reject: a real Vitest-discovered test (vitest.config.ts includes
    // scripts/**/*.test.mjs) rejected merely because it does not end in
    // .test.ts. fileExists is overridden to EVERYTHING_EXISTS so only the
    // test-shape/ownership check is exercised, isolated from real-disk
    // existence.
    const result = validateMutationRegistry(
      [makeTarget({ tests: ['scripts/agentEnvironment.test.mjs'] })],
      { fileExists: EVERYTHING_EXISTS },
    );

    expect(result.valid).toBe(true);
  });

  it('rejects a .test.ts owning test path outside every real configured Vitest include root as non-Vitest-owned', () => {
    // Must reject: an arbitrary `.test.ts` path wrongly accepted only
    // because it ends with .test.ts, even though vitest.config.ts's real
    // include globs never discover it (outside src/, config/, and
    // scripts/). fileExists reports the fictional path as existing so only
    // the shape/ownership check, not existence, is what must fail.
    const result = validateMutationRegistry(
      [makeTarget({ tests: ['some/path/outside/configured/roots/example.test.ts'] })],
      { fileExists: EVERYTHING_EXISTS },
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(
        result.errors.some((error) =>
          error.includes(
            'non-Vitest-owned test path some/path/outside/configured/roots/example.test.ts',
          ),
        ),
      ).toBe(true);
    }
  });
});

// Oracle: docs/testing/verify-mutation-impact-correction.md "Ownership of the
// shared contract" -- "Mutation semantic-change paths are exactly:
// stryker.config.mjs, scripts/lib/mutationTargets.ts, vitest.config.ts,
// scripts/lib/vitestTestPaths.ts". stryker.config.mjs explicitly runs Vitest
// via vitest.config.ts (`vitest.configFile`), so a change to either Vitest
// test-discovery owner is a mutation-execution-semantic change and must
// select all registered mutation targets, exactly like the two paths already
// in REGISTRY_SEMANTIC_CHANGE_PATHS today.
describe('resolveMutationPlan mutation-execution-semantic ownership of the shared Vitest test-path owner', () => {
  it('selects full mode with all 7 real registered sources when vitest.config.ts changes', () => {
    const plan = resolveMutationPlan(['vitest.config.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual(
      MUTATION_TARGETS.map((entry) => entry.source)
        .slice()
        .sort((left, right) => left.localeCompare(right)),
    );
  });

  it('selects full mode with all 7 real registered sources when the new shared Vitest test-path owner (scripts/lib/vitestTestPaths.ts) changes -- resolveMutationPlan matches semantic-change paths via a plain string-set membership check against changed file paths, not a filesystem existence check, so this path need not exist on disk yet', () => {
    const plan = resolveMutationPlan(['scripts/lib/vitestTestPaths.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.sources).toEqual(
      MUTATION_TARGETS.map((entry) => entry.source)
        .slice()
        .sort((left, right) => left.localeCompare(right)),
    );
  });
});
