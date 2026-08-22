import fs from 'node:fs';
import path from 'node:path';

import {
  RELEASE_SPEC_EXECUTION_INVENTORY,
  type ReleaseSpecExecutionInventory,
} from '../release/releaseSpecInventory.ts';
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

const RELEASE_IMPACT_CHECK_SET = new Set<ReleaseImpactCheck>(RELEASE_IMPACT_CHECKS);

/**
 * One exact `changed file path -> release checks` ownership entry. Exported
 * only so {@link ResolveReleasePlanOptions.exactMappingsOverride} can be
 * constructed with a structurally compatible shape from tests; production
 * callers never construct this directly.
 */
export interface NarrowReleaseMapping {
  path: string;
  checks: readonly ReleaseImpactCheck[];
}

// Exact direct release-proof/config-source ownership, verified against real
// repository files. Self-validated below (every path must exist, every path
// is unique, every checks list is non-empty).
const NARROW_EXACT_MAPPINGS: readonly NarrowReleaseMapping[] = [
  { path: 'scripts/release/validateReleaseConfig.mjs', checks: ['release-config'] },
  // validateReleaseConfig.test.mjs is deliberately NOT mapped here: it is
  // ordinary Vitest unit proof of validateReleaseConfig.mjs's pure logic and
  // is never invoked by any RELEASE_CHECK_COMMANDS entry, so it does not
  // inherit its sibling's release consumer set (Contract B). It resolves
  // via isProofOrDeclarationOnlyPath below instead.
  //
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
  // buildArtifact.test.mjs is deliberately NOT mapped here: it only
  // imports buildArtifact.mjs's pure functions and injects mocked deps,
  // never invoking the real build pipeline, so it does not inherit
  // buildArtifact.mjs's release consumer set -- see isAppUpdateRuntimePath's
  // sibling exclusion below for the same "unit proof is not a release input"
  // principle.
  {
    path: 'scripts/release/publisherWireContractImportProof.mjs',
    checks: ['publisher-node-import'],
  },
  { path: 'scripts/release/managedUpdatesProof.mjs', checks: ['managed-updates'] },
  // managedUpdatesProof.test.mjs is deliberately NOT mapped here, for the
  // same Contract B reason as validateReleaseConfig.test.mjs above.
  {
    path: 'scripts/release/runManagedReleaseDataCompatibilityProof.mjs',
    checks: ['managed-updates'],
  },
  // runManagedReleaseDataCompatibilityProof.test.mjs is deliberately NOT
  // mapped here, for the same Contract B reason as above.
  //
  // Real browser-release execution chain (confirmed by direct read of
  // scripts/verify.ts's RELEASE_CHECK_COMMANDS, scripts/e2eReleaseContainer.mjs,
  // and scripts/playwrightContainer.ts): artifact and release-smoke run
  // `pnpm e2e:release`, which this script turns into
  // runPlaywrightInContainer({ config: 'playwright.release.config.ts' }) via
  // playwrightContainer.ts; managed-updates runs managedUpdatesProof.mjs,
  // which shells out to this same script for every one of its groups.
  // release-config, build, and publisher-node-import run as plain `node`
  // invocations and never touch this chain.
  {
    path: 'scripts/e2eReleaseContainer.mjs',
    checks: ['artifact', 'managed-updates', 'release-smoke'],
  },
  {
    path: 'scripts/playwrightContainer.ts',
    checks: ['artifact', 'managed-updates', 'release-smoke'],
  },
  // The exact `config` value passed to runPlaywrightInContainer by every one
  // of the callers above, so it shares the identical consumer set -- never
  // all six.
  {
    path: 'playwright.release.config.ts',
    checks: ['artifact', 'managed-updates', 'release-smoke'],
  },
  // playwright.release.config.ts's webServer.command runs
  // `node scripts/release/buildArtifact.mjs ... && node scripts/release/artifactServer.mjs ...`,
  // so this script shares the same three-check consumer set (never all six).
  {
    path: 'scripts/release/artifactServer.mjs',
    checks: ['artifact', 'managed-updates', 'release-smoke'],
  },
  // Confirmed real importers (grepped every `from '.*helpers'` import across
  // tests/e2e/release/*.spec.ts, not mere text mentions):
  // productionArtifactSmoke.spec.ts (artifact),
  // firstUserAndReturningUserSmoke.spec.ts (release-smoke), and
  // managedUpdatesActivationUi.spec.ts / managedUpdatesRecovery.spec.ts /
  // managedReleaseDataCompatibility.spec.ts (managed-updates).
  { path: 'tests/e2e/helpers.ts', checks: ['artifact', 'managed-updates', 'release-smoke'] },
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
  // directory rule (see isUnmappedReleaseFixturePath below). Declaration-only
  // `.d.mts` companions are deliberately NOT mapped here: they are pure
  // ambient declarations with zero executable statements, and no release
  // spec or `.mjs` orchestrator ever imports a `.d.mts` path -- they resolve
  // via isProofOrDeclarationOnlyPath below instead.
  {
    path: 'tests/e2e/release/fixtures/controllerArtifactIdentityFixture.mjs',
    checks: ['managed-updates'],
  },
  { path: 'tests/e2e/release/fixtures/managedReleaseFixture.mjs', checks: ['managed-updates'] },
  // managedReleaseFixture.test.mjs is deliberately NOT mapped here: it is
  // unit proof of materializeManagedRelease/mutateControllerWorkerBytes
  // under Vitest, never a release Playwright spec (Contract B).
  //
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
  // Publisher boundary: publisherWireContractImportProof.mjs imports
  // releasePublish.mjs directly, which imports releaseDescriptor.mjs
  // directly (publisher-node-import terminus). Independently,
  // tests/e2e/release/fixtures/managedReleaseFixture.mjs (a
  // managed-updates-owned runtime fixture) imports publishManagedRelease
  // from releasePublish.mjs directly, so both files also genuinely affect
  // the managed-updates runtime fixture. Neither file selects the other four
  // checks. Other runtime implementation under scripts/pages/lib/** without
  // a confirmed exact consumer set stays on the FULL_LANE_PREFIXES fallback
  // below.
  {
    path: 'scripts/pages/lib/releasePublish.mjs',
    checks: ['managed-updates', 'publisher-node-import'],
  },
  {
    path: 'scripts/pages/lib/releaseDescriptor.mjs',
    checks: ['managed-updates', 'publisher-node-import'],
  },
];

