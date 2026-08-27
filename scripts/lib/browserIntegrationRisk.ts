/**
 * Owner-local planning for the browser-integration verification type: the
 * managed-update proof and the generic owner-local
 * `browser-integration-local` leaf. Reuses the existing `artifact`
 * and `managed-updates-browser-integration` verifier leaves/orchestration
 * (`scripts/release/managedUpdatesProof.ts`, `scripts/e2eReleaseContainer.mjs`,
 * `playwright.release.config.ts`) for the managed-update proof, and the
 * generic `playwright.browserIntegration.config.ts` / `scripts/browserIntegration.ts`
 * for every other owner-local `*.browser-integration.spec.ts`; this module
 * only decides which leaves a changed-file set makes relevant, so `--only
 * browser-integration` and ordinary default `pnpm verify` recognize a direct
 * owner-local spec change without requiring `--full`.
 */

import fs from 'node:fs';
import path from 'node:path';

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';
import { isSharedPlaywrightExecutionInfrastructurePath } from './playwrightExecutionRisk.ts';
import { isApplicationViteHarnessInputPath } from './viteBuildRisk.ts';
import {
  MANAGED_UPDATES_BROWSER_INTEGRATION_SPEC_SET,
  PRODUCTION_ARTIFACT_SMOKE_SPEC,
  validateBrowserIntegrationMembership,
} from './releaseProofInventory.ts';

const APP_UPDATE_DIR = 'src/shared/service/appUpdate/';
const BROWSER_INTEGRATION_SUFFIX = '.browser-integration.spec.ts';
const GENERIC_BROWSER_INTEGRATION_ROOT = 'src';
const PACKAGE_JSON_PATH = 'package.json';

export { PRODUCTION_ARTIFACT_SMOKE_SPEC };

// Broad blast-radius paths: the release Playwright config/container runner,
// the shared managed-release fixture/publisher/artifact build support the
// managed-update corpus exercises, the managed-update group/orchestration
// definition, this resolver's own module, and the verifier planner entry
// point. A change here can affect every browser-integration spec, so it
// always triggers both leaves instead of relying on path-based ownership.
// The shared Playwright command/lock/result/signal execution boundary is a
// separate authoritative source of truth, checked by
// {@link isFullBrowserIntegrationLanePath} below rather than duplicated
// here, since it widens relevance across every Playwright-container-backed
// type, not only browser-integration.
const FULL_LANE_EXACT_FILES = new Set([
  'playwright.release.config.ts',
  'scripts/e2eReleaseContainer.mjs',
  'scripts/release/artifactServer.mjs',
  'scripts/release/managedUpdatesProof.ts',
  'scripts/lib/browserIntegrationRisk.ts',
  'scripts/lib/releaseProofInventory.ts',
  'scripts/verify.ts',
]);
const FULL_LANE_PREFIXES = ['tests/e2e/release/fixtures/', 'scripts/pages/lib/'];

/**
 * Check whether a changed file is a colocated `*.browser-integration.spec.ts`
 * file directly under the appUpdate owner directory.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an appUpdate browser-integration spec.
 */
export function isAppUpdateBrowserIntegrationSpecPath(filePath: string): boolean {
  return (
    filePath.startsWith(APP_UPDATE_DIR) &&
    filePath.endsWith(BROWSER_INTEGRATION_SUFFIX) &&
    !filePath.slice(APP_UPDATE_DIR.length, -BROWSER_INTEGRATION_SUFFIX.length).includes('/')
  );
}

/**
 * Check whether a changed file is an appUpdate production source file: not a
 * browser-integration spec, not a Vitest unit test/test helper. Its impact
 * on the browser-integration groups cannot be safely narrowed by path alone,
 * so it selects both leaves.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an appUpdate production source file.
 */
export function isAppUpdateProductionPath(filePath: string): boolean {
  return (
    filePath.startsWith(APP_UPDATE_DIR) &&
    filePath.endsWith('.ts') &&
    !filePath.endsWith(BROWSER_INTEGRATION_SUFFIX) &&
    !filePath.endsWith('.test.ts') &&
    !filePath.endsWith('.testUtils.ts')
  );
}

