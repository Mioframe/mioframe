/**
 * Owner-local planning for the managed-update browser-integration proof
 * (see docs/testing/verify-redesign-pass-c-implementation.md's "Browser-integration
 * type-local planning"). Reuses the existing `artifact` and
 * `managed-updates-browser-integration` verifier leaves/orchestration
 * (`scripts/release/managedUpdatesProof.mjs`, `scripts/e2eReleaseContainer.mjs`,
 * `playwright.release.config.ts`); this module only decides which of those
 * two leaves a changed-file set makes relevant, so `--only browser-integration`
 * and ordinary default `pnpm verify` recognize a direct owner-local spec
 * change without requiring `--full`.
 */

const APP_UPDATE_DIR = 'src/shared/service/appUpdate/';
const BROWSER_INTEGRATION_SUFFIX = '.browser-integration.spec.ts';

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