// Broad release-sensitive infrastructure whose narrower per-consumer
// ownership is not confirmed precisely enough for a safe narrow mapping;
// fails closed to all six source-impact checks rather than skip. Includes
// this resolver's own module and scripts/verify.ts (self-referential
// safety, matching e2eRisk.ts/storybookBehaviorRisk.ts/visualRisk.ts).
// playwright.release.config.ts and scripts/release/artifactServer.mjs are
// deliberately NOT here: they now have their own confirmed exact narrow
// mapping (artifact + managed-updates + release-smoke) above, never all six.
const FULL_LANE_EXACT_FILES = new Set([
  'config/tooling.json',
  'vite.config.ts',
  'index.html',
  'scripts/verify.ts',
  'scripts/lib/releaseRisk.ts',
  'scripts/release/releaseSpecInventory.ts',
]);

// Publisher/retained-release/data-compatibility code under the managed
// publication owner; individual per-file check ownership is not confirmed
// precisely enough for a narrow mapping, so this whole directory fails
// closed to all six -- except the exact narrow-mapped files above
// (releasePublish.mjs / releaseDescriptor.mjs) and ordinary unit-test/
// declaration-only files, both of which resolve before this prefix check.
const FULL_LANE_PREFIXES = ['scripts/pages/lib/'];

