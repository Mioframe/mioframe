import fs from 'node:fs';
import path from 'node:path';

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';

const VISUAL_SPEC_PREFIX = 'tests/e2e/visual/';
const RELEASE_SPEC_PREFIX = 'tests/e2e/release/';
const STORYBOOK_BEHAVIOR_SPEC_PREFIX = 'tests/e2e/storybook/';
const E2E_DIR_PREFIX = 'tests/e2e/';
const APP_E2E_SPEC_DIR = 'tests/e2e';
const STORIES_PATTERN = /\.stories\.(ts|tsx|js|jsx|mjs|vue)$/;
const PACKAGE_JSON_PATH = 'package.json';

const WORKFLOWS_PREFIX = '.github/workflows/';

// Full-lane E2E infrastructure/config/tooling: consumer set is intentionally
// the complete application-E2E lane, regardless of scenario mapping.
const FULL_LANE_E2E_INFRASTRUCTURE_EXACT_FILES = new Set([
  'playwright.config.ts',
  'scripts/e2eContainer.mjs',
  'scripts/e2eHost.mjs',
  'scripts/lib/e2eRisk.ts',
  'scripts/playwrightContainer.ts',
  'scripts/verify.ts',
  'vite.config.ts',
  'pnpm-lock.yaml',
]);

/** One explicit registry mapping of source path prefixes to app e2e specs. */
export interface E2EScenarioScope {
  name: string;
  sourcePrefixes: string[];
  specs: string[];
}

/**
 * App e2e specs that are intentionally not covered by {@link E2E_SCENARIO_SCOPES}.
 * Keep this list small; every entry must explain why it has no scenario mapping.
 * Adding a new `tests/e2e/*.spec.ts` file requires either a registry entry or an
 * explicit, justified addition here, or {@link validateE2EScenarioRegistry} fails.
 */
export const APP_E2E_STANDALONE_SPECS: string[] = [];

// Broad application-E2E-relevant domains: app bootstrap, background services,
// proxy clients, shared infra, and shared UI interaction primitives reused
// across scenarios. Paths here are never silently skipped, but a path with an
// explicit E2E_SCENARIO_SCOPES mapping may resolve focused instead of full.
const APP_E2E_RELEVANT_BROAD_DOMAINS = [
  'src/app/',
  'src/shared/service/',
  'src/shared/serviceClient/',
  'src/shared/lib/',
  'src/shared/ui/',
];

/**
 * Explicit registry mapping product scenario source paths to the app e2e
 * specs that exercise them. Keep small and readable; unmapped `src/**`
 * paths fall back to full app e2e via {@link isUnmappedAppE2ERelevantPath}
 * so risk is never silently skipped.
 */
