import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import { RELEASE_IMPACT_CHECKS, resolveReleasePlan } from './releaseRisk.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

// Oracle: docs/testing/verify-target-architecture.md "# Release-impact
// architecture" (Goal through "CLI contract") plus the "End-state acceptance
// matrix" release row, plus this suite's own independently re-traced current
// consumer graph (see scripts/lib/REVIEW.md B2) established by direct file
// reads during test authoring:
//
// - `src/shared/service/appUpdate/releaseWireContract.ts` terminates BOTH the
//   proven plain-Node publisher import chain
//   (`scripts/release/publisherWireContractImportProof.mjs` ->
//   `scripts/pages/lib/releasePublish.mjs` ->
//   `scripts/pages/lib/releaseDescriptor.mjs` -> `releaseWireContract.ts`,
//   confirmed by that script's own docstring/imports) AND the runtime
//   managed-update boundary (imported by
//   `src/shared/service/appUpdate/contracts.ts`). It must select both
//   `publisher-node-import` and `managed-updates`.
// - `scripts/release/buildArtifact.mjs` (and its test) is invoked by
//   `playwright.release.config.ts`'s `webServer.command` (confirmed by direct
//   read of that config, lines ~46-61) for every release Playwright spec that
//   boots through it: `artifact` (`productionArtifactSmoke.spec.ts`),
//   `release-smoke` (`firstUserAndReturningUserSmoke.spec.ts`), and
//   `managed-updates` (`managedUpdatesProof.mjs` ->
//   `scripts/e2eReleaseContainer.mjs --config playwright.release.config.ts`,
//   confirmed by direct read). `scripts/verify.ts`'s `ARTIFACT_REUSE_LABELS`
//   is confirmed to be exactly `Set(['artifact', 'release-smoke'])`, so
//   `managed-updates` never reuses a prebuilt artifact and always
//   re-invokes `buildArtifact.mjs` itself. `release-config` and
//   `publisher-node-import` run as plain `node` invocations
//   (`RELEASE_CHECK_COMMANDS` in `scripts/verify.ts`), never through
//   `playwright.release.config.ts`, so they are correctly excluded from
//   `buildArtifact.mjs`'s consumer set.
// - `tests/e2e/release/fixtures/**` is NOT blanket-owned by `managed-updates`
//   by directory; each fixture's real importer(s) were traced individually
//   (grepped across every `tests/e2e/release/*.spec.ts`):
//   `controllerArtifactIdentityFixture.{mjs,d.mts}` and
//   `managedReleaseFixture.{mjs,d.mts,test.mjs}` are consumed only by
//   managed-updates-owned specs -> `managed-updates`;
//   `legacyGeneratedWorkboxPwaConfig.ts` is dynamically imported only by
//   `vite.config.ts` when `RELEASE_TEST_LEGACY_PWA_FIXTURE=1`, which only
//   `managedReleaseFixture.mjs` sets -> `managed-updates` (its one literal
//   string reference in `productionArtifactSmoke.spec.ts` asserts its
//   *absence* from ordinary builds, not a content dependency);
//   `ordinaryBranchArtifactFixture.{mjs,d.mts}` is imported ONLY by
//   `productionArtifactSmoke.spec.ts` -> `artifact` only. This last one is
//   the confirmed bug: the old blanket directory rule gave it
//   `managed-updates` (wrong check) while silently missing its true owner
//   `artifact` (a genuine false negative), and no prior test in this suite
//   ever covered this specific file. Any other/future fixture path not
//   exactly one of these must fail closed to `full`, not silently default to
//   `managed-updates` or `skip`.
//
// `scripts/lib/releaseRisk.ts` does not yet encode this corrected consumer
// graph; this whole suite is expected to fail (red) against the current
// unfixed production module -- that is the intended and correct state for
// this handoff (see scripts/lib/REVIEW.md B2). Do not weaken these
// assertions to make the current unfixed module pass.
//
// M1 correction (scripts/lib/REVIEW.md M1), established by this suite's own
// independent audit during test authoring:
// - `find src/shared/service/appUpdate -type f` lists ~55 files: production
//   runtime `.ts` sources, ordinary Vitest `*.test.ts` files, and three
//   `*.testUtils.ts` test-support files (`fakeCacheStorage.testUtils.ts`,
//   `fakeMessageChannel.testUtils.ts`, `releaseWireContract.testUtils.ts`).
//   `grep -rl` for all three `.testUtils.ts` basenames across the repository
//   confirms every importer is itself an ordinary `*.test.ts`/`*.test.mjs`
//   Vitest file (predecessorProbe.test.ts, releaseWireContract.test.ts,
//   contracts.test.ts, releasePreparation.test.ts, workerFetch.test.ts,
//   workerInstall.test.ts, scripts/pages/lib/releaseArtifact.test.mjs,
//   scripts/pages/lib/retainedReleaseTree.test.mjs) -- none is a
//   `tests/e2e/release/**` spec or a `.mjs` release orchestrator script, so
//   none is a real release-check input. The current
//   `isAppUpdateRuntimePath` directory-wide rule wrongly gives every
//   `*.test.ts`/`*.testUtils.ts` under this directory `managed-updates`
//   anyway, solely from the path prefix -- the confirmed M1 bug.
// - Direct read of `scripts/release/buildArtifact.test.mjs` confirms it only
//   imports the three pure functions `resolveArtifactBasePath`,
//   `resolveArtifactDistDir`, `runBuildArtifact` from `buildArtifact.mjs` and
//   always passes an injected `deps` object (`runLocalCommand`,
//   `runGuardedExpensiveLocalCommand`, `applyProcessResult`, all `vi.fn()`
//   mocks) -- it never invokes the real release build pipeline, so changing
//   only this test file cannot change release build behavior. The current
//   `NARROW_EXACT_MAPPINGS` entry that copies `buildArtifact.mjs`'s full
//   `['artifact', 'build', 'managed-updates', 'release-smoke']` consumer set
//   onto this unit-only test is the confirmed M1 bug; the simplest correct
//   fix is removing this path from `NARROW_EXACT_MAPPINGS` entirely (no other
//   rule -- narrow mapping, managed-update spec pattern, appUpdate prefix, or
//   unmapped-fixture fallback -- matches `scripts/release/
//   buildArtifact.test.mjs`, so removal alone correctly yields `skip`).
// - Required final behavior: ordinary unit `*.test.ts`/test-support files
//   under `src/shared/service/appUpdate/` must not select `managed-updates`
//   solely from the directory prefix; `buildArtifact.test.mjs` must not
//   inherit `buildArtifact.mjs`'s release consumer set; every other
//   currently-passing narrow-mapping/full-lane-trigger assertion in this
//   suite is preserved unchanged, including the real appUpdate production
//   boundary files (`controllerState.ts`, `updateReconciliation.ts`,
//   `releaseWireContract.ts`, `src/sw.ts`) and the real release E2E/
//   orchestrator inputs (`productionArtifactSmoke.spec.ts`,
//   `managedUpdatesProof.mjs`, the `managedUpdates*.spec.ts` family), which
//   this suite must keep proving are still correctly selected so the M1
//   correction does not become a blanket appUpdate/test exclusion.
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
// - "Unknown significant change inside a confirmed release-sensitive boundary -> full, not skip" (Must reject #3) -> `full-lane triggers` (scripts/pages/lib/** unmapped file, vite.config.ts) and the unmapped-fixture case in `narrow mappings`.
// - a resolver that silently drops a mapped check instead of `invalid` (Must reject #6) -> `registry self-consistency`.
// - a resolver that under-selects `buildArtifact.mjs`'s real Playwright-webServer consumer set, or blanket-classifies `tests/e2e/release/fixtures/**` by directory instead of by real importer (B2 false negatives) -> `narrow mappings`.
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
    // scripts/release/buildArtifact.test.mjs is deliberately NOT in this
    // list: the M1 correction removes it from NARROW_EXACT_MAPPINGS
    // entirely (unit-only proof, not a real release-check input -- see file
    // header), so it must no longer be a registered narrow-mapped path.
    'scripts/release/publisherWireContractImportProof.mjs',
    'scripts/release/managedUpdatesProof.mjs',
    'scripts/release/managedUpdatesProof.test.mjs',
    'scripts/release/runManagedReleaseDataCompatibilityProof.mjs',
    'scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs',
    'tests/e2e/release/productionArtifactSmoke.spec.ts',
    'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts',
    'src/sw.ts',
    // Added by the B2 correction: releaseWireContract.ts now has its own
    // exact narrow mapping (publisher-node-import + managed-updates) rather
    // than relying only on the generic appUpdate/ directory rule.
    'src/shared/service/appUpdate/releaseWireContract.ts',
    // Added by the B2 correction: individual real fixture files now have
    // exact per-file ownership instead of a blanket
    // tests/e2e/release/fixtures/** directory rule.
    'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.mjs',
    'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.d.mts',
    'tests/e2e/release/fixtures/managedReleaseFixture.mjs',
    'tests/e2e/release/fixtures/managedReleaseFixture.d.mts',
    'tests/e2e/release/fixtures/managedReleaseFixture.test.mjs',
    'tests/e2e/release/fixtures/legacyGeneratedWorkboxPwaConfig.ts',
    'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.mjs',
    'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.d.mts',
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

  it('selects artifact, build, managed-updates, and release-smoke for buildArtifact.mjs (every real playwright.release.config.ts webServer consumer, never release-config/publisher-node-import)', () => {
    // B2 correction: buildArtifact.mjs is invoked by
    // playwright.release.config.ts's webServer.command for every release
    // Playwright spec that boots through that config -- artifact,
    // release-smoke, and managed-updates (managed-updates is not in
    // scripts/verify.ts's ARTIFACT_REUSE_LABELS, so it always re-invokes
    // buildArtifact.mjs itself rather than reusing a prebuilt artifact).
    // release-config and publisher-node-import run as plain `node`
    // invocations and never touch this build path.
    const plan = resolveReleasePlan(['scripts/release/buildArtifact.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact', 'build', 'managed-updates', 'release-smoke']);
  });

  it("selects nothing for buildArtifact.test.mjs (M1: unit-only proof that mocks every dependency and never invokes the real build pipeline; must not inherit buildArtifact.mjs's release consumer set)", () => {
    const plan = resolveReleasePlan(['scripts/release/buildArtifact.test.mjs']);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
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
    'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.d.mts',
    'tests/e2e/release/fixtures/managedReleaseFixture.mjs',
    'tests/e2e/release/fixtures/managedReleaseFixture.d.mts',
    'tests/e2e/release/fixtures/managedReleaseFixture.test.mjs',
    // Dynamically imported only by vite.config.ts when
    // RELEASE_TEST_LEGACY_PWA_FIXTURE=1, which only managedReleaseFixture.mjs
    // (a managed-updates-only consumer) ever sets. Its one reference from
    // productionArtifactSmoke.spec.ts is a literal string asserting this
    // file's ABSENCE from ordinary builds, not a content dependency.
    'tests/e2e/release/fixtures/legacyGeneratedWorkboxPwaConfig.ts',
  ])(
    'selects only managed-updates for the real managed-update-owned fixture path %s',
    (filePath) => {
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.checks).toEqual(['managed-updates']);
    },
  );

  it.each([
    'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.mjs',
    'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.d.mts',
  ])(
    // B2 correction / confirmed bug: this file is imported ONLY by
    // productionArtifactSmoke.spec.ts (an `artifact`-owned spec), never by
    // any managed-updates spec. The old blanket
    // tests/e2e/release/fixtures/** directory rule gave it `managed-updates`
    // (wrong check) while silently missing its true owner `artifact` -- a
    // genuine false negative this suite previously never covered.
    'selects only artifact for the real artifact-owned fixture path %s (never managed-updates)',
    (filePath) => {
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.checks).toEqual(['artifact']);
    },
  );

  it('fails closed to full for an unmapped tests/e2e/release/fixtures/** path (no blanket managed-updates directory default)', () => {
    // B2 correction: fixture ownership must not fall back to a blanket
    // directory-wide managed-updates default. An unlisted fixture's true
    // consumer is not safely bounded, so it must fail closed to full rather
    // than silently defaulting to managed-updates or skip.
    const plan = resolveReleasePlan(['tests/e2e/release/fixtures/someNewFixture.mjs']);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });

  it('selects both managed-updates and publisher-node-import for releaseWireContract.ts (the real publisher-node-import terminus, plus its real managed-update runtime ownership)', () => {
    // B2 correction: scripts/release/publisherWireContractImportProof.mjs
    // imports scripts/pages/lib/releasePublish.mjs ->
    // scripts/pages/lib/releaseDescriptor.mjs ->
    // src/shared/service/appUpdate/releaseWireContract.ts directly (confirmed
    // by that script's own docstring/imports), so a change here genuinely
    // affects the publisher-node-import proof. It is also imported by
    // src/shared/service/appUpdate/contracts.ts, the runtime managed-update
    // boundary, so its real managed-updates ownership must be preserved too.
    const plan = resolveReleasePlan(['src/shared/service/appUpdate/releaseWireContract.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates', 'publisher-node-import']);
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

describe('resolveReleasePlan excludes unit-only appUpdate proof from the directory-wide managed-updates rule (M1, Must reject)', () => {
  // M1 Must reject: src/shared/service/appUpdate/<unit>.test.ts must not
  // select managed-updates solely from the directory prefix. Every importer
  // of these files is itself an ordinary Vitest unit test (confirmed by
  // repository-wide grep during test authoring -- see file header); none is
  // a tests/e2e/release/** spec or a .mjs release orchestrator script.
  it.each([
    'src/shared/service/appUpdate/controllerState.test.ts',
    'src/shared/service/appUpdate/updateReconciliation.test.ts',
    'src/shared/service/appUpdate/releaseWireContract.test.ts',
  ])('selects nothing for the ordinary unit test %s', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });

  it.each([
    'src/shared/service/appUpdate/fakeCacheStorage.testUtils.ts',
    'src/shared/service/appUpdate/fakeMessageChannel.testUtils.ts',
    'src/shared/service/appUpdate/releaseWireContract.testUtils.ts',
  ])(
    'selects nothing for the test-support file %s (every real importer is itself an ordinary Vitest test, never a release E2E spec or .mjs orchestrator)',
    (filePath) => {
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('skip');
      expect(plan.checks).toEqual([]);
    },
  );

  it('still selects managed-updates for the real production appUpdate boundary alongside an ordinary unit test in the same changeset (the correction does not become a blanket appUpdate exclusion)', () => {
    const plan = resolveReleasePlan([
      'src/shared/service/appUpdate/controllerState.ts',
      'src/shared/service/appUpdate/controllerState.test.ts',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it('still selects artifact for a real release E2E input in the same changeset as an excluded appUpdate unit test (the correction does not hide real release inputs)', () => {
    const plan = resolveReleasePlan([
      'src/shared/service/appUpdate/controllerState.test.ts',
      'tests/e2e/release/productionArtifactSmoke.spec.ts',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact']);
  });

  it('still selects managed-updates for the real managed-updates orchestrator script in the same changeset as an excluded appUpdate unit test', () => {
    const plan = resolveReleasePlan([
      'src/shared/service/appUpdate/controllerState.test.ts',
      'scripts/release/managedUpdatesProof.mjs',
    ]);

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
