import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import {
  RELEASE_IMPACT_CHECKS,
  resolveReleasePlan,
  type ReleaseImpactCheck,
  type ResolveReleasePlanOptions,
} from './releaseRisk.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

// Oracle: docs/testing/verify-release-impact-correction.md -- the canonical
// release-impact consumer-model architecture -- plus this suite's own
// independently re-traced consumer graph, established by direct reads of the
// real repository source (not taken on faith from the architecture doc
// alone):
//
// Contract A -- real release execution inputs (confirmed by direct read):
// - `scripts/verify.ts`'s `RELEASE_CHECK_COMMANDS` (read directly) shows
//   `artifact`/`release-smoke` run `pnpm e2e:release ...`, which
//   `scripts/e2eReleaseContainer.mjs` (read directly) turns into
//   `runPlaywrightInContainer({ config: 'playwright.release.config.ts', ... })`
//   from `scripts/playwrightContainer.ts` (read directly). `managed-updates`
//   runs `node scripts/release/managedUpdatesProof.mjs` (read directly),
//   which for every one of its four groups shells out to
//   `node scripts/e2eReleaseContainer.mjs --label <group> ...specs` (same
//   container/config chain). `scripts/release/runManagedReleaseDataCompatibilityProof.mjs`
//   (read directly, the data-compatibility group's own runner) does the same.
//   So `scripts/e2eReleaseContainer.mjs` and `scripts/playwrightContainer.ts`
//   are real execution inputs for exactly `artifact`, `release-smoke`, and
//   `managed-updates` -- never `release-config`/`build`/`publisher-node-import`,
//   which run as plain `node` invocations per `RELEASE_CHECK_COMMANDS` and
//   never touch this chain.
// - `playwright.release.config.ts` (read directly) is the exact `config`
//   value passed to `runPlaywrightInContainer` by every one of those callers,
//   so it shares the identical `artifact + release-smoke + managed-updates`
//   consumer set -- never all six. Its own `webServer.command` (read
//   directly) is `node scripts/release/buildArtifact.mjs ... && node
//   scripts/release/artifactServer.mjs ...`, so `scripts/release/artifactServer.mjs`
//   shares that same three-check consumer set too (never all six), and
//   `scripts/release/buildArtifact.mjs` keeps its already-correct
//   `artifact + build + managed-updates + release-smoke` set (verified via
//   `scripts/verify.ts`'s `ARTIFACT_REUSE_LABELS = new Set(['artifact',
//   'release-smoke'])`, read directly: `managed-updates` is not in that set,
//   so it always re-invokes `buildArtifact.mjs` itself rather than reusing a
//   prebuilt artifact).
// - `tests/e2e/helpers.ts`: grepped every real `from '.*helpers'` import
//   across `tests/e2e/release/*.spec.ts` (not merely a text/comment mention
//   -- `managedUpdatesCrossEngineLifecycle.spec.ts` only *mentions*
//   `tests/e2e/helpers.ts` in a comment and does not import it, so it is
//   correctly excluded). The real importers are exactly
//   `productionArtifactSmoke.spec.ts` (artifact),
//   `firstUserAndReturningUserSmoke.spec.ts` (release-smoke),
//   `managedUpdatesActivationUi.spec.ts`, `managedUpdatesRecovery.spec.ts`,
//   and `managedReleaseDataCompatibility.spec.ts` (all managed-updates) --
//   confirming the doc's `artifact + release-smoke + managed-updates`
//   consumer set exactly.
// - Publisher boundary (`scripts/pages/lib/releasePublish.mjs` /
//   `releaseDescriptor.mjs`): read directly. `publisherWireContractImportProof.mjs`
//   imports `releasePublish.mjs` directly, which imports `releaseDescriptor.mjs`
//   directly, which imports `releaseWireContract.ts` directly -- confirming
//   the `publisher-node-import` terminus the doc names. Independently,
//   `tests/e2e/release/fixtures/managedReleaseFixture.mjs` (already
//   `managed-updates`-owned; grepped as the only fixture imported by every
//   `managedUpdates*`/`managedReleaseDataCompatibility` spec except
//   `managedUpdatesControllerArtifactIdentity.spec.ts`, which uses
//   `controllerArtifactIdentityFixture.mjs` instead) imports
//   `publishManagedRelease` from `releasePublish.mjs` directly. So changing
//   either `releasePublish.mjs` or `releaseDescriptor.mjs` genuinely affects
//   both the `publisher-node-import` proof and the `managed-updates` runtime
//   fixture -- confirming the doc's "Publisher boundary" relation exactly:
//   `managed-updates + publisher-node-import`, never the other four.
//
// Contract B -- proof/type files are not release inputs:
// - `scripts/release/validateReleaseConfig.test.mjs`,
//   `managedUpdatesProof.test.mjs`, and
//   `runManagedReleaseDataCompatibilityProof.test.mjs` are ordinary Vitest
//   unit tests of their `.mjs` siblings' pure logic; none is invoked by any
//   `RELEASE_CHECK_COMMANDS` entry, so none inherits its sibling's release
//   consumer set.
// - `tests/e2e/release/fixtures/managedReleaseFixture.test.mjs` (read
//   directly) imports only `materializeManagedRelease`/
//   `mutateControllerWorkerBytes` from `managedReleaseFixture.mjs` under
//   Vitest, never runs through a release Playwright spec, so it does not map
//   to `managed-updates`.
// - `controllerArtifactIdentityFixture.d.mts`, `managedReleaseFixture.d.mts`,
//   and `ordinaryBranchArtifactFixture.d.mts` (all read directly) are pure
//   `export declare function ...` / `export type ...` ambient declarations
//   with zero executable statements. `managedReleaseFixture.test.mjs`'s own
//   import (read directly) resolves to the `.mjs` sibling, never the
//   `.d.mts` file -- confirming no runtime spec or `.mjs` orchestrator ever
//   imports a `.d.mts` path, so none of the three inherits its sibling's
//   release consumer set.
// - `scripts/pages/lib/**/*.test.mjs` (representative: `releasePublish.test.mjs`,
//   confirmed existing; `ghPagesBranch.test.mjs`, confirmed existing and
//   deliberately NOT one of the architecture doc's own named examples, to
//   prove the exclusion is a general test-shape rule and not a hand-copied
//   list -- see "Must reject" below) must not inherit the broad
//   `scripts/pages/lib/` full-lane prefix fallback.
// - Must reject (bounded-audit sensitivity, beyond the architecture doc's own
//   example set): `scripts/pages/lib/ghPagesBranch.test.mjs` must also
//   resolve `skip`, proving the exclusion matches file shape
//   (`*.test.mjs`/`*.d.mts`) generally rather than only the doc's named
//   files.
//
// Contract C -- exact-mapping integrity fails closed: `resolveReleasePlan`
// validates mapping-source existence (`fileExists`), duplicate sources, and
// empty check lists before planning, so a broken registry fails `invalid`
// instead of silently dropping ownership via first-match resolution. Per the
// architecture doc ("For independent validation proof, it is acceptable to
// add a narrow test-only mapping override to `resolveReleasePlan()`
// analogous to existing planner test seams") and the established convention
// in `scripts/lib/unitRisk.ts` (`ResolveUnitPlanOptions.fileAsDataMappings`,
// which fully REPLACES `UNIT_FILE_AS_DATA_MAPPINGS` for that call rather than
// appending to it), `resolveReleasePlan()` accepts a test-only option:
//
//   exactMappingsOverride?: readonly { path: string; checks: readonly ReleaseImpactCheck[] }[]
//
// When provided, `exactMappingsOverride` REPLACES the real
// `NARROW_EXACT_MAPPINGS` table entirely for that call (never appends),
// exactly mirroring `fileAsDataMappings`'s replace convention -- this lets a
// test construct a deliberately duplicate/empty-checks table without
// fighting the real (currently valid) registry. `ResolveReleasePlanOptions`
// documents it as test-only surface that production callers must omit.
//
// This whole suite proves a planner correctness contract: given a changed
// file path, does `resolveReleasePlan` select the exact release checks that
// a real `RELEASE_CHECK_COMMANDS` execution chain actually consumes.
//
// New relations beyond those named in the architecture doc:
// none independently confirmed. The publisher-boundary relation
// (`releasePublish.mjs`/`releaseDescriptor.mjs` -> `managed-updates +
// publisher-node-import`) is named by the doc's "Publisher boundary"
// section; this suite independently confirmed it by reading the real
// imports above, as the doc itself required.
//
// `checks` arrays are asserted using this repo's established fixed
// alphabetical (localeCompare) sort convention for both `focused` merges and
// `full` mode (`uniqSorted`, matching `unitRisk.ts`/`mutationTargets.ts`).

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

