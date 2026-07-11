import fs from 'node:fs';

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.mjs';

const STORYBOOK_BEHAVIOR_SPEC_DIR = 'tests/e2e/storybook';
const STORYBOOK_BEHAVIOR_SPEC_PREFIX = `${STORYBOOK_BEHAVIOR_SPEC_DIR}/`;
const PACKAGE_JSON_PATH = 'package.json';

/**
 * Storybook behavior specs that are intentionally not covered by
 * {@link STORYBOOK_BEHAVIOR_SCENARIO_SCOPES}. Keep this list small; every
 * entry must explain why it has no scenario mapping. Adding a new
 * `tests/e2e/storybook/*.spec.ts` file requires either a registry entry or
 * an explicit, justified addition here, or
 * {@link validateStorybookBehaviorScenarioRegistry} fails.
 */
export const STORYBOOK_BEHAVIOR_STANDALONE_SPECS = [];

/**
 * Explicit registry mapping source paths to the Storybook behavior specs
 * that exercise them. This infrastructure PR only registers the smoke spec;
 * later PRs add real scenario mappings (for example reorder behavior)
 * without changing this resolver's shape.
 */
export const STORYBOOK_BEHAVIOR_SCENARIO_SCOPES = [
  {
    name: 'storybook behavior infrastructure smoke',
    sourcePrefixes: [],
    specs: ['tests/e2e/storybook/storybook.smoke.spec.ts'],
  },
];

// Broad blast-radius paths: the Storybook build/runtime, the behavior
// Playwright config, the shared container runner, and this resolver's own
// registry. A change here can affect every behavior spec, so it always
// triggers a full lane run instead of relying on scenario mapping.
const FULL_LANE_EXACT_FILES = new Set([
  'config/tooling.json',
  'playwright.storybook.config.ts',
  'scripts/lib/storybookBehaviorRisk.mjs',
  'scripts/playwrightContainer.mjs',
  'scripts/storybook.mjs',
  'scripts/storybookBehavior.mjs',
  'tsconfig.storybook.json',
]);

const FULL_LANE_PREFIXES = ['.storybook/'];

function uniqSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isExistingFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function findStorybookBehaviorSpecFiles(specDir) {
  return uniqSorted(
    fs
      .readdirSync(specDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
      .map((entry) => `${specDir}/${entry.name}`),
  );
}

function getAllRegistrySpecs(scenarios) {
  return uniqSorted(scenarios.flatMap((scenario) => scenario.specs));
}

function getScenariosForPath(filePath) {
  return STORYBOOK_BEHAVIOR_SCENARIO_SCOPES.filter((scenario) =>
    scenario.sourcePrefixes.some((prefix) => filePath.startsWith(prefix)),
  );
}

/**
 * Check whether a changed file is a Storybook behavior spec under
 * `tests/e2e/storybook/`.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a Storybook behavior spec file.
 */
export function isStorybookBehaviorSpecPath(filePath) {
  return filePath.startsWith(STORYBOOK_BEHAVIOR_SPEC_PREFIX) && filePath.endsWith('.spec.ts');
}

/**
 * Check whether a changed file is a non-spec helper/fixture under
 * `tests/e2e/storybook/`. These are reverse-resolved conservatively to a
 * full behavior lane run by {@link resolveStorybookBehaviorPlan}.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a Storybook behavior support file.
 */
export function isStorybookBehaviorSupportPath(filePath) {
  return (
    filePath.startsWith(STORYBOOK_BEHAVIOR_SPEC_PREFIX) &&
    !isStorybookBehaviorSpecPath(filePath) &&
    filePath.endsWith('.ts')
  );
}

/**
 * Check whether a changed file is a broad blast-radius path that must
 * trigger the full Storybook behavior lane regardless of scenario mapping.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is Storybook/Playwright infrastructure risk.
 */
export function isFullStorybookBehaviorLanePath(filePath) {
  if (FULL_LANE_EXACT_FILES.has(filePath)) {
    return true;
  }

  return FULL_LANE_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

/**
 * Validate the scenario registry and standalone exception list as a
 * verification contract: every referenced spec must exist, and every
 * existing Storybook behavior spec on disk must be covered by the registry
 * or the standalone list. A broken registry must fail verification rather
 * than degrade to a skipped behavior run.
 * @param overrides Test-only overrides for the scenario registry, standalone
 * exception list, and spec directory. Production callers should omit this
 * argument so the real registry and exception list are validated.
 * @returns Validation result with `valid` and human-readable `errors`.
 */
export function validateStorybookBehaviorScenarioRegistry(overrides = {}) {
  const scenarios = overrides.scenarios ?? STORYBOOK_BEHAVIOR_SCENARIO_SCOPES;
  const standaloneSpecs = overrides.standaloneSpecs ?? STORYBOOK_BEHAVIOR_STANDALONE_SPECS;
  const specDir = overrides.specDir ?? STORYBOOK_BEHAVIOR_SPEC_DIR;
  const errors = [];
  const registrySpecs = getAllRegistrySpecs(scenarios).map(String);

  for (const spec of registrySpecs) {
    if (!isExistingFile(spec)) {
      errors.push(`scenario registry references missing spec ${spec}`);
    }
  }

  for (const spec of standaloneSpecs) {
    if (!isExistingFile(spec)) {
      errors.push(`STORYBOOK_BEHAVIOR_STANDALONE_SPECS references missing spec ${spec}`);
    }
  }

  let specFiles;

  try {
    specFiles = findStorybookBehaviorSpecFiles(specDir);
  } catch (error) {
    errors.push(`unable to list ${specDir}/*.spec.ts: ${error.message}`);
    specFiles = [];
  }

  const coveredSpecs = new Set([...registrySpecs, ...standaloneSpecs]);

  for (const spec of specFiles) {
    if (!coveredSpecs.has(spec)) {
      errors.push(
        `Storybook behavior spec ${spec} is not covered by STORYBOOK_BEHAVIOR_SCENARIO_SCOPES or STORYBOOK_BEHAVIOR_STANDALONE_SPECS in scripts/lib/storybookBehaviorRisk.mjs`,
      );
    }
  }

  return { valid: errors.length === 0, errors: uniqSorted(errors) };
}

/**
 * Resolve the Storybook behavior lane mode for the given changed files, in
 * priority order: invalid (scenario registry failed self-validation; fail
 * closed instead of silently skipping), full (global infrastructure risk,
 * behavior support file changes, or a Storybook/Playwright-relevant
 * `package.json` change), focused (scenario registry matches and/or changed
 * behavior specs), or none (no relevant changes).
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @param [options.packageJsonOldRef] Git ref to compare the current
 * `package.json` against, for the version-only impact refinement. Pass
 * `null` when no reliable base ref is known; that fails closed to
 * runtime-relevant (full lane).
 * @returns Plan with `mode`, candidate `specs`, and human-readable `reasons`.
 */
export function resolveStorybookBehaviorPlan(changedFiles, { packageJsonOldRef = null } = {}) {
  const registryValidation = validateStorybookBehaviorScenarioRegistry();

  if (!registryValidation.valid) {
    return { mode: 'invalid', specs: [], reasons: registryValidation.errors };
  }

  const fullLaneHit = changedFiles.find(isFullStorybookBehaviorLanePath);
  const supportHit = changedFiles.find(isStorybookBehaviorSupportPath);
  const isPackageJsonRelevant =
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef });
  const fullReasons = [];

  if (fullLaneHit) {
    fullReasons.push(
      `Storybook/Playwright infrastructure path ${fullLaneHit} -> full behavior lane`,
    );
  }

  if (isPackageJsonRelevant) {
    fullReasons.push(`runtime-relevant package.json change -> full behavior lane`);
  }

  if (supportHit) {
    fullReasons.push(`behavior support file ${supportHit} changed -> full behavior lane`);
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

    if (isStorybookBehaviorSpecPath(filePath)) {
      focusedSpecs.add(filePath);
      focusedReasons.push(`changed behavior spec ${filePath} -> ${filePath}`);
    }
  }

  if (focusedSpecs.size > 0) {
    return {
      mode: 'focused',
      specs: uniqSorted([...focusedSpecs]),
      reasons: uniqSorted(focusedReasons),
    };
  }

  return { mode: 'none', specs: [], reasons: ['empty storybook behavior scope'] };
}
