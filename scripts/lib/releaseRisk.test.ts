import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import { RELEASE_IMPACT_CHECKS, resolveReleasePlan } from './releaseRisk.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

// Oracle: docs/testing/verify-target-architecture.md "# Release-impact
// architecture" (Goal through "CLI contract") plus the "End-state acceptance
// matrix" release row, plus the architect's verified file-existence/import
// facts recorded in the task handoff. `scripts/lib/releaseRisk.ts` does not
// exist yet; this whole suite is expected to fail at import time (valid
// new-API red).
//
// One correction to the task handoff, established by direct file read
// during test authoring: `scripts/release/publisherWireContractImportProof.
// test.mjs` does NOT exist on disk (only the `.mjs` source does). The doc's
// own "Release proof itself" list also only names the `.mjs` file for this
// mapping. This suite therefore treats only the `.mjs` source as the narrow
// `publisher-node-import` mapping, and includes an explicit real-registry
// self-consistency test (`accepts the real registry ... -> skip`) that would
// fail immediately if a production registry mistakenly referenced that
// nonexistent test path as an exact narrow-mapped file.
//
// `checks` arrays are asserted using one fixed alphabetical (localeCompare)
// convention for both `focused` merges and `full` mode, matching this
// repo's established sort convention in `unitRisk.ts`/`mutationTargets.ts`
// (`uniqSorted`) and confirmed by the task's own worked example: changing
// `validateReleaseConfig.mjs` + `publisherWireContractImportProof.mjs`
// together selects `['publisher-node-import', 'release-config']`.
//
// Contract sentences this file proves, by group:
// - "invalid mode ... self-consistency check" -> `resolveReleasePlan registry self-consistency`.
// - "Each narrow exact-file/prefix mapping ... selects exactly its listed check(s)" (Must reject #1) -> `narrow mappings`.
// - "Each full-lane trigger path selects all six" -> `full-lane triggers`.
// - "Version-policy files ... alone select nothing" (Must reject #2) -> `version-policy exclusion`.
// - "package.json version-only alone -> skip" / "runtime-relevant or unresolvable -> full" -> `package.json impact`.
// - "pnpm-lock.yaml alone -> full ... does NOT depend on the package.json check being called at all" (Must reject #5) -> `pnpm-lock.yaml unconditional full`.
// - "Combining two different narrow mappings ... merges" / "Full dominates focused" / "irrelevant path ... does not erase" -> `composition and non-erasure`.
// - "Unknown significant change inside a confirmed release-sensitive boundary -> full, not skip" (Must reject #3) -> `full-lane triggers` (scripts/pages/lib/** unmapped file, vite.config.ts).
// - a resolver that silently drops a mapped check instead of `invalid` (Must reject #6) -> `registry self-consistency`.
//
// Must reject #4 (inferring PATCH/MINOR/MAJOR release-version intent from
// changed files) has no corresponding test: there is no such concept in this
// resolver, and this suite does not test for or imply one.

// All six checks, alphabetically sorted (localeCompare) -- the expected
// `checks` value for every `full` mode plan in this suite.
const ALL_CHECKS_SORTED = [
  'artifact',
  'build',
  'managed-updates',
  'publisher-node-import',
  'release-config',
  'release-smoke',
];

describe('RELEASE_IMPACT_CHECKS', () => {
  it('exposes exactly the six declared release-impact checks, in declaration order', () => {
    expect(RELEASE_IMPACT_CHECKS).toEqual([
      'release-config',
      'build',
      'publisher-node-import',
      'artifact',
      'release-smoke',
      'managed-updates',
    ]);
  });
});

