import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';
import { isSharedLocalCommandExecutionPath } from './localCommandExecutionRisk.ts';
import { isApplicationViteHarnessInputPath } from './viteBuildRisk.ts';

/**
 * Explicit affected ownership for the release-sensitive `static` leaves that
 * were historically created only as a side effect of literal
 * `pnpm verify --full` (see
 * docs/testing/verify-redesign-final-review-correction.md's "Decision 1"):
 * `release-config`, `build`, `publisher-node-import`, `artifact-static`, and
 * `managed-updates-static`. `release-version` is deliberately excluded from
 * affected selection: PR release-version policy is owned independently by
 * the develop-CI `release-version` job and by literal `pnpm verify --full`
 * (see docs/release.md's "What CI verifies automatically"), so this planner
 * must not select it merely because a version-policy input changed. This is
 * a narrow static-specific resolver derived from explicit file capability/
 * configuration ownership, not a general registry/framework: every trigger
 * below is the exact file (or narrow prefix) the corresponding proof script
 * itself reads, builds from, or validates.
 */

const PACKAGE_JSON_PATH = 'package.json';
const LOCKFILE_PATH = 'pnpm-lock.yaml';

// scripts/release/validateReleaseConfig.mjs's own inputs: the release
// base-path/config it validates, and its own implementation.
const RELEASE_CONFIG_EXACT_FILES: ReadonlySet<string> = new Set([
  'config/tooling.json',
  'scripts/release/validateReleaseConfig.mjs',
]);

// The complete production artifact/build capability: every stable repository
// capability class capable of entering or altering the real Vite production
// artifact that `scripts/release/buildArtifact.mjs` builds and
// `scripts/release/productionArtifactStaticProof.ts` validates (emitted
// JS/manifest/controller worker), so both leaves are selected together (see
// docs/testing/verify-redesign-final-review-architecture-revision-02.md's
// "Shared Vite-backed inputs"). Global/ownerless Vite build and application-
// harness inputs (`vite.config.ts`, `postcss.config.js`, `.browserslistrc`,
// root `tsconfig*.json`, non-test/proof `config/**`, `public/**`,
// `index.html`, `pwa-assets.config.ts`) are owned by the shared
// `isApplicationViteHarnessInputPath` capability rather than duplicated here.
// Ordinary `src/**` production source stays a broad prefix here for the same
// reason the shared capability does not enumerate `config/**` plugins:
// precise narrowing to only the subset actually reachable from the Vite
// entrypoint is not cheaply provable without a dependency graph.
// `NON_PRODUCTION_SUFFIX_PATTERN` below excludes deterministically irrelevant
// unit/story/behavior/visual/browser-integration/performance/test-helper
// files under `src/**`.
const PRODUCTION_ARTIFACT_EXACT_FILES: ReadonlySet<string> = new Set([
  'scripts/release/buildArtifact.mjs',
  'scripts/release/productionArtifactStaticProof.ts',
]);
const PRODUCTION_ARTIFACT_PREFIXES: readonly string[] = ['src/'];

// scripts/release/managedUpdatesControllerArtifactIdentityProof.ts's own
// inputs: the managed controller worker source and every appUpdate
// production source capable of changing its build output, plus its own
// implementation. Precise narrowing to only the subset of appUpdate sources
// that are actually compiled into src/sw.ts is not cheaply provable without
// a second dependency graph, so the complete appUpdate production directory
// is treated as capable of changing worker byte identity (see the
// contract's "when exact narrowing is not cheaply provable, use a broader
// explicit static path capability rather than dependency inference").
const MANAGED_UPDATES_STATIC_EXACT_FILES: ReadonlySet<string> = new Set([
  'src/sw.ts',
  'scripts/release/managedUpdatesControllerArtifactIdentityProof.ts',
]);
const MANAGED_UPDATES_STATIC_PREFIXES: readonly string[] = ['src/shared/service/appUpdate/'];
const NON_PRODUCTION_SUFFIX_PATTERN = /\.(test|spec|stories|testUtils)\.(ts|tsx|vue|mjs|js|jsx)$/;

// scripts/release/publisherWireContractImportProof.mjs's own real import
// chain: the production publisher module, its descriptor helper, the
// canonical release wire contract it proves Node can load without a
// loader, and its own implementation.
const PUBLISHER_NODE_IMPORT_EXACT_FILES: ReadonlySet<string> = new Set([
  'scripts/pages/lib/releasePublish.mjs',
  'scripts/pages/lib/releaseDescriptor.mjs',
  'src/shared/service/appUpdate/releaseWireContract.ts',
  'scripts/release/publisherWireContractImportProof.mjs',
]);

