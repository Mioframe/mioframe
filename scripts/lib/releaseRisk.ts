import fs from 'node:fs';

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';

/** One of the six existing source-impact release contracts. `release-version` is independent PR/release policy, not source-impact, and is deliberately excluded. */
export type ReleaseImpactCheck =
  | 'release-config'
  | 'build'
  | 'publisher-node-import'
  | 'artifact'
  | 'release-smoke'
  | 'managed-updates';

/** The six source-impact release checks, in declaration order. */
export const RELEASE_IMPACT_CHECKS: readonly ReleaseImpactCheck[] = [
  'release-config',
  'build',
  'publisher-node-import',
  'artifact',
  'release-smoke',
  'managed-updates',
];

interface NarrowReleaseMapping {
  path: string;
  checks: readonly ReleaseImpactCheck[];
}

// Exact direct release-proof/config-source ownership, verified against real
// repository files. Self-validated below (every path must exist).
const NARROW_EXACT_MAPPINGS: readonly NarrowReleaseMapping[] = [
  { path: 'scripts/release/validateReleaseConfig.mjs', checks: ['release-config'] },
  { path: 'scripts/release/validateReleaseConfig.test.mjs', checks: ['release-config'] },
  // Invoked by playwright.release.config.ts's webServer.command for every
  // release Playwright spec that boots through that config: artifact,
  // release-smoke, and managed-updates (managed-updates is never in
  // ARTIFACT_REUSE_LABELS in scripts/verify.ts, so it always re-invokes this
  // script itself rather than reusing a prebuilt artifact). release-config
  // and publisher-node-import run as plain `node` invocations and never
  // touch this build path.
  {
    path: 'scripts/release/buildArtifact.mjs',
    checks: ['artifact', 'build', 'managed-updates', 'release-smoke'],
  },
  {
    path: 'scripts/release/buildArtifact.test.mjs',
    checks: ['artifact', 'build', 'managed-updates', 'release-smoke'],
  },
  {
    path: 'scripts/release/publisherWireContractImportProof.mjs',
    checks: ['publisher-node-import'],
  },
  { path: 'scripts/release/managedUpdatesProof.mjs', checks: ['managed-updates'] },
  { path: 'scripts/release/managedUpdatesProof.test.mjs', checks: ['managed-updates'] },
  {
    path: 'scripts/release/runManagedReleaseDataCompatibilityProof.mjs',
    checks: ['managed-updates'],
  },
  {
    path: 'scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs',
    checks: ['managed-updates'],
  },
  { path: 'tests/e2e/release/productionArtifactSmoke.spec.ts', checks: ['artifact'] },
  { path: 'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts', checks: ['release-smoke'] },
  // Artifact-facing worker: affects both the built controller artifact
  // contract and managed-update runtime lifecycle.
  { path: 'src/sw.ts', checks: ['artifact', 'managed-updates'] },
  // Terminates both the proven plain-Node publisher import chain
  // (publisherWireContractImportProof.mjs -> releasePublish.mjs ->
  // releaseDescriptor.mjs -> this file) and the runtime managed-update
  // boundary (imported by src/shared/service/appUpdate/contracts.ts).
  {
    path: 'src/shared/service/appUpdate/releaseWireContract.ts',
    checks: ['managed-updates', 'publisher-node-import'],
  },
  // Exact per-file release-fixture ownership, traced against real spec
  // importers -- deliberately not a blanket tests/e2e/release/fixtures/**
  // directory rule (see isUnmappedReleaseFixturePath below).
  {
    path: 'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.mjs',
    checks: ['managed-updates'],
  },
  {
    path: 'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.d.mts',
    checks: ['managed-updates'],
  },
  { path: 'tests/e2e/release/fixtures/managedReleaseFixture.mjs', checks: ['managed-updates'] },
  { path: 'tests/e2e/release/fixtures/managedReleaseFixture.d.mts', checks: ['managed-updates'] },
  {
    path: 'tests/e2e/release/fixtures/managedReleaseFixture.test.mjs',
    checks: ['managed-updates'],
  },
  // Dynamically imported only by vite.config.ts when
  // RELEASE_TEST_LEGACY_PWA_FIXTURE=1, which only managedReleaseFixture.mjs
  // (a managed-updates-only consumer) ever sets. productionArtifactSmoke's
  // one reference to this name is a literal string asserting its absence
  // from ordinary builds, not a content dependency.
  {
    path: 'tests/e2e/release/fixtures/legacyGeneratedWorkboxPwaConfig.ts',
    checks: ['managed-updates'],
  },
  // Imported only by productionArtifactSmoke.spec.ts, never by any
  // managed-updates spec.
  { path: 'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.mjs', checks: ['artifact'] },
  {
    path: 'tests/e2e/release/fixtures/ordinaryBranchArtifactFixture.d.mts',
    checks: ['artifact'],
  },
];

// Broad release-sensitive infrastructure whose narrower per-consumer
// ownership is not confirmed precisely enough for a safe narrow mapping;
// fails closed to all six source-impact checks rather than skip. Includes
// this resolver's own module and scripts/verify.ts (self-referential
// safety, matching e2eRisk.ts/storybookBehaviorRisk.ts/visualRisk.ts).
const FULL_LANE_EXACT_FILES = new Set([
  'config/tooling.json',
  'vite.config.ts',
  'playwright.release.config.ts',
  'index.html',
  'scripts/release/artifactServer.mjs',
  'scripts/verify.ts',
  'scripts/lib/releaseRisk.ts',
]);

// Publisher/retained-release/data-compatibility code under the managed
// publication owner; individual per-file check ownership is not confirmed
// precisely enough for a narrow mapping, so this whole directory fails
// closed to all six.
const FULL_LANE_PREFIXES = ['scripts/pages/lib/'];