describe('resolveReleasePlan registry self-consistency (invalid mode)', () => {
  it('accepts the real registry against the real filesystem with no changed files -> skip, not invalid', () => {
    // Guards against a production registry that references a narrow-mapped
    // file which does not actually exist on disk (see file header note on
    // publisherWireContractImportProof.test.mjs): if the real hardcoded
    // registry were broken, this would return 'invalid' instead of 'skip'.
    const plan = resolveReleasePlan([]);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });

  it.each([
    'scripts/release/validateReleaseConfig.mjs',
    'scripts/release/validateReleaseConfig.test.mjs',
    'scripts/release/buildArtifact.mjs',
    'scripts/release/buildArtifact.test.mjs',
    'scripts/release/publisherWireContractImportProof.mjs',
    'scripts/release/managedUpdatesProof.mjs',
    'scripts/release/managedUpdatesProof.test.mjs',
    'scripts/release/runManagedReleaseDataCompatibilityProof.mjs',
    'scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs',
    'tests/e2e/release/productionArtifactSmoke.spec.ts',
    'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts',
    'src/sw.ts',
  ])(
    'fails invalid (not skip/focused) when the real narrow-mapped path %s is reported missing',
    (missingPath) => {
      const plan = resolveReleasePlan([], {
        fileExists: (filePath) => filePath !== missingPath,
      });

      expect(plan.mode).toBe('invalid');
      expect(plan.checks).toEqual([]);
      expect(plan.reasons.length).toBeGreaterThan(0);
    },
  );

  it('invalid dominates an otherwise full-triggering changeset when a mapped path is missing', () => {
    const plan = resolveReleasePlan(['vite.config.ts'], {
      fileExists: (filePath) => filePath !== 'scripts/release/validateReleaseConfig.mjs',
    });

    expect(plan.mode).toBe('invalid');
  });

  it('invalid dominates an otherwise focused-triggering changeset when a different mapped path is missing', () => {
    const plan = resolveReleasePlan(['scripts/release/buildArtifact.mjs'], {
      fileExists: (filePath) => filePath !== 'src/sw.ts',
    });

    expect(plan.mode).toBe('invalid');
  });
});

describe('resolveReleasePlan full-lane triggers (real hardcoded paths)', () => {
  it.each([
    'config/tooling.json',
    'vite.config.ts',
    'playwright.release.config.ts',
    'index.html',
    'scripts/pages/lib/ghPagesBranch.mjs',
    'scripts/pages/lib/releasePublish.mjs',
    'scripts/release/artifactServer.mjs',
    'scripts/verify.ts',
    'scripts/lib/releaseRisk.ts',
  ])('runs full source-impact release proof for a modified %s', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });
});

describe('resolveReleasePlan version-policy exclusion (skip mode)', () => {
  // Must reject #2: a resolver that treats a version-policy file as
  // release-source-impact-sensitive merely because it lives under
  // scripts/release/**.
  it.each([
    'scripts/release/materializePrVersion.mjs',
    'scripts/release/materializePrVersion.test.mjs',
    'scripts/release/versionPolicy.mjs',
    'scripts/release/versionPolicy.test.mjs',
    'scripts/release/validateVersion.mjs',
    'scripts/release/validateVersion.test.mjs',
  ])('selects nothing for a version-policy file %s changed alone', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });
});