function isManagedUpdatesStaticProductionPath(filePath: string): boolean {
  return (
    MANAGED_UPDATES_STATIC_PREFIXES.some((prefix) => filePath.startsWith(prefix)) &&
    !NON_PRODUCTION_SUFFIX_PATTERN.test(filePath)
  );
}

function isProductionArtifactPath(filePath: string): boolean {
  return (
    PRODUCTION_ARTIFACT_EXACT_FILES.has(filePath) ||
    isApplicationViteHarnessInputPath(filePath) ||
    (PRODUCTION_ARTIFACT_PREFIXES.some((prefix) => filePath.startsWith(prefix)) &&
      !NON_PRODUCTION_SUFFIX_PATTERN.test(filePath))
  );
}

/** Resolved release-sensitive static plan, discriminated by `mode`. */
export interface ReleaseStaticPlan {
  mode: 'skip' | 'focused';
  releaseConfig: boolean;
  build: boolean;
  publisherNodeImport: boolean;
  artifactStatic: boolean;
  managedUpdatesStatic: boolean;
  reasons: string[];
}

/** Resolution options for {@link resolveReleaseStaticPlan}. */
export interface ResolveReleaseStaticPlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only refinement. `null` fails closed to runtime-relevant.
   */
  packageJsonOldRef?: string | null;
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/**
 * Resolve which release-sensitive `static` leaves a changed-file set makes
 * relevant, from explicit file capability/configuration ownership. Runtime-
 * relevant `package.json` changes and `pnpm-lock.yaml` changes widen every
 * build-derived leaf (`build`, `artifact-static`, `managed-updates-static`)
 * safely; a confirmed version-only `package.json` change selects no
 * release-sensitive static leaf, since PR release-version policy is owned
 * independently by the develop-CI `release-version` job and by literal
 * `pnpm verify --full`.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns The resolved {@link ReleaseStaticPlan}.
 */
export function resolveReleaseStaticPlan(
  changedFiles: readonly string[],
  { packageJsonOldRef = null }: ResolveReleaseStaticPlanOptions = {},
): ReleaseStaticPlan {
  let releaseConfig = false;
  let build = false;
  let publisherNodeImport = false;
  let artifactStatic = false;
  let managedUpdatesStatic = false;
  const reasons: string[] = [];

  for (const filePath of changedFiles) {
    if (RELEASE_CONFIG_EXACT_FILES.has(filePath)) {
      releaseConfig = true;
      reasons.push(`release-config input ${filePath} -> release-config`);
    }

    if (isProductionArtifactPath(filePath)) {
      build = true;
      artifactStatic = true;
      reasons.push(`production artifact/build input ${filePath} -> build, artifact-static`);
    }

    if (PUBLISHER_NODE_IMPORT_EXACT_FILES.has(filePath)) {
      publisherNodeImport = true;
      reasons.push(`publisher import-boundary input ${filePath} -> publisher-node-import`);
    }

    if (
      MANAGED_UPDATES_STATIC_EXACT_FILES.has(filePath) ||
      isManagedUpdatesStaticProductionPath(filePath)
    ) {
      build = true;
      artifactStatic = true;
      managedUpdatesStatic = true;
      reasons.push(
        `managed controller/appUpdate input ${filePath} -> build, artifact-static, managed-updates-static`,
      );
    }

    if (isSharedLocalCommandExecutionPath(filePath)) {
      build = true;
      artifactStatic = true;
      managedUpdatesStatic = true;
      reasons.push(
        `shared local-command execution input ${filePath} -> build, artifact-static, managed-updates-static`,
      );
    }
  }

  const packageJsonChanged = changedFiles.includes(PACKAGE_JSON_PATH);

  if (packageJsonChanged && isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef })) {
    build = true;
    artifactStatic = true;
    managedUpdatesStatic = true;
    reasons.push(
      'runtime-relevant package.json change -> build, artifact-static, managed-updates-static',
    );
  }

  const lockfileHit = changedFiles.includes(LOCKFILE_PATH);

  if (lockfileHit) {
    build = true;
    artifactStatic = true;
    managedUpdatesStatic = true;
    reasons.push(
      `build/lock tooling change ${LOCKFILE_PATH} -> build, artifact-static, managed-updates-static`,
    );
  }

  const mode: ReleaseStaticPlan['mode'] =
    releaseConfig || build || publisherNodeImport || artifactStatic || managedUpdatesStatic
      ? 'focused'
      : 'skip';

  return {
    mode,
    releaseConfig,
    build,
    publisherNodeImport,
    artifactStatic,
    managedUpdatesStatic,
    reasons: mode === 'skip' ? ['no release-sensitive static changes'] : uniqSorted(reasons),
  };
}