const PACKAGE_JSON_PATH = 'package.json';
const PNPM_LOCK_PATH = 'pnpm-lock.yaml';
const RELEASE_SPEC_DIR = 'tests/e2e/release';
const PRODUCTION_VITE_CONFIG_EXACT_FILES = new Set([
  'config/alias.ts',
  'config/vueCustomElements.ts',
]);
const PRODUCTION_VITE_CONFIG_PREFIX = 'config/plugins/';
const PRODUCTION_VITE_CONFIG_CHECKS: readonly ReleaseImpactCheck[] = [
  'artifact',
  'build',
  'managed-updates',
  'release-smoke',
];

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

function findReleaseSpecFiles(): string[] {
  const matchedFiles: string[] = [];
  const pendingDirs: string[] = [RELEASE_SPEC_DIR];

  while (pendingDirs.length > 0) {
    const currentDir = pendingDirs.pop();

    if (currentDir === undefined) {
      continue;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.posix.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        pendingDirs.push(entryPath);
      } else if (entry.isFile() && entryPath.endsWith('.spec.ts')) {
        matchedFiles.push(entryPath);
      }
    }
  }

  return uniqSorted(matchedFiles);
}

interface ReleaseSpecExecutionAssignment {
  spec: string;
  check: ReleaseImpactCheck;
  group: string;
}

function getReleaseSpecExecutionAssignments(
  inventory: ReleaseSpecExecutionInventory,
): ReleaseSpecExecutionAssignment[] {
  return [
    ...inventory.artifact.map((spec) => ({ spec, check: 'artifact' as const, group: 'artifact' })),
    ...inventory.releaseSmoke.map((spec) => ({
      spec,
      check: 'release-smoke' as const,
      group: 'release-smoke',
    })),
    ...inventory.managedUpdates.lifecycle.map((spec) => ({
      spec,
      check: 'managed-updates' as const,
      group: 'managed-updates:lifecycle',
    })),
    ...inventory.managedUpdates.migrationIsolation.map((spec) => ({
      spec,
      check: 'managed-updates' as const,
      group: 'managed-updates:migration-isolation',
    })),
    ...inventory.managedUpdates.crossEngine.map((spec) => ({
      spec,
      check: 'managed-updates' as const,
      group: 'managed-updates:cross-engine',
    })),
    ...inventory.managedUpdates.dataCompatibility.map((spec) => ({
      spec,
      check: 'managed-updates' as const,
      group: 'managed-updates:data-compatibility',
    })),
  ];
}

function isProductionViteConfigPath(filePath: string): boolean {
  return (
    PRODUCTION_VITE_CONFIG_EXACT_FILES.has(filePath) ||
    filePath.startsWith(PRODUCTION_VITE_CONFIG_PREFIX)
  );
}

// Every currently confirmed tests/e2e/release/fixtures/** file has its own
// exact narrow mapping above or resolves via isProofOrDeclarationOnlyPath. A
// path under this directory that reaches this check matched neither: its
// real consumer is not safely bounded, so it must fail closed to full rather
// than default to managed-updates or skip.
function isUnmappedReleaseFixturePath(filePath: string): boolean {
  return filePath.startsWith('tests/e2e/release/fixtures/');
}

// Ordinary Vitest unit proof, test-support, or ambient declaration-only
// shape -- never a real release-check input by itself, regardless of
// directory or sibling ownership (Contract B). Confirmed by
// repository-wide grep: every real importer of every
// src/shared/service/appUpdate/*.testUtils.ts file is itself an ordinary
// *.test.ts/*.test.mjs Vitest file, never a tests/e2e/release/** spec or a
// .mjs release orchestrator script; and no release spec or orchestrator
// ever imports a .d.mts path (ambient declarations have zero executable
// statements).
function isProofOrDeclarationOnlyPath(filePath: string): boolean {
  return (
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.mjs') ||
    filePath.endsWith('.testUtils.ts') ||
    filePath.endsWith('.d.mts')
  );
}