export const E2E_SCENARIO_SCOPES: E2EScenarioScope[] = [
  {
    name: 'app smoke and settings toggles',
    sourcePrefixes: [
      'src/features/starterExamplesDismiss/',
      'src/features/diagnosticsConsentRequest/',
      'src/features/diagnosticsReporting/',
      'src/widgets/StarterExamplesWidget/',
      'src/pages/Settings/',
      'src/app/playgroundPages.ts',
      'src/shared/lib/playground/',
    ],
    specs: ['tests/e2e/appSmoke.spec.ts'],
  },
  {
    name: 'browser storage persistence',
    sourcePrefixes: [
      'src/features/browserStoragePersistenceEnable/',
      'src/features/mioframeStorageInfo/',
      'src/entities/browserStoragePersistence/',
    ],
    specs: ['tests/e2e/browserStoragePersistenceSmoke.spec.ts'],
  },
  {
    name: 'database persistence',
    sourcePrefixes: ['src/entities/databaseData/'],
    specs: ['tests/e2e/databasePersistenceSmoke.spec.ts'],
  },
  {
    name: 'database item flows',
    sourcePrefixes: [
      'src/features/databaseItemEdit/',
      'src/features/databaseItemRemove/',
      'src/features/stringValueEdit/',
      'src/features/numberValueEdit/',
      'src/features/booleanValueEdit/',
      'src/features/dateValueEdit/',
      'src/features/relationValueEdit/',
      'src/entities/databaseItem/',
      'src/entities/databaseValue/',
      'src/entities/databaseString/',
      'src/entities/databaseNumber/',
      'src/entities/databaseBoolean/',
      'src/entities/databaseDate/',
      'src/entities/databaseRelation/',
    ],
    specs: ['tests/e2e/databaseItemFlows.spec.ts'],
  },
  {
    name: 'database property flows',
    sourcePrefixes: [
      'src/features/databasePropertyEdit/',
      'src/features/databasePropertyCreate/',
      'src/features/databasePropertyRemove/',
      'src/features/databaseRelationPropertyEdit/',
      'src/features/databaseBooleanPropertyEdit/',
      'src/features/numberPropertyEdit/',
      'src/entities/databaseProperty/',
    ],
    specs: ['tests/e2e/databasePropertyFlows.spec.ts'],
  },
  {
    name: 'database views and query flows',
    sourcePrefixes: [
      'src/features/databaseViewCreate/',
      'src/features/databaseViewRename/',
      'src/features/databaseViewMapEdit/',
      'src/features/databaseFilterEdit/',
      'src/features/databaseItemSorting/',
      'src/entities/databaseView/',
      'src/entities/databaseFilter/',
      'src/entities/databaseSorting/',
      'src/shared/lib/sortable/',
    ],
    specs: [
      'tests/e2e/databaseViewsAndQueryFlows.spec.ts',
      'tests/e2e/reorderSurfaceBottomSheet.spec.ts',
      'tests/e2e/reorderSurfaceCancellation.spec.ts',
      'tests/e2e/reorderSurfaceMouse.spec.ts',
      'tests/e2e/reorderSurfacePersistence.spec.ts',
      'tests/e2e/reorderSurfaceTouch.spec.ts',
    ],
  },
  {
    name: 'database views surface and query UI',
    sourcePrefixes: [
      'src/widgets/DocumentView/Database/DatabaseViewsSheet.vue',
      'src/shared/ui/Query/',
    ],
    specs: ['tests/e2e/databaseViewsAndQueryFlows.spec.ts'],
  },
  {
    name: 'repository explorer screen',
    sourcePrefixes: ['src/widgets/RepositoryExplorerWidget/', 'src/pages/RepoExplorer/'],
    specs: ['tests/e2e/repoExplorerScreen.spec.ts', 'tests/e2e/repositoryFlows.spec.ts'],
  },
  {
    name: 'help navigation',
    sourcePrefixes: ['src/pages/Help/'],
    specs: ['tests/e2e/helpNavigation.spec.ts'],
  },
  {
    name: 'app updates settings entry and pane',
    sourcePrefixes: [
      'src/pages/AppUpdatesPane/',
      'src/widgets/AppUpdateSettings/',
      'src/widgets/SettingsSections/',
      'src/entities/appUpdate/',
    ],
    specs: ['tests/e2e/appUpdatesNavigation.spec.ts'],
  },
  {
    name: 'directory and document flows',
    sourcePrefixes: [
      'src/features/directoryCreate/',
      'src/features/documentCreate/',
      'src/features/documentRename/',
      'src/features/documentRemove/',
      'src/features/entryRemove/',
      'src/features/entryRename/',
      'src/features/entryAdd/',
      'src/features/entryManage/',
      'src/entities/directory/',
      'src/entities/fsEntry/',
      'src/entities/repository/',
    ],
    specs: ['tests/e2e/repositoryFlows.spec.ts'],
  },
  {
    name: 'document export',
    sourcePrefixes: ['src/features/exportDocument/'],
    specs: ['tests/e2e/exportDocumentBrowserStorage.spec.ts'],
  },
  {
    name: 'ZIP export and import flows',
    sourcePrefixes: [
      'src/features/exportZip/',
      'src/features/importZip/',
      'src/features/documentManage/',
      'src/features/entryAdd/',
      'src/features/entryManage/',
      'src/widgets/RepositoryExplorerWidget/',
      'src/pages/RepoExplorer/',
    ],
    specs: ['tests/e2e/zipActionFlows.spec.ts'],
  },
];

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isStoriesFile(filePath: string): boolean {
  return STORIES_PATTERN.test(filePath);
}