// This is the accepted current execution corpus from
// docs/testing/verify-release-impact-correction.md, kept local because the
// production inventory module does not exist during the required red phase.
// It is deliberately not derived from releaseRisk.ts or runner output.
interface ReleaseSpecExecutionInventoryForTest {
  readonly artifact: readonly string[];
  readonly releaseSmoke: readonly string[];
  readonly managedUpdates: {
    readonly lifecycle: readonly string[];
    readonly migrationIsolation: readonly string[];
    readonly crossEngine: readonly string[];
    readonly dataCompatibility: readonly string[];
  };
}

const CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY: ReleaseSpecExecutionInventoryForTest = {
  artifact: ['tests/e2e/release/productionArtifactSmoke.spec.ts'],
  releaseSmoke: ['tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts'],
  managedUpdates: {
    lifecycle: [
      'tests/e2e/release/managedUpdatesLifecycle.spec.ts',
      'tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts',
      'tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts',
      'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
      'tests/e2e/release/managedUpdatesRecovery.spec.ts',
      'tests/e2e/release/managedUpdatesVueBootFailure.spec.ts',
      'tests/e2e/release/managedUpdatesRollbackDiagnostics.spec.ts',
    ],
    migrationIsolation: [
      'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
      'tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts',
      'tests/e2e/release/managedUpdatesDevelop.spec.ts',
      'tests/e2e/release/managedUpdatesMigration.spec.ts',
    ],
    crossEngine: ['tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts'],
    dataCompatibility: ['tests/e2e/release/managedReleaseDataCompatibility.spec.ts'],
  },
};