// Managed-update runtime boundary per docs/managed-pinned-updates.md;
// directory-wide, not individually existence-validated. Ordinary unit
// test/test-support/declaration files under this directory are excluded:
// they do not select managed-updates solely from the directory prefix. In
// practice this exclusion is redundant with the loop-level
// isProofOrDeclarationOnlyPath check below (which runs first and already
// `continue`s past this function for such paths), but is kept here so this
// predicate stays correct in isolation.
function isAppUpdateRuntimePath(filePath: string): boolean {
  return (
    filePath.startsWith('src/shared/service/appUpdate/') && !isProofOrDeclarationOnlyPath(filePath)
  );
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
   * self-validate exact mappings and release-spec inventory members.
   * Production callers should omit this.
   */
  fileExists?: (filePath: string) => boolean;
  /**
   * Test-only override that fully REPLACES the real `NARROW_EXACT_MAPPINGS`
   * table for this call (never appends). Production callers must omit this.
   */
  exactMappingsOverride?: readonly NarrowReleaseMapping[];
  /**
   * Test-only inventory that fully REPLACES the production release-spec
   * execution inventory for this call (never appends). Production callers
   * must omit this.
   */
  releaseSpecInventoryOverride?: ReleaseSpecExecutionInventory;
  /**
   * Test-only discovered release-spec list that fully REPLACES the bounded
   * filesystem scan for this call (never appends). Production callers must
   * omit this.
   */
  releaseSpecFilesOverride?: readonly string[];
}

/**
 * Resolve the source-impact release plan for the given changed files, in
 * priority order: invalid (exact mapping or release-spec execution
 * inventory validation failed), then per changed file: exact narrow mapping
 * or inventory-owned release specification (focused), release-sensitive
 * infrastructure / `pnpm-lock.yaml` / runtime-relevant `package.json`
 * (full), proof/declaration-only shape (no impact from that path), the broad
 * publication prefix (full), an unmapped release fixture (full), or the
 * managed-update runtime boundary (focused). A changeset with any
 * `full`-triggering path resolves `full` overall; absent that, any `focused`
 * match resolves `focused`; absent that, `skip`.
 * `release-version` is independent PR/release policy and is never selected
 * here. Release planning uses the flat changed-file projection;
 * deletion-dependent correctness is not required for these checks.
 * @param changedFiles Changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, candidate `checks`, and human-readable `reasons`.
 */