function isTestOnlyPath(filePath: string): boolean {
  return (
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.spec.ts') ||
    filePath.endsWith('.test.mjs') ||
    filePath.endsWith('.spec.mjs') ||
    filePath.endsWith('.testUtils.ts')
  );
}

/**
 * Check whether a changed file is a visual-only e2e spec under
 * `tests/e2e/visual/`. Visual specs never feed app e2e selection.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a visual e2e spec.
 */
export function isVisualE2ESpecPath(filePath: string): boolean {
  return filePath.startsWith(VISUAL_SPEC_PREFIX);
}

/**
 * Check whether a changed file is a release-only e2e spec under
 * `tests/e2e/release/`. Release specs run against the production artifact
 * via `playwright.release.config.ts` / `pnpm verify --full`, not the
 * focused dev app e2e resolved here.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a release e2e spec.
 */
export function isReleaseE2ESpecPath(filePath: string): boolean {
  return filePath.startsWith(RELEASE_SPEC_PREFIX);
}

/**
 * Check whether a changed file belongs to the separately owned Storybook
 * browser-behavior lane under `tests/e2e/storybook/`. That lane has its own
 * risk resolver in `scripts/lib/storybookBehaviorRisk.ts`; app e2e must
 * never select these paths.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a Storybook behavior lane path.
 */
export function isStorybookBehaviorPath(filePath: string): boolean {
  return filePath.startsWith(STORYBOOK_BEHAVIOR_SPEC_PREFIX);
}

/**
 * Check whether a changed file is a non-visual, non-release, non-Storybook-behavior
 * app e2e spec under `tests/e2e/`.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an app e2e spec file.
 */
export function isAppE2ESpecPath(filePath: string): boolean {
  return (
    filePath.startsWith(E2E_DIR_PREFIX) &&
    !isVisualE2ESpecPath(filePath) &&
    !isReleaseE2ESpecPath(filePath) &&
    !isStorybookBehaviorPath(filePath) &&
    filePath.endsWith('.spec.ts')
  );
}

/**
 * Check whether a changed file is a non-spec e2e helper/fixture/page-object
 * under `tests/e2e/` (excluding visual, release, and Storybook behavior).
 * These are reverse-resolved conservatively to a full app e2e run by
 * {@link resolveAppE2EPlan}.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an app e2e support file.
 */
export function isAppE2ESupportPath(filePath: string): boolean {
  return (
    filePath.startsWith(E2E_DIR_PREFIX) &&
    !isVisualE2ESpecPath(filePath) &&
    !isReleaseE2ESpecPath(filePath) &&
    !isStorybookBehaviorPath(filePath) &&
    !isAppE2ESpecPath(filePath) &&
    filePath.endsWith('.ts')
  );
}

/**
 * Check whether a changed file is full-lane E2E infrastructure/config/tooling
 * whose consumer set is intentionally the complete application-E2E lane,
 * regardless of any scenario mapping.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is E2E infrastructure/tooling/CI configuration.
 */
export function isFullLaneE2EInfrastructurePath(filePath: string): boolean {
  if (FULL_LANE_E2E_INFRASTRUCTURE_EXACT_FILES.has(filePath)) {
    return true;
  }

  const baseName = path.posix.basename(filePath);

  if (baseName.startsWith('tsconfig') && baseName.endsWith('.json')) {
    return true;
  }

  return filePath.startsWith(WORKFLOWS_PREFIX);
}

function getScenariosForPath(filePath: string): E2EScenarioScope[] {
  return E2E_SCENARIO_SCOPES.filter((scenario) =>
    scenario.sourcePrefixes.some((prefix) => filePath.startsWith(prefix)),
  );
}

/**
 * @param scenarios Scenario registry entries to flatten into a spec list.
 * @returns Sorted unique spec paths referenced by the scenario registry.
 */