/**
 * Check whether a changed file is a broad blast-radius path that must
 * trigger both browser-integration leaves regardless of path-based
 * ownership.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is browser-integration infrastructure risk.
 */
export function isFullBrowserIntegrationLanePath(filePath: string): boolean {
  return (
    isSharedPlaywrightExecutionInfrastructurePath(filePath) ||
    isApplicationViteHarnessInputPath(filePath) ||
    FULL_LANE_EXACT_FILES.has(filePath) ||
    FULL_LANE_PREFIXES.some((prefix) => filePath.startsWith(prefix))
  );
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/** Resolved managed-update browser-integration plan. */
export interface BrowserIntegrationPlan {
  mode: 'invalid' | 'skip' | 'focused' | 'full';
  /** Whether the `artifact` leaf (productionArtifactSmoke) is relevant. */
  artifact: boolean;
  /** Whether the `managed-updates-browser-integration` leaf is relevant. */
  managedUpdates: boolean;
  reasons: string[];
}

/** Resolution options for {@link resolveBrowserIntegrationPlan}. */
export interface ResolveBrowserIntegrationPlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only refinement. `null` fails closed to runtime-relevant.
   */
  packageJsonOldRef?: string | null;
  /** Test-only override for the exceptional-inventory membership check. */
  validateMembership?: typeof validateBrowserIntegrationMembership;
  /**
   * Literal `--full`: run the complete managed-update browser-integration
   * lane unconditionally, skipping changed-file-based selection. Exceptional
   * membership validation still runs first: `releaseProofInventory.ts` is
   * the sole owner of the exceptional managed-update inventory, and every
   * execution path — including literal `--full` — validates against it, so
   * an unregistered special spec still fails closed under literal `--full`
   * instead of being silently swept in or omitted.
   */
  fullMode?: boolean;
}

/**
 * Resolve which managed-update browser-integration leaves a changed-file set
 * makes relevant, in priority order: invalid (the current appUpdate
 * browser-integration filesystem inventory does not exactly equal the
 * registered exceptional inventory in `scripts/lib/releaseProofInventory.ts`
 * — a structural problem that must fail closed instead of silently
 * widening/narrowing, checked before literal `--full` too), full (literal
 * `--full`, or broad infrastructure/shared-support risk, or a
 * runtime-relevant `package.json` change, both leaves), focused (a direct
 * appUpdate browser-integration spec change and/or an unresolvable appUpdate
 * production change, either or both leaves), or skip (no relevant changes).
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, per-leaf relevance, and human-readable `reasons`.
 */
export function resolveBrowserIntegrationPlan(
  changedFiles: readonly string[],
  {
    packageJsonOldRef = null,
    validateMembership = validateBrowserIntegrationMembership,
    fullMode = false,
  }: ResolveBrowserIntegrationPlanOptions = {},
): BrowserIntegrationPlan {
  const membershipValidation = validateMembership();

  if (!membershipValidation.valid) {
    return {
      mode: 'invalid',
      artifact: false,
      managedUpdates: false,
      reasons: membershipValidation.errors,
    };
  }

  if (fullMode) {
    return {
      mode: 'full',
      artifact: true,
      managedUpdates: true,
      reasons: ['full-project release verification'],
    };
  }

  const fullLaneHit = changedFiles.find(isFullBrowserIntegrationLanePath);

  if (fullLaneHit) {
    return {
      mode: 'full',
      artifact: true,
      managedUpdates: true,
      reasons: [
        `browser-integration infrastructure path ${fullLaneHit} -> full browser-integration lane`,
      ],
    };
  }

  if (
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef })
  ) {
    return {
      mode: 'full',
      artifact: true,
      managedUpdates: true,
      reasons: ['runtime-relevant package.json change -> full browser-integration lane'],
    };
  }

  let artifact = false;
  let managedUpdates = false;
  const reasons: string[] = [];

  for (const filePath of changedFiles) {
    if (filePath === PRODUCTION_ARTIFACT_SMOKE_SPEC) {
      artifact = true;
      reasons.push(`changed browser-integration spec ${filePath} -> artifact`);
      continue;
    }

    if (MANAGED_UPDATES_BROWSER_INTEGRATION_SPEC_SET.has(filePath)) {
      managedUpdates = true;
      reasons.push(
        `changed browser-integration spec ${filePath} -> managed-updates-browser-integration`,
      );
      continue;
    }

    if (isAppUpdateProductionPath(filePath)) {
      artifact = true;
      managedUpdates = true;
      reasons.push(`appUpdate production change ${filePath} -> both browser-integration leaves`);
    }
  }

  if (!artifact && !managedUpdates) {
    return {
      mode: 'skip',
      artifact: false,
      managedUpdates: false,
      reasons: ['empty browser-integration scope'],
    };
  }

  return { mode: 'focused', artifact, managedUpdates, reasons: uniqSorted(reasons) };
}