export function resolveReleasePlan(
  changedFiles: readonly string[],
  {
    packageJsonOldRef = null,
    fileExists = isExistingFile,
    exactMappingsOverride,
    releaseSpecInventoryOverride,
    releaseSpecFilesOverride,
  }: ResolveReleasePlanOptions = {},
): ReleasePlan {
  const effectiveMappings = exactMappingsOverride ?? NARROW_EXACT_MAPPINGS;
  const effectiveReleaseSpecInventory =
    releaseSpecInventoryOverride ?? RELEASE_SPEC_EXECUTION_INVENTORY;

  const registryErrors: string[] = [];
  const seenPaths = new Set<string>();
  const duplicatePaths = new Set<string>();

  for (const mapping of effectiveMappings) {
    if (mapping.path === '') {
      registryErrors.push('release-impact mapping has an empty source path');
    } else if (seenPaths.has(mapping.path)) {
      duplicatePaths.add(mapping.path);
    } else {
      seenPaths.add(mapping.path);
    }

    if (mapping.checks.length === 0) {
      registryErrors.push(
        `release-impact mapping for ${mapping.path === '' ? '(empty path)' : mapping.path} has an empty checks list`,
      );
    }

    for (const check of mapping.checks) {
      if (!RELEASE_IMPACT_CHECK_SET.has(check)) {
        registryErrors.push(
          `release-impact mapping for ${mapping.path === '' ? '(empty path)' : mapping.path} references unknown check ${check}`,
        );
      }
    }

    if (mapping.path !== '' && !fileExists(mapping.path)) {
      registryErrors.push(`release-impact mapping references missing path ${mapping.path}`);
    }
  }

  for (const duplicatePath of duplicatePaths) {
    registryErrors.push(`release-impact mapping registers duplicate source path ${duplicatePath}`);
  }

  const releaseSpecChecks = new Map<string, ReleaseImpactCheck>();
  const releaseSpecGroups = new Map<string, string>();

  for (const assignment of getReleaseSpecExecutionAssignments(effectiveReleaseSpecInventory)) {
    const existingGroup = releaseSpecGroups.get(assignment.spec);

    if (existingGroup !== undefined) {
      registryErrors.push(
        `release spec inventory assigns ${assignment.spec} to multiple execution groups: ${existingGroup}, ${assignment.group}`,
      );
      continue;
    }

    releaseSpecGroups.set(assignment.spec, assignment.group);
    releaseSpecChecks.set(assignment.spec, assignment.check);

    if (!fileExists(assignment.spec)) {
      registryErrors.push(`release spec inventory references missing path ${assignment.spec}`);
    }
  }

  let effectiveReleaseSpecFiles: readonly string[] = [];
  let releaseSpecPopulationAvailable = true;

  if (releaseSpecFilesOverride !== undefined) {
    effectiveReleaseSpecFiles = releaseSpecFilesOverride;
  } else {
    try {
      effectiveReleaseSpecFiles = findReleaseSpecFiles();
    } catch (error) {
      releaseSpecPopulationAvailable = false;
      registryErrors.push(
        `unable to list ${RELEASE_SPEC_DIR}/**/*.spec.ts: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (releaseSpecPopulationAvailable) {
    const discoveredReleaseSpecs = new Set<string>();

    for (const spec of effectiveReleaseSpecFiles) {
      if (discoveredReleaseSpecs.has(spec)) {
        registryErrors.push(`release spec scan contains duplicate path ${spec}`);
      } else {
        discoveredReleaseSpecs.add(spec);
      }
    }

    for (const spec of releaseSpecChecks.keys()) {
      if (!discoveredReleaseSpecs.has(spec)) {
        registryErrors.push(
          `release spec inventory references path outside ${RELEASE_SPEC_DIR}/**/*.spec.ts ${spec}`,
        );
      }
    }

    for (const spec of discoveredReleaseSpecs) {
      if (!releaseSpecChecks.has(spec)) {
        registryErrors.push(`release spec ${spec} is not assigned to an executing release check`);
      }
    }
  }

  if (registryErrors.length > 0) {
    return { mode: 'invalid', checks: [], reasons: uniqSorted(registryErrors) };
  }

  const fullReasons: string[] = [];
  const focusedChecks = new Set<ReleaseImpactCheck>();
  const focusedReasons: string[] = [];

  for (const filePath of changedFiles) {
    const narrowMapping = effectiveMappings.find((mapping) => mapping.path === filePath);

    if (narrowMapping) {
      for (const check of narrowMapping.checks) {
        focusedChecks.add(check);
      }

      focusedReasons.push(`release proof source ${filePath} -> ${narrowMapping.checks.join(', ')}`);
      continue;
    }

    if (FULL_LANE_EXACT_FILES.has(filePath)) {
      fullReasons.push(
        `release-sensitive infrastructure path ${filePath} -> full source-impact release proof`,
      );
      continue;
    }

    if (isProofOrDeclarationOnlyPath(filePath)) {
      continue;
    }

    const releaseSpecCheck = releaseSpecChecks.get(filePath);

    if (releaseSpecCheck !== undefined) {
      focusedChecks.add(releaseSpecCheck);
      focusedReasons.push(`release spec ${filePath} -> ${releaseSpecCheck}`);
      continue;
    }

    if (isProductionViteConfigPath(filePath)) {
      for (const check of PRODUCTION_VITE_CONFIG_CHECKS) {
        focusedChecks.add(check);
      }

      focusedReasons.push(
        `production Vite configuration path ${filePath} -> ${PRODUCTION_VITE_CONFIG_CHECKS.join(', ')}`,
      );
      continue;
    }

    if (FULL_LANE_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
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

    if (isUnmappedReleaseFixturePath(filePath)) {
      fullReasons.push(
        `unmapped release fixture path ${filePath} -> full source-impact release proof`,
      );
      continue;
    }

    if (isAppUpdateRuntimePath(filePath)) {
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