function getAllRegistrySpecs(scenarios: readonly E2EScenarioScope[]): string[] {
  return uniqSorted(scenarios.flatMap((scenario) => scenario.specs));
}

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function findAppE2ESpecFiles(specDir: string): string[] {
  return uniqSorted(
    fs
      .readdirSync(specDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
      .map((entry) => `${specDir}/${entry.name}`),
  );
}

/** Validation result for the app e2e scenario registry. */
export interface E2ERegistryValidation {
  valid: boolean;
  errors: string[];
}

/** Test-only overrides for {@link validateE2EScenarioRegistry}. */
export interface ValidateE2EScenarioRegistryOverrides {
  scenarios?: E2EScenarioScope[];
  standaloneSpecs?: string[];
  specDir?: string;
}

/**
 * Validate the scenario registry and standalone exception list as a
 * verification contract: every referenced spec must exist, none may be a
 * visual spec, and every existing app e2e spec on disk must be covered by
 * the registry or the standalone list. A broken registry must fail
 * verification rather than degrade to a skipped app e2e run.
 * @param overrides Test-only overrides for the scenario registry, standalone
 * exception list, and app e2e spec directory. Production callers should omit
 * this argument so the real registry and exception list are validated.
 * @returns Validation result with `valid` and human-readable `errors`.
 */
export function validateE2EScenarioRegistry(
  overrides: ValidateE2EScenarioRegistryOverrides = {},
): E2ERegistryValidation {
  const scenarios = overrides.scenarios ?? E2E_SCENARIO_SCOPES;
  const standaloneSpecs = overrides.standaloneSpecs ?? APP_E2E_STANDALONE_SPECS;
  const specDir = overrides.specDir ?? APP_E2E_SPEC_DIR;
  const errors: string[] = [];
  const registrySpecs = getAllRegistrySpecs(scenarios).map(String);

  for (const spec of registrySpecs) {
    if (isVisualE2ESpecPath(spec)) {
      errors.push(`scenario registry must not reference visual spec ${spec}`);
      continue;
    }

    if (!isExistingFile(spec)) {
      errors.push(`scenario registry references missing spec ${spec}`);
    }
  }

  for (const spec of standaloneSpecs) {
    if (isVisualE2ESpecPath(spec)) {
      errors.push(`APP_E2E_STANDALONE_SPECS must not reference visual spec ${spec}`);
      continue;
    }

    if (!isExistingFile(spec)) {
      errors.push(`APP_E2E_STANDALONE_SPECS references missing spec ${spec}`);
    }
  }

  let appSpecFiles: string[];

  try {
    appSpecFiles = findAppE2ESpecFiles(specDir);
  } catch (error) {
    errors.push(
      `unable to list ${specDir}/*.spec.ts: ${error instanceof Error ? error.message : String(error)}`,
    );
    appSpecFiles = [];
  }

  const coveredSpecs = new Set([...registrySpecs, ...standaloneSpecs]);

  for (const spec of appSpecFiles) {
    if (!coveredSpecs.has(spec)) {
      errors.push(
        `app e2e spec ${spec} is not covered by E2E_SCENARIO_SCOPES or APP_E2E_STANDALONE_SPECS in scripts/lib/e2eRisk.ts`,
      );
    }
  }

  return { valid: errors.length === 0, errors: uniqSorted(errors) };
}

/**
 * Check whether a changed file is application-E2E-relevant product/shared
 * source: a path that must never be silently skipped, but may resolve to
 * focused specs when {@link E2E_SCENARIO_SCOPES} has an explicit mapping.
 * Every file under the broad app/shared runtime domains counts (so
 * non-TypeScript/Vue runtime files, e.g. CSS, stay protected); elsewhere
 * under `src/` only TypeScript/Vue source counts.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is relevant to application-E2E impact.
 */
export function isAppE2ERelevantPath(filePath: string): boolean {
  if (!filePath.startsWith('src/')) {
    return false;
  }

  if (isStoriesFile(filePath) || isTestOnlyPath(filePath)) {
    return false;
  }

  if (APP_E2E_RELEVANT_BROAD_DOMAINS.some((prefix) => filePath.startsWith(prefix))) {
    return true;
  }

  const extension = path.posix.extname(filePath);

  return extension === '.ts' || extension === '.vue';
}

/**
 * Check whether an application-E2E-relevant path has no explicit scenario
 * mapping in {@link E2E_SCENARIO_SCOPES}. Unmapped relevant paths must not
 * silently skip e2e; {@link resolveAppE2EPlan} fails them closed to full.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is relevant and unmapped.
 */
export function isUnmappedAppE2ERelevantPath(filePath: string): boolean {
  return isAppE2ERelevantPath(filePath) && getScenariosForPath(filePath).length === 0;
}

/** Resolved app e2e lane plan, discriminated by `mode`. */
export type AppE2EPlan =
  | { mode: 'invalid'; specs: string[]; reasons: string[] }
  | { mode: 'full'; specs: string[]; reasons: string[] }
  | { mode: 'focused'; specs: string[]; reasons: string[] }
  | { mode: 'skip'; specs: string[]; reasons: string[] };

/** Resolution options for {@link resolveAppE2EPlan}. */
export interface ResolveAppE2EPlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only e2e impact refinement. Pass `null` when no reliable base
   * ref is known; that fails closed to runtime-relevant (full app e2e).
   */
  packageJsonOldRef?: string | null;
  /**
   * Test-only override for the directly changed spec existence check,
   * bypassing the real filesystem. Production callers should omit this so a
   * deleted or renamed-away spec is detected against the real repository
   * state.
   */
  fileExists?: (filePath: string) => boolean;
}