// Generic owner-local browser-integration infrastructure: a change here can
// affect the complete generic inventory's discovery/execution, so it always
// triggers the full generic inventory instead of relying on path ownership.
// The shared Playwright command/lock/result/signal execution boundary is a
// separate authoritative source of truth, checked directly in
// {@link resolveGenericBrowserIntegrationPlan} below rather than duplicated
// here: the generic public browser-integration inventory must widen on the
// same shared hit as the exceptional inventory, so the complete public
// browser-integration type is selected together.
const GENERIC_FULL_LANE_EXACT_FILES = new Set([
  'playwright.browserIntegration.config.ts',
  'scripts/browserIntegration.ts',
  'scripts/lib/browserIntegrationRisk.ts',
  'scripts/verify.ts',
]);

function isFullGenericBrowserIntegrationLanePath(filePath: string): boolean {
  return (
    isSharedPlaywrightExecutionInfrastructurePath(filePath) ||
    isApplicationViteHarnessInputPath(filePath) ||
    GENERIC_FULL_LANE_EXACT_FILES.has(filePath)
  );
}

/**
 * Check whether a changed file is a generic (non-appUpdate) owner-local
 * `*.browser-integration.spec.ts` file anywhere under `src/**`.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a generic browser-integration spec.
 */
export function isGenericBrowserIntegrationSpecPath(filePath: string): boolean {
  return (
    filePath.startsWith(`${GENERIC_BROWSER_INTEGRATION_ROOT}/`) &&
    !filePath.startsWith(APP_UPDATE_DIR) &&
    filePath.endsWith(BROWSER_INTEGRATION_SUFFIX)
  );
}

function defaultFileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function defaultListFilesRecursively(root: string): string[] {
  const results: string[] = [];

  const walk = (dir: string): void => {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.posix.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  };

  walk(root);

  return results;
}

/** Test-only dependencies for {@link listGenericBrowserIntegrationSpecs}. */
export interface ListGenericBrowserIntegrationSpecsDeps {
  listFilesRecursively?: (root: string) => string[];
}

/**
 * List the complete current generic (non-appUpdate) owner-local
 * `*.browser-integration.spec.ts` inventory.
 * @param [deps] Test-only dependencies.
 * @returns Sorted unique generic browser-integration spec paths.
 */
export function listGenericBrowserIntegrationSpecs({
  listFilesRecursively = defaultListFilesRecursively,
}: ListGenericBrowserIntegrationSpecsDeps = {}): string[] {
  return uniqSorted(
    listFilesRecursively(GENERIC_BROWSER_INTEGRATION_ROOT).filter(
      isGenericBrowserIntegrationSpecPath,
    ),
  );
}

/** Resolved generic owner-local browser-integration plan. */
export interface GenericBrowserIntegrationPlan {
  mode: 'skip' | 'focused' | 'full';
  specs: string[];
  reasons: string[];
}

