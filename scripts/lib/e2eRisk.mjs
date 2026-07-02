import fs from 'node:fs';
import path from 'node:path';

const VISUAL_SPEC_PREFIX = 'tests/e2e/visual/';
const RELEASE_SPEC_PREFIX = 'tests/e2e/release/';
const E2E_DIR_PREFIX = 'tests/e2e/';
const APP_E2E_SPEC_DIR = 'tests/e2e';
const STORIES_PATTERN = /\.stories\.(ts|tsx|js|jsx|mjs|vue)$/;

const LOW_LEVEL_E2E_EXACT_FILES = new Set([
  'playwright.config.ts',
  'scripts/e2eContainer.mjs',
  'scripts/e2eHost.mjs',
  'scripts/lib/e2eRisk.mjs',
  'scripts/verify.mjs',
  'vite.config.ts',
  'package.json',
  'pnpm-lock.yaml',
]);

/**
 * App e2e specs that are intentionally not covered by {@link E2E_SCENARIO_SCOPES}.
 * Keep this list small; every entry must explain why it has no scenario mapping.
 * Adding a new `tests/e2e/*.spec.ts` file requires either a registry entry or an
 * explicit, justified addition here, or {@link validateE2EScenarioRegistry} fails.
 */
export const APP_E2E_STANDALONE_SPECS = [];

// Broad blast-radius areas: app bootstrap, background services, proxy clients,
// shared infra, and shared UI interaction primitives reused across scenarios.
const LOW_LEVEL_E2E_PREFIXES = [
  '.github/workflows/',
  'src/app/',
  'src/shared/service/',
  'src/shared/serviceClient/',
  'src/shared/lib/',
  'src/shared/ui/',
];

/**
 * Explicit registry mapping product scenario source paths to the app e2e
 * specs that exercise them. Keep small and readable; unmapped `src/**`
 * paths fall back to full app e2e via {@link isUnmappedSourcePath} so risk
 * is never silently skipped.
 */