/**
 * Resolve the app e2e mode for the given changed files, in priority order:
 * invalid (scenario registry failed self-validation; fail closed instead of
 * silently skipping), full (full-lane infrastructure/unmapped-relevant/e2e-support/
 * package.json risk or a removed/renamed directly changed app spec), focused
 * (scenario registry matches and/or changed existing app e2e specs), or skip
 * (no app e2e relevant changes). Visual specs and visual-relevant paths never
 * feed this resolver; visual selection stays independent.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, candidate `specs`, and human-readable `reasons`.
 */
export function resolveAppE2EPlan(
  changedFiles: readonly string[],
  { packageJsonOldRef = null, fileExists = isExistingFile }: ResolveAppE2EPlanOptions = {},
): AppE2EPlan {
  const registryValidation = validateE2EScenarioRegistry();

  if (!registryValidation.valid) {
    return { mode: 'invalid', specs: [], reasons: registryValidation.errors };
  }

  const infrastructureHit = changedFiles.find(isFullLaneE2EInfrastructurePath);
  const unmappedRelevantHit = changedFiles.find(isUnmappedAppE2ERelevantPath);
  const supportHit = changedFiles.find(isAppE2ESupportPath);
  const missingSpecHit = changedFiles.find(
    (filePath) => isAppE2ESpecPath(filePath) && !fileExists(filePath),
  );
  const isPackageJsonRuntimeRelevant =
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef });
  const fullReasons: string[] = [];

  if (infrastructureHit) {
    fullReasons.push(`full-lane infrastructure path ${infrastructureHit} -> full app e2e`);
  }

  if (isPackageJsonRuntimeRelevant) {
    fullReasons.push(`runtime-relevant package.json change -> full app e2e`);
  }

  if (unmappedRelevantHit) {
    fullReasons.push(
      `unmapped application-E2E-relevant path ${unmappedRelevantHit} -> full app e2e (map it in scripts/lib/e2eRisk.ts or add e2e coverage)`,
    );
  }

  if (supportHit) {
    fullReasons.push(`e2e support file ${supportHit} changed -> full app e2e`);
  }

  if (missingSpecHit) {
    fullReasons.push(`removed or renamed app e2e spec ${missingSpecHit} -> full app e2e`);
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', specs: [], reasons: fullReasons };
  }

  const focusedSpecs = new Set<string>();
  const focusedReasons: string[] = [];

  for (const filePath of changedFiles) {
    const scenarios = getScenariosForPath(filePath);

    for (const scenario of scenarios) {
      for (const spec of scenario.specs) {
        focusedSpecs.add(spec);
      }

      focusedReasons.push(`scenario ${scenario.name} -> ${scenario.specs.join(', ')}`);
    }

    if (isAppE2ESpecPath(filePath)) {
      focusedSpecs.add(filePath);
      focusedReasons.push(`changed app e2e spec ${filePath} -> ${filePath}`);
    }
  }

  if (focusedSpecs.size > 0) {
    return {
      mode: 'focused',
      specs: uniqSorted([...focusedSpecs]),
      reasons: uniqSorted(focusedReasons),
    };
  }

  return { mode: 'skip', specs: [], reasons: ['empty e2e scope'] };
}