function defaultListDirectoryFileNames(dirPath: string): string[] {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/** Test-only dependencies for {@link resolveGenericBrowserIntegrationPlan}. */
export interface ResolveGenericBrowserIntegrationPlanDeps {
  fileExists?: (filePath: string) => boolean;
  listSpecs?: (deps?: ListGenericBrowserIntegrationSpecsDeps) => string[];
  listFilesRecursively?: (root: string) => string[];
  /** Test-only seam for the colocated-sibling directory scan. */
  listDirectoryFileNames?: (dirPath: string) => string[];
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only refinement. `null` fails closed to runtime-relevant.
   */
  packageJsonOldRef?: string | null;
}

/**
 * Resolve the generic owner-local browser-integration plan for a changed-file
 * set, in priority order: full (generic infrastructure change, a
 * runtime-relevant `package.json` change, or a removed/moved generic spec
 * whose safe widening is the complete current inventory), focused (a direct
 * generic spec change and/or a production change colocated with an existing
 * generic spec), or skip (no relevant changes). Never selects/widens into
 * the appUpdate managed-update corpus, which stays owned by
 * {@link resolveBrowserIntegrationPlan}. Reuses the same
 * `isPackageJsonRuntimeRelevantChange` decision as the exceptional
 * resolver, so a runtime-relevant `package.json` change widens the complete
 * public browser-integration type across both execution paths.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [deps] Test-only dependencies.
 * @returns Plan with `mode`, candidate `specs`, and human-readable `reasons`.
 */
export function resolveGenericBrowserIntegrationPlan(
  changedFiles: readonly string[],
  {
    fileExists = defaultFileExists,
    listSpecs = listGenericBrowserIntegrationSpecs,
    listFilesRecursively,
    listDirectoryFileNames = defaultListDirectoryFileNames,
    packageJsonOldRef = null,
  }: ResolveGenericBrowserIntegrationPlanDeps = {},
): GenericBrowserIntegrationPlan {
  const listCurrentSpecs = (): string[] => listSpecs({ listFilesRecursively });
  const fullLaneHit = changedFiles.find(isFullGenericBrowserIntegrationLanePath);

  if (fullLaneHit) {
    return {
      mode: 'full',
      specs: listCurrentSpecs(),
      reasons: [
        `generic browser-integration infrastructure path ${fullLaneHit} -> full generic browser-integration inventory`,
      ],
    };
  }

  if (
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef })
  ) {
    return {
      mode: 'full',
      specs: listCurrentSpecs(),
      reasons: [
        'runtime-relevant package.json change -> full generic browser-integration inventory',
      ],
    };
  }

  const selected = new Set<string>();
  const reasons: string[] = [];

  for (const filePath of changedFiles) {
    if (isGenericBrowserIntegrationSpecPath(filePath)) {
      if (fileExists(filePath)) {
        selected.add(filePath);
        reasons.push(`changed browser-integration spec ${filePath} -> browser-integration-local`);
        continue;
      }

      return {
        mode: 'full',
        specs: listCurrentSpecs(),
        reasons: [
          `removed/moved generic browser-integration spec ${filePath} -> full generic browser-integration inventory`,
        ],
      };
    }

    if (
      !filePath.startsWith(`${GENERIC_BROWSER_INTEGRATION_ROOT}/`) ||
      filePath.startsWith(APP_UPDATE_DIR) ||
      !(filePath.endsWith('.ts') || filePath.endsWith('.vue')) ||
      /\.(test|spec|stories|testUtils)\./.test(filePath)
    ) {
      continue;
    }

    const dirPath = path.posix.dirname(filePath);

    for (const entryName of listDirectoryFileNames(dirPath)) {
      if (!entryName.endsWith(BROWSER_INTEGRATION_SUFFIX)) {
        continue;
      }

      const siblingPath = path.posix.join(dirPath, entryName);

      if (isGenericBrowserIntegrationSpecPath(siblingPath)) {
        selected.add(siblingPath);
        reasons.push(`sibling production change ${filePath} -> ${siblingPath}`);
      }
    }
  }

  if (selected.size === 0) {
    return { mode: 'skip', specs: [], reasons: ['empty generic browser-integration scope'] };
  }

  return { mode: 'focused', specs: uniqSorted([...selected]), reasons: uniqSorted(reasons) };
}