const CURRENT_RELEASE_SPEC_FILES = [
  ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.artifact,
  ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.releaseSmoke,
  ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.managedUpdates.lifecycle,
  ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.managedUpdates.migrationIsolation,
  ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.managedUpdates.crossEngine,
  ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.managedUpdates.dataCompatibility,
];

type ReleasePlanOptionsWithReleaseSpecTestOverrides = ResolveReleasePlanOptions & {
  /** Replacement-only test seam required by the accepted release-spec contract. */
  releaseSpecInventoryOverride?: ReleaseSpecExecutionInventoryForTest;
  /** Replacement-only discovered release-spec list for one resolver call. */
  releaseSpecFilesOverride?: readonly string[];
};

// The two inventory seams are intentionally test-local until production adds
// them. This keeps the red phase contractual (the current resolver ignores
// the options) instead of producing a module-not-found setup failure.
const resolveReleasePlanWithReleaseSpecTestOverrides = resolveReleasePlan;

/**
 * Calls `resolveReleasePlan` with the Contract C test-only
 * `exactMappingsOverride` seam (see file header). It REPLACES the real
 * `NARROW_EXACT_MAPPINGS` table for this call, mirroring `unitRisk.ts`'s
 * `fileAsDataMappings` convention. The local `{ path; checks }[]` type keeps
 * this helper decoupled from `NarrowReleaseMapping`'s exact export shape; the
 * two remain structurally compatible, so no cast is needed.
 * @param changedFiles Changed file paths to resolve a plan for.
 * @param exactMappingsOverride Replacement narrow-mapping table for this call.
 * @returns The resolved release plan.
 */