const PACKAGE_JSON_PATH = 'package.json';
const PNPM_LOCK_PATH = 'pnpm-lock.yaml';

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function uniqSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

// Managed-update release proof: every managedUpdates*.spec.ts and the data
// compatibility spec run through the single scripts/release/managedUpdatesProof.mjs
// orchestrator (confirmed); directory-wide, not individually existence-validated.
function isManagedUpdatesReleaseSpecPath(filePath: string): boolean {
  if (filePath === 'tests/e2e/release/managedReleaseDataCompatibility.spec.ts') {
    return true;
  }

  return filePath.startsWith('tests/e2e/release/managedUpdates') && filePath.endsWith('.spec.ts');
}

// Every currently confirmed tests/e2e/release/fixtures/** file has its own
// exact narrow mapping above. A path under this directory that reaches this
// check matched none of them: its real consumer is not safely bounded, so it
// must fail closed to full rather than default to managed-updates or skip.
function isUnmappedReleaseFixturePath(filePath: string): boolean {
  return filePath.startsWith('tests/e2e/release/fixtures/');
}

// Managed-update runtime boundary per docs/managed-pinned-updates.md;
// directory-wide, not individually existence-validated.
function isAppUpdateRuntimePath(filePath: string): boolean {
  return filePath.startsWith('src/shared/service/appUpdate/');
}

/** Resolved source-impact release plan, discriminated by `mode`. `full` means all six {@link RELEASE_IMPACT_CHECKS}, never `release-version`. */
export type ReleasePlan =
  | { mode: 'skip'; checks: ReleaseImpactCheck[]; reasons: string[] }
  | { mode: 'focused'; checks: ReleaseImpactCheck[]; reasons: string[] }
  | { mode: 'full'; checks: ReleaseImpactCheck[]; reasons: string[] }
  | { mode: 'invalid'; checks: ReleaseImpactCheck[]; reasons: string[] };

/** Options for {@link resolveReleasePlan}. */
export interface ResolveReleasePlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only release impact refinement. Pass `null` when no reliable
   * base ref is known; that fails closed to runtime-relevant (full).
   */
  packageJsonOldRef?: string | null;
  /**
   * Test-only override for file-existence checks, used only to
   * self-validate the exact narrow-mapping table. Production callers should
   * omit this.
   */
  fileExists?: (filePath: string) => boolean;
}

/**
 * Resolve the source-impact release plan for the given changed files, in
 * priority order: invalid (narrow mapping table self-validation failed),
 * full (release-sensitive infrastructure, `pnpm-lock.yaml`, or a
 * runtime-relevant/unresolvable `package.json` change), focused (a changed
 * file exactly matches a narrow release-proof/config mapping or the
 * managed-update release/runtime boundary), or skip (no release-sensitive
 * changes). `release-version` is independent PR/release policy and is never
 * selected here. Release planning uses the flat changed-file projection;
 * deletion-dependent correctness is not required for these checks.
 * @param changedFiles Changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, candidate `checks`, and human-readable `reasons`.
 */
export function resolveReleasePlan(
  changedFiles: readonly string[],
  { packageJsonOldRef = null, fileExists = isExistingFile }: ResolveReleasePlanOptions = {},
): ReleasePlan {
  const registryErrors = NARROW_EXACT_MAPPINGS.filter((mapping) => !fileExists(mapping.path)).map(
    (mapping) => `release-impact mapping references missing path ${mapping.path}`,
  );

  if (registryErrors.length > 0) {
    return { mode: 'invalid', checks: [], reasons: uniqSorted(registryErrors) };
  }

  const fullReasons: string[] = [];
  const focusedChecks = new Set<ReleaseImpactCheck>();
  const focusedReasons: string[] = [];

  for (const filePath of changedFiles) {
    if (
      FULL_LANE_EXACT_FILES.has(filePath) ||
      FULL_LANE_PREFIXES.some((prefix) => filePath.startsWith(prefix))
    ) {
      fullReasons.push(
        `release-sensitive infrastructure path ${filePath} -> full source-impact release proof`,
      );
      continue;
    }

    if (filePath === PNPM_LOCK_PATH) {
      fullReasons.push(`${PNPM_LOCK_PATH} changed -> full source-impact release proof`);
      continue;
    }

    if (filePath === PACKAGE_JSON_PATH) {
      if (isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef })) {
        fullReasons.push(
          'runtime-relevant package.json change -> full source-impact release proof',
        );
      }

      continue;
    }

    const narrowMapping = NARROW_EXACT_MAPPINGS.find((mapping) => mapping.path === filePath);

    if (narrowMapping) {
      for (const check of narrowMapping.checks) {
        focusedChecks.add(check);
      }

      focusedReasons.push(`release proof source ${filePath} -> ${narrowMapping.checks.join(', ')}`);
      continue;
    }

    if (isUnmappedReleaseFixturePath(filePath)) {
      fullReasons.push(
        `unmapped release fixture path ${filePath} -> full source-impact release proof`,
      );
      continue;
    }

    if (isManagedUpdatesReleaseSpecPath(filePath) || isAppUpdateRuntimePath(filePath)) {
      focusedChecks.add('managed-updates');
      focusedReasons.push(`managed-update release-relevant path ${filePath} -> managed-updates`);
    }
  }

  if (fullReasons.length > 0) {
    return {
      mode: 'full',
      checks: uniqSorted(RELEASE_IMPACT_CHECKS),
      reasons: uniqSorted(fullReasons),
    };
  }

  if (focusedChecks.size > 0) {
    return {
      mode: 'focused',
      checks: uniqSorted([...focusedChecks]),
      reasons: uniqSorted(focusedReasons),
    };
  }

  return { mode: 'skip', checks: [], reasons: ['no release-sensitive changes'] };
}