export const E2E_SCENARIO_SCOPES = [
  {
    name: 'app smoke and settings toggles',
    sourcePrefixes: [
      'src/features/starterExamplesDismiss/',
      'src/features/diagnosticsConsentRequest/',
      'src/features/diagnosticsReporting/',
      'src/widgets/StarterExamplesWidget/',
      'src/pages/Settings/',
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
    ],
    specs: [
      'tests/e2e/databaseViewsAndQueryFlows.spec.ts',
      'tests/e2e/reorderSurfaceDragSmoke.spec.ts',
    ],
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
];

function uniqSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isStoriesFile(filePath) {
  return STORIES_PATTERN.test(filePath);
}

function isTestOnlyPath(filePath) {
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
export function isVisualE2ESpecPath(filePath) {
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
export function isReleaseE2ESpecPath(filePath) {
  return filePath.startsWith(RELEASE_SPEC_PREFIX);
}

/**
 * Check whether a changed file is a non-visual, non-release app e2e spec
 * under `tests/e2e/`.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an app e2e spec file.
 */
export function isAppE2ESpecPath(filePath) {
  return (
    filePath.startsWith(E2E_DIR_PREFIX) &&
    !isVisualE2ESpecPath(filePath) &&
    !isReleaseE2ESpecPath(filePath) &&
    filePath.endsWith('.spec.ts')
  );
}

/**
 * Check whether a changed file is a non-spec e2e helper/fixture/page-object
 * under `tests/e2e/` (excluding visual and release). These are
 * reverse-resolved conservatively to a full app e2e run by
 * {@link resolveAppE2EPlan}.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an app e2e support file.
 */
export function isAppE2ESupportPath(filePath) {
  return (
    filePath.startsWith(E2E_DIR_PREFIX) &&
    !isVisualE2ESpecPath(filePath) &&
    !isReleaseE2ESpecPath(filePath) &&
    !isAppE2ESpecPath(filePath) &&
    filePath.endsWith('.ts')
  );
}

/**
 * Check whether a changed file is a broad blast-radius path that must
 * trigger full app e2e regardless of scenario mapping.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is low-level/shared/platform/tooling risk.
 */
export function isLowLevelE2EPath(filePath) {
  if (isStoriesFile(filePath) || isTestOnlyPath(filePath)) {
    return false;
  }

  if (LOW_LEVEL_E2E_EXACT_FILES.has(filePath)) {
    return true;
  }

  const baseName = path.posix.basename(filePath);

  if (baseName.startsWith('tsconfig') && baseName.endsWith('.json')) {
    return true;
  }

  return LOW_LEVEL_E2E_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function getScenariosForPath(filePath) {
  return E2E_SCENARIO_SCOPES.filter((scenario) =>
    scenario.sourcePrefixes.some((prefix) => filePath.startsWith(prefix)),
  );
}

/**
 * @param scenarios Scenario registry entries to flatten into a spec list.
 * @returns Sorted unique spec paths referenced by the scenario registry.
 */
function getAllRegistrySpecs(scenarios) {
  return uniqSorted(scenarios.flatMap((scenario) => scenario.specs));
}

function isExistingFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function findAppE2ESpecFiles(specDir) {
  return uniqSorted(
    fs
      .readdirSync(specDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
      .map((entry) => `${specDir}/${entry.name}`),
  );
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
export function validateE2EScenarioRegistry(overrides = {}) {
  const scenarios = overrides.scenarios ?? E2E_SCENARIO_SCOPES;
  const standaloneSpecs = overrides.standaloneSpecs ?? APP_E2E_STANDALONE_SPECS;
  const specDir = overrides.specDir ?? APP_E2E_SPEC_DIR;
  const errors = [];
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

  let appSpecFiles;

  try {
    appSpecFiles = findAppE2ESpecFiles(specDir);
  } catch (error) {
    errors.push(`unable to list ${specDir}/*.spec.ts: ${error.message}`);
    appSpecFiles = [];
  }

  const coveredSpecs = new Set([...registrySpecs, ...standaloneSpecs]);

  for (const spec of appSpecFiles) {
    if (!coveredSpecs.has(spec)) {
      errors.push(
        `app e2e spec ${spec} is not covered by E2E_SCENARIO_SCOPES or APP_E2E_STANDALONE_SPECS in scripts/lib/e2eRisk.mjs`,
      );
    }
  }

  return { valid: errors.length === 0, errors: uniqSorted(errors) };
}

/**
 * Check whether a changed `src/**` path has no low-level or scenario
 * classification. Unmapped paths must not silently skip e2e.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an unclassified product source change.
 */
export function isUnmappedSourcePath(filePath) {
  if (!filePath.startsWith('src/')) {
    return false;
  }

  if (isStoriesFile(filePath) || isTestOnlyPath(filePath)) {
    return false;
  }

  if (isLowLevelE2EPath(filePath)) {
    return false;
  }

  const extension = path.posix.extname(filePath);

  if (extension !== '.ts' && extension !== '.vue') {
    return false;
  }

  return getScenariosForPath(filePath).length === 0;
}

/**
 * Resolve the app e2e mode for the given changed files, in priority order:
 * invalid (scenario registry failed self-validation; fail closed instead of
 * silently skipping), full (low-level/unmapped/e2e-support risk), focused
 * (scenario registry matches and/or changed app e2e specs), or skip (no app
 * e2e relevant changes). Visual specs and visual-relevant paths never feed
 * this resolver; visual selection stays independent.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @returns Plan with `mode`, candidate `specs`, and human-readable `reasons`.
 */
export function resolveAppE2EPlan(changedFiles) {
  const registryValidation = validateE2EScenarioRegistry();

  if (!registryValidation.valid) {
    return { mode: 'invalid', specs: [], reasons: registryValidation.errors };
  }

  const lowLevelHit = changedFiles.find(isLowLevelE2EPath);
  const unmappedHit = changedFiles.find(isUnmappedSourcePath);
  const supportHit = changedFiles.find(isAppE2ESupportPath);
  const fullReasons = [];

  if (lowLevelHit) {
    fullReasons.push(`low-level path ${lowLevelHit} -> full app e2e`);
  }

  if (unmappedHit) {
    fullReasons.push(
      `unclassified src path ${unmappedHit} -> full app e2e (map it in scripts/lib/e2eRisk.mjs or add e2e coverage)`,
    );
  }

  if (supportHit) {
    fullReasons.push(`e2e support file ${supportHit} changed -> full app e2e`);
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', specs: [], reasons: fullReasons };
  }

  const focusedSpecs = new Set();
  const focusedReasons = [];

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