describe('resolveReleasePlan narrow mappings (real end-to-end proof, no options override)', () => {
  it('selects only release-config for validateReleaseConfig.mjs', () => {
    const plan = resolveReleasePlan(['scripts/release/validateReleaseConfig.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['release-config']);
  });

  it('selects only release-config for validateReleaseConfig.test.mjs', () => {
    const plan = resolveReleasePlan(['scripts/release/validateReleaseConfig.test.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['release-config']);
  });

  it('selects exactly artifact and build for buildArtifact.mjs (never the other four)', () => {
    const plan = resolveReleasePlan(['scripts/release/buildArtifact.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact', 'build']);
  });

  it('selects exactly artifact and build for buildArtifact.test.mjs', () => {
    const plan = resolveReleasePlan(['scripts/release/buildArtifact.test.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact', 'build']);
  });

  it('selects only publisher-node-import for publisherWireContractImportProof.mjs', () => {
    const plan = resolveReleasePlan(['scripts/release/publisherWireContractImportProof.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['publisher-node-import']);
  });

  it('selects only managed-updates for managedUpdatesProof.mjs', () => {
    const plan = resolveReleasePlan(['scripts/release/managedUpdatesProof.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it('selects only managed-updates for managedUpdatesProof.test.mjs', () => {
    const plan = resolveReleasePlan(['scripts/release/managedUpdatesProof.test.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it('selects only managed-updates for runManagedReleaseDataCompatibilityProof.mjs', () => {
    const plan = resolveReleasePlan([
      'scripts/release/runManagedReleaseDataCompatibilityProof.mjs',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it('selects only managed-updates for runManagedReleaseDataCompatibilityProof.test.mjs', () => {
    const plan = resolveReleasePlan([
      'scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it('selects only artifact for productionArtifactSmoke.spec.ts', () => {
    const plan = resolveReleasePlan(['tests/e2e/release/productionArtifactSmoke.spec.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact']);
  });

  it('selects only release-smoke for firstUserAndReturningUserSmoke.spec.ts', () => {
    const plan = resolveReleasePlan(['tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['release-smoke']);
  });

  it.each([
    'tests/e2e/release/managedUpdatesMigration.spec.ts',
    'tests/e2e/release/managedUpdatesVueBootFailure.spec.ts',
    'tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts',
    'tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts',
    'tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts',
    'tests/e2e/release/managedUpdatesLifecycle.spec.ts',
    'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
    'tests/e2e/release/managedUpdatesRecovery.spec.ts',
    'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
    'tests/e2e/release/managedUpdatesRollbackDiagnostics.spec.ts',
    'tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts',
    'tests/e2e/release/managedUpdatesDevelop.spec.ts',
    'tests/e2e/release/managedReleaseDataCompatibility.spec.ts',
  ])('selects only managed-updates for the real release spec %s', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it.each([
    'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.mjs',
    'tests/e2e/release/fixtures/managedReleaseFixture.mjs',
    'tests/e2e/release/fixtures/managedReleaseFixture.test.mjs',
  ])('selects only managed-updates for the real fixture path %s', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it('selects exactly artifact and managed-updates for src/sw.ts (never the other four)', () => {
    const plan = resolveReleasePlan(['src/sw.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact', 'managed-updates']);
  });

  it.each([
    'src/shared/service/appUpdate/controllerState.ts',
    'src/shared/service/appUpdate/updateReconciliation.ts',
  ])('selects only managed-updates for the real appUpdate boundary file %s', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });
});

describe('resolveReleasePlan package.json impact', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('selects nothing for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveReleasePlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs full source-impact release proof for a runtime-relevant package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveReleasePlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });

  it('runs full source-impact release proof when the package.json comparison is unresolvable (fails closed)', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveReleasePlan(['package.json'], { packageJsonOldRef: null });

    expect(plan.mode).toBe('full');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: null });
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    resolveReleasePlan(['scripts/release/validateReleaseConfig.mjs']);

    expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
  });
});

describe('resolveReleasePlan pnpm-lock.yaml unconditional full', () => {
  // Must reject #5: a resolver that consults isPackageJsonRuntimeRelevantChange
  // for a pnpm-lock.yaml-only change (should be unconditionally full
  // regardless of the package.json check).
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('runs full source-impact release proof for pnpm-lock.yaml alone without consulting the package.json check', () => {
    const plan = resolveReleasePlan(['pnpm-lock.yaml']);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
    expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
  });
});

describe('resolveReleasePlan composition and non-erasure', () => {
  it('merges two different narrow mappings into one focused plan, deduplicated and alphabetically sorted', () => {
    const plan = resolveReleasePlan([
      'scripts/release/validateReleaseConfig.mjs',
      'scripts/release/publisherWireContractImportProof.mjs',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['publisher-node-import', 'release-config']);
  });

  it('full dominates focused within the same changeset (full-lane path + narrow mapping together)', () => {
    const plan = resolveReleasePlan([
      'vite.config.ts',
      'scripts/release/validateReleaseConfig.mjs',
    ]);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });

  it('an irrelevant path alone selects nothing', () => {
    const plan = resolveReleasePlan(['src/entities/foo/foo.ts']);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });

  it('AGENTS.md alone selects nothing', () => {
    const plan = resolveReleasePlan(['AGENTS.md']);

    expect(plan.mode).toBe('skip');
  });

  it('README.md alone selects nothing', () => {
    const plan = resolveReleasePlan(['README.md']);

    expect(plan.mode).toBe('skip');
  });

  it('an irrelevant path does not erase a narrow-mapping result from another path in the same changeset', () => {
    const plan = resolveReleasePlan(['scripts/release/validateReleaseConfig.mjs', 'AGENTS.md']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['release-config']);
  });

  it('an irrelevant path does not erase a full-lane result from another path in the same changeset', () => {
    const plan = resolveReleasePlan(['vite.config.ts', 'AGENTS.md']);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });
});