function resolveWithMappingOverride(
  changedFiles: readonly string[],
  exactMappingsOverride: readonly { path: string; checks: readonly ReleaseImpactCheck[] }[],
) {
  return resolveReleasePlan(changedFiles, { exactMappingsOverride });
}

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

describe('resolveReleasePlan registry self-consistency (invalid mode, Contract C required-source-missing)', () => {
  it('accepts the real registry against the real filesystem with no changed files -> skip, not invalid', () => {
    const plan = resolveReleasePlan([]);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });

  it.each([
    'scripts/release/validateReleaseConfig.mjs',
    'scripts/release/buildArtifact.mjs',
    // scripts/release/buildArtifact.test.mjs is deliberately NOT in this
    // list: it is unit-only proof that mocks every dependency and never
    // invokes the real build pipeline, so it is not a registered narrow
    // mapping.
    'scripts/release/publisherWireContractImportProof.mjs',
    'scripts/release/managedUpdatesProof.mjs',
    'scripts/release/runManagedReleaseDataCompatibilityProof.mjs',
    // Contract A: confirmed real release execution inputs, registered as
    // narrow mappings (see file header).
    'scripts/e2eReleaseContainer.mjs',
    'scripts/playwrightContainer.ts',
    'playwright.release.config.ts',
    'scripts/release/artifactServer.mjs',
    'tests/e2e/helpers.ts',
    'tests/e2e/release/productionArtifactSmoke.spec.ts',
    'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts',
    'src/sw.ts',
    'src/shared/service/appUpdate/releaseWireContract.ts',
    // Exact per-file real fixture ownership (see file header); .d.mts
    // companions are deliberately NOT in this list -- Contract B removes
    // them from NARROW_EXACT_MAPPINGS entirely (declaration-only, never a
    // runtime import).
    'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.mjs',
    'tests/e2e/release/fixtures/managedReleaseFixture.mjs',
    'tests/e2e/release/fixtures/legacyGeneratedWorkboxPwaConfig.ts',
    'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.mjs',
    // Publisher boundary (see file header): registered narrow mappings.
    'scripts/pages/lib/releasePublish.mjs',
    'scripts/pages/lib/releaseDescriptor.mjs',
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

describe('resolveReleasePlan exact-mapping integrity fails closed (Contract C, exactMappingsOverride test seam)', () => {
  // Must reject: a resolver that silently drops a mapped check instead of
  // failing `invalid` before first-match planning. Every case here
  // constructs a deliberately broken override table (see
  // resolveWithMappingOverride's own comment for why this REPLACES rather
  // than appends to the real table).
  it('fails invalid for an empty source path in the mapping table', () => {
    const plan = resolveWithMappingOverride([], [{ path: '', checks: ['release-config'] }]);

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
    expect(plan.reasons.length).toBeGreaterThan(0);
  });

  it('fails invalid for a mapping entry with an empty checks array', () => {
    const plan = resolveWithMappingOverride(
      [],
      [{ path: 'scripts/release/validateReleaseConfig.mjs', checks: [] }],
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });

  it('fails invalid for a duplicate source entry, even when both entries agree on identical checks', () => {
    const plan = resolveWithMappingOverride(
      [],
      [
        { path: 'scripts/release/validateReleaseConfig.mjs', checks: ['release-config'] },
        { path: 'scripts/release/validateReleaseConfig.mjs', checks: ['release-config'] },
      ],
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });

  it('fails invalid for a duplicate source entry with conflicting checks', () => {
    const plan = resolveWithMappingOverride(
      [],
      [
        { path: 'scripts/release/validateReleaseConfig.mjs', checks: ['release-config'] },
        { path: 'scripts/release/validateReleaseConfig.mjs', checks: ['build'] },
      ],
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });

  it('fails invalid for an exact mapping with an impossible runtime check value', () => {
    // Deliberately corrupt a test-only override while preserving the
    // production NarrowReleaseMapping contract as ReleaseImpactCheck[].
    const impossibleChecks = [
      'not-a-real-release-impact-check',
    ] as unknown as readonly ReleaseImpactCheck[];
    const plan = resolveWithMappingOverride(
      ['scripts/release/validateReleaseConfig.mjs'],
      [{ path: 'scripts/release/validateReleaseConfig.mjs', checks: impossibleChecks }],
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });
});

describe('resolveReleasePlan production Vite configuration ownership (Pass E Contract A)', () => {
  it.each([
    'config/plugins/pwa.ts',
    'config/plugins/base.ts',
    'config/alias.ts',
    'config/vueCustomElements.ts',
  ])(
    'selects exactly build, artifact, release-smoke, and managed-updates for the real production Vite input %s',
    (filePath) => {
      // Oracle: vite.config.ts imports these bounded production-build inputs,
      // and buildArtifact.mjs is the release artifact build used by the three
      // Playwright-backed release checks. release-config and publisher import
      // do not consume this build path.
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.checks).toEqual(['artifact', 'build', 'managed-updates', 'release-smoke']);
    },
  );

  it.each([
    'config/plugins/base.test.ts',
    'config/plugins/pwa.test.ts',
    'config/unrelatedRuntimeConfig.ts',
  ])('keeps the non-production config path %s outside release impact', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });
});

describe('resolveReleasePlan release-spec inventory ownership (Pass E Contract B)', () => {
  it('fails invalid when a discovered new release spec is absent from the replacement inventory', () => {
    const unownedSpec = 'tests/e2e/release/newReleaseContract.spec.ts';
    const plan = resolveReleasePlanWithReleaseSpecTestOverrides([unownedSpec], {
      releaseSpecFilesOverride: [...CURRENT_RELEASE_SPEC_FILES, unownedSpec],
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });

  it('fails invalid rather than claiming managed-updates from an unowned managedUpdates filename', () => {
    const unownedSpec = 'tests/e2e/release/managedUpdatesUnowned.spec.ts';
    const plan = resolveReleasePlanWithReleaseSpecTestOverrides([unownedSpec], {
      releaseSpecFilesOverride: [...CURRENT_RELEASE_SPEC_FILES, unownedSpec],
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });

  it('fails invalid when a replacement inventory assigns one real spec to two managed-update groups', () => {
    const duplicatedSpec = 'tests/e2e/release/managedUpdatesLifecycle.spec.ts';
    const duplicateInventory: ReleaseSpecExecutionInventoryForTest = {
      ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY,
      managedUpdates: {
        ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.managedUpdates,
        migrationIsolation: [
          ...CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY.managedUpdates.migrationIsolation,
          duplicatedSpec,
        ],
      },
    };
    const plan = resolveReleasePlanWithReleaseSpecTestOverrides([duplicatedSpec], {
      releaseSpecInventoryOverride: duplicateInventory,
      releaseSpecFilesOverride: CURRENT_RELEASE_SPEC_FILES,
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });

  it('fails invalid when an inventory-owned managed-update spec is missing from the filesystem seam', () => {
    const missingSpec = 'tests/e2e/release/managedUpdatesLifecycle.spec.ts';
    const plan = resolveReleasePlanWithReleaseSpecTestOverrides([missingSpec], {
      fileExists: (filePath) => filePath !== missingSpec,
      releaseSpecInventoryOverride: CURRENT_RELEASE_SPEC_EXECUTION_INVENTORY,
      releaseSpecFilesOverride: CURRENT_RELEASE_SPEC_FILES,
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.checks).toEqual([]);
  });
});

describe('resolveReleasePlan release-spec inventory infrastructure (Pass E)', () => {
  it('fails closed to all six source-impact checks for a changed release-spec inventory module', () => {
    const plan = resolveReleasePlan(['scripts/release/releaseSpecInventory.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });
});

describe('resolveReleasePlan full-lane triggers (real hardcoded paths)', () => {
  it.each([
    'config/tooling.json',
    'vite.config.ts',
    'index.html',
    // Representative real scripts/pages/lib/** runtime implementation file
    // with unknown narrower consumers -- retains fail-closed full per the
    // architecture doc, distinct from releasePublish.mjs/releaseDescriptor.mjs
    // below, which now have their own confirmed exact narrow mapping.
    'scripts/pages/lib/ghPagesBranch.mjs',
    'scripts/verify.ts',
    'scripts/lib/releaseRisk.ts',
  ])('runs full source-impact release proof for a modified %s', (filePath) => {
    const plan = resolveReleasePlan([filePath]);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });

  it('fails closed to full for an unmapped tests/e2e/release/fixtures/** runtime path (no blanket managed-updates directory default)', () => {
    const plan = resolveReleasePlan(['tests/e2e/release/fixtures/someNewFixture.mjs']);

    expect(plan.mode).toBe('full');
    expect(plan.checks).toEqual(ALL_CHECKS_SORTED);
  });
});

describe('resolveReleasePlan version-policy exclusion (skip mode)', () => {
  // Must reject: a resolver that treats a version-policy file as
  // release-source-impact-sensitive merely because it lives under
  // scripts/release/**. release-version is independent PR/release policy,
  // never part of this planner.
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

describe('resolveReleasePlan Contract A -- real release execution inputs select their real consumers', () => {
  it('selects only release-config for validateReleaseConfig.mjs', () => {
    const plan = resolveReleasePlan(['scripts/release/validateReleaseConfig.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['release-config']);
  });

  it('selects artifact, build, managed-updates, and release-smoke for buildArtifact.mjs (every real playwright.release.config.ts webServer consumer, never release-config/publisher-node-import)', () => {
    // buildArtifact.mjs is invoked by playwright.release.config.ts's
    // webServer.command (confirmed by direct read) for every release
    // Playwright spec that boots through that config -- artifact,
    // release-smoke, and managed-updates (managed-updates is not in
    // scripts/verify.ts's ARTIFACT_REUSE_LABELS, confirmed by direct read to
    // be exactly Set(['artifact', 'release-smoke']), so it always
    // re-invokes buildArtifact.mjs itself rather than reusing a prebuilt
    // artifact). release-config and publisher-node-import run as plain
    // `node` invocations and never touch this build path.
    const plan = resolveReleasePlan(['scripts/release/buildArtifact.mjs']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact', 'build', 'managed-updates', 'release-smoke']);
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

  it('selects only managed-updates for runManagedReleaseDataCompatibilityProof.mjs', () => {
    const plan = resolveReleasePlan([
      'scripts/release/runManagedReleaseDataCompatibilityProof.mjs',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['managed-updates']);
  });

  it.each(['scripts/e2eReleaseContainer.mjs', 'scripts/playwrightContainer.ts'])(
    'selects artifact, managed-updates, and release-smoke for the real browser execution runner %s (never the other three)',
    (filePath) => {
      // Both files are the real execution chain every artifact/
      // release-smoke/managed-updates check runs through (see file header).
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.checks).toEqual(['artifact', 'managed-updates', 'release-smoke']);
    },
  );

  it.each(['playwright.release.config.ts', 'scripts/release/artifactServer.mjs'])(
    'selects only artifact, managed-updates, and release-smoke for %s (never all six)',
    (filePath) => {
      // Both are release-Playwright-execution-specific, never consumed by
      // release-config/build/publisher-node-import, so neither belongs in
      // FULL_LANE_EXACT_FILES's full-six mapping.
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.checks).toEqual(['artifact', 'managed-updates', 'release-smoke']);
    },
  );

  it('selects artifact, managed-updates, and release-smoke for tests/e2e/helpers.ts (its confirmed real release-spec importers, never skip)', () => {
    // Grepped every real `from '.*helpers'` import (not mere text mentions)
    // across tests/e2e/release/*.spec.ts: the real importers are
    // productionArtifactSmoke.spec.ts (artifact),
    // firstUserAndReturningUserSmoke.spec.ts (release-smoke), and
    // managedUpdatesActivationUi.spec.ts / managedUpdatesRecovery.spec.ts /
    // managedReleaseDataCompatibility.spec.ts (managed-updates).
    // managedUpdatesCrossEngineLifecycle.spec.ts only mentions
    // "tests/e2e/helpers.ts" in a comment and does not import it.
    const plan = resolveReleasePlan(['tests/e2e/helpers.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact', 'managed-updates', 'release-smoke']);
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
    // Dynamically imported only by vite.config.ts when
    // RELEASE_TEST_LEGACY_PWA_FIXTURE=1 (confirmed by direct read of
    // vite.config.ts), which only managedReleaseFixture.mjs's
    // getLegacyStableTemplate() ever sets (confirmed by direct read). Its
    // one reference from productionArtifactSmoke.spec.ts (confirmed by
    // direct read) asserts this file's ABSENCE from ordinary builds, not a
    // content dependency.
    'tests/e2e/release/fixtures/legacyGeneratedWorkboxPwaConfig.ts',
  ])(
    'selects only managed-updates for the real managed-update-owned fixture path %s',
    (filePath) => {
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.checks).toEqual(['managed-updates']);
    },
  );

  it('selects only artifact for the real artifact-owned fixture path ordinaryBranchArtifactFixture.mjs (never managed-updates)', () => {
    // Confirmed by direct grep: imported ONLY by productionArtifactSmoke.spec.ts
    // (an artifact-owned spec), never by any managed-updates spec.
    const plan = resolveReleasePlan([
      'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.mjs',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.checks).toEqual(['artifact']);
  });

  it('selects both managed-updates and publisher-node-import for releaseWireContract.ts (the real publisher-node-import terminus, plus its real managed-update runtime ownership)', () => {
    // scripts/release/publisherWireContractImportProof.mjs imports
    // scripts/pages/lib/releasePublish.mjs -> releaseDescriptor.mjs ->
    // src/shared/service/appUpdate/releaseWireContract.ts directly
    // (confirmed by direct read of all three files). It is also imported by
    // src/shared/service/appUpdate/contracts.ts, the runtime managed-update
    // boundary.
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

  it.each(['scripts/pages/lib/releasePublish.mjs', 'scripts/pages/lib/releaseDescriptor.mjs'])(
    'selects exactly managed-updates and publisher-node-import for the real publisher-boundary file %s (never the other four; a scripts/pages/lib/ narrow-mapped file must not fall to the broad prefix fallback)',
    (filePath) => {
      // Confirmed by direct read: publisherWireContractImportProof.mjs
      // imports releasePublish.mjs, which imports releaseDescriptor.mjs,
      // directly (publisher-node-import terminus);
      // tests/e2e/release/fixtures/managedReleaseFixture.mjs (a
      // managed-updates-owned fixture imported by every managedUpdates*.spec.ts
      // spec except managedUpdatesControllerArtifactIdentity.spec.ts, which
      // uses a different fixture) imports publishManagedRelease from
      // releasePublish.mjs directly (managed-updates runtime consumer). Both
      // files have their own narrow mapping, so neither falls to the broad
      // scripts/pages/lib/ full-lane prefix fallback.
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('focused');
      expect(plan.checks).toEqual(['managed-updates', 'publisher-node-import']);
    },
  );
});

describe('resolveReleasePlan Contract B -- proof/type-only files are not release inputs', () => {
  it.each([
    'scripts/release/validateReleaseConfig.test.mjs',
    'scripts/release/managedUpdatesProof.test.mjs',
    'scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs',
  ])(
    'selects nothing for the ordinary unit test %s (must not inherit its sibling .mjs release consumer set)',
    (filePath) => {
      // A unit test does not inherit the release consumer set of the
      // implementation it tests (docs/testing/verify-release-impact-correction.md
      // "Proof/type files incorrectly promoted to release inputs").
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('skip');
      expect(plan.checks).toEqual([]);
    },
  );

  it("selects nothing for buildArtifact.test.mjs (unit-only proof that mocks every dependency and never invokes the real build pipeline; must not inherit buildArtifact.mjs's release consumer set)", () => {
    const plan = resolveReleasePlan(['scripts/release/buildArtifact.test.mjs']);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });

  it('selects nothing for managedReleaseFixture.test.mjs (unit proof of materializeManagedRelease/mutateControllerWorkerBytes, never a release Playwright spec; must not trigger the release fixture fallback)', () => {
    // Confirmed by direct read: this file's own imports resolve to the
    // .mjs sibling under Vitest, never a tests/e2e/release/**.spec.ts. Also
    // must not fall into the unmapped-fixture full-lane fallback merely by
    // directory (docs/testing/verify-release-impact-correction.md requires
    // proof/type exclusions to be evaluated before that fallback).
    const plan = resolveReleasePlan(['tests/e2e/release/fixtures/managedReleaseFixture.test.mjs']);

    expect(plan.mode).toBe('skip');
    expect(plan.checks).toEqual([]);
  });

  it.each([
    'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.d.mts',
    'tests/e2e/release/fixtures/managedReleaseFixture.d.mts',
    'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.d.mts',
  ])(
    'selects nothing for the declaration-only fixture companion %s (pure ambient .d.mts, never imported at runtime by any spec or .mjs orchestrator)',
    (filePath) => {
      // Confirmed by direct read: every one of these three files contains
      // only `export declare function ...` / `export type ...` with zero
      // executable statements, and no real spec/.mjs file imports a .d.mts
      // path (confirmed by grep), so none inherits its sibling .mjs's
      // release consumer set.
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('skip');
      expect(plan.checks).toEqual([]);
    },
  );

  it.each([
    'scripts/pages/lib/releasePublish.test.mjs',
    // Must reject (bounded-audit sensitivity): a representative
    // scripts/pages/lib/**/*.test.mjs file that is NOT one of the
    // architecture doc's own named examples, proving the exclusion is a
    // general test-shape rule and not a hand-copied list of examples.
    'scripts/pages/lib/ghPagesBranch.test.mjs',
  ])(
    'selects nothing for the ordinary unit test %s (must not inherit the broad scripts/pages/lib/ full-lane prefix fallback)',
    (filePath) => {
      // Confirmed existing real files (ls scripts/pages/lib/); the
      // proof/type exclusion is evaluated before FULL_LANE_PREFIXES, so
      // neither falls to the broad prefix fallback.
      const plan = resolveReleasePlan([filePath]);

      expect(plan.mode).toBe('skip');
      expect(plan.checks).toEqual([]);
    },
  );
});

describe('resolveReleasePlan excludes unit-only appUpdate proof from the directory-wide managed-updates rule (Must reject: unit test does not inherit release ownership)', () => {
  // Every importer of these three .testUtils.ts files is itself an ordinary
  // Vitest unit test (confirmed by repository-wide grep during test
  // authoring): none is a tests/e2e/release/** spec or a .mjs release
  // orchestrator script, so none is a real release-check input.
  // isAppUpdateRuntimePath excludes isUnitProofOnlyPath to enforce this.
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
  // Must reject: a resolver that consults isPackageJsonRuntimeRelevantChange
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
