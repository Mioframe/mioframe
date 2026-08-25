/**
 * Owner-local planning for the browser-integration verification type: the
 * managed-update proof (see
 * docs/testing/verify-redesign-pass-c-implementation.md's "Browser-integration
 * type-local planning") and the generic owner-local `browser-integration-local`
 * leaf (see docs/testing/verify-redesign-pass-d-implementation.md's "Generic
 * owner-local browser-integration execution"). Reuses the existing `artifact`
 * and `managed-updates-browser-integration` verifier leaves/orchestration
 * (`scripts/release/managedUpdatesProof.mjs`, `scripts/e2eReleaseContainer.mjs`,
 * `playwright.release.config.ts`) for the managed-update proof, and the
 * generic `playwright.browserIntegration.config.ts` / `scripts/browserIntegration.mjs`
 * for every other owner-local `*.browser-integration.spec.ts`; this module
 * only decides which leaves a changed-file set makes relevant, so `--only
 * browser-integration` and ordinary default `pnpm verify` recognize a direct
 * owner-local spec change without requiring `--full`.
 */

import fs from 'node:fs';
import path from 'node:path';

const APP_UPDATE_DIR = 'src/shared/service/appUpdate/';
const BROWSER_INTEGRATION_SUFFIX = '.browser-integration.spec.ts';
const GENERIC_BROWSER_INTEGRATION_ROOT = 'src';

/**
 * The single browser-integration spec owned by the `artifact` leaf; every
 * other colocated `*.browser-integration.spec.ts` under
 * `src/shared/service/appUpdate/` belongs to the `managed-updates-browser-integration`
 * leaf (see `scripts/release/managedUpdatesProof.mjs`'s fixed group lists).
 */
export const PRODUCTION_ARTIFACT_SMOKE_SPEC = `${APP_UPDATE_DIR}productionArtifactSmoke${BROWSER_INTEGRATION_SUFFIX}`;

// Broad blast-radius paths: the release Playwright config/container runner,
// the managed-update group/orchestration definition, this resolver's own
// module, and the verifier planner entry point. A change here can affect
// every browser-integration spec, so it always triggers both leaves instead
// of relying on path-based ownership.
const FULL_LANE_EXACT_FILES = new Set([
  'config/tooling.json',
  'pnpm-lock.yaml',
  'playwright.release.config.ts',
  'scripts/e2eReleaseContainer.mjs',
  'scripts/playwrightContainer.ts',
  'scripts/release/managedUpdatesProof.mjs',
  'scripts/lib/browserIntegrationRisk.ts',
  'scripts/verify.ts',
]);

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
  return FULL_LANE_EXACT_FILES.has(filePath);
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/** Resolved managed-update browser-integration plan. */
export interface BrowserIntegrationPlan {
  mode: 'skip' | 'focused' | 'full';
  /** Whether the `artifact` leaf (productionArtifactSmoke) is relevant. */
  artifact: boolean;
  /** Whether the `managed-updates-browser-integration` leaf is relevant. */
  managedUpdates: boolean;
  reasons: string[];
}

/**
 * Resolve which managed-update browser-integration leaves a changed-file set
 * makes relevant, in priority order: full (broad infrastructure risk, both
 * leaves), focused (a direct appUpdate browser-integration spec change
 * and/or an unresolvable appUpdate production change, either or both
 * leaves), or skip (no relevant changes).
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @returns Plan with `mode`, per-leaf relevance, and human-readable `reasons`.
 */
export function resolveBrowserIntegrationPlan(
  changedFiles: readonly string[],
): BrowserIntegrationPlan {
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

  let artifact = false;
  let managedUpdates = false;
  const reasons: string[] = [];

  for (const filePath of changedFiles) {
    if (filePath === PRODUCTION_ARTIFACT_SMOKE_SPEC) {
      artifact = true;
      reasons.push(`changed browser-integration spec ${filePath} -> artifact`);
      continue;
    }

    if (isAppUpdateBrowserIntegrationSpecPath(filePath)) {
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
const GENERIC_FULL_LANE_EXACT_FILES = new Set([
  'playwright.browserIntegration.config.ts',
  'scripts/browserIntegration.mjs',
  'scripts/playwrightContainer.ts',
  'scripts/lib/browserIntegrationRisk.ts',
  'scripts/verify.ts',
  'pnpm-lock.yaml',
]);

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
}

/**
 * Resolve the generic owner-local browser-integration plan for a changed-file
 * set, in priority order: full (generic infrastructure change, or a
 * removed/moved generic spec whose safe widening is the complete current
 * inventory), focused (a direct generic spec change and/or a production
 * change colocated with an existing generic spec), or skip (no relevant
 * changes). Never selects/widens into the appUpdate managed-update corpus,
 * which stays owned by {@link resolveBrowserIntegrationPlan}.
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
  }: ResolveGenericBrowserIntegrationPlanDeps = {},
): GenericBrowserIntegrationPlan {
  const listCurrentSpecs = (): string[] => listSpecs({ listFilesRecursively });
  const fullLaneHit = changedFiles.find((filePath) => GENERIC_FULL_LANE_EXACT_FILES.has(filePath));

  if (fullLaneHit) {
    return {
      mode: 'full',
      specs: listCurrentSpecs(),
      reasons: [
        `generic browser-integration infrastructure path ${fullLaneHit} -> full generic browser-integration inventory`,
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
