import fs from 'node:fs';
import path from 'node:path';

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
    sourcePrefixes: [
      'src/shared/ui/Button/MDButton.stories.ts',
      'src/shared/ui/Button/MDButton.vue',
    ],
    specs: ['tests/e2e/storybook/storybook.smoke.spec.ts'],
  },
  {
    name: 'reorder',
    // Includes all reorder behavior spec paths themselves (in addition to the library source
    // prefix): a `startsWith` match on a spec's own path means changing any one of them also
    // selects all three, not just the one that changed, since general, autoscroll, and activator
    // behavior share the same library surface.
    sourcePrefixes: [
      'src/shared/lib/reorder/',
      'tests/e2e/storybook/reorder.spec.ts',
      'tests/e2e/storybook/reorder.autoscroll.spec.ts',
      'tests/e2e/storybook/reorderActivator.spec.ts',
    ],
    specs: [
      'tests/e2e/storybook/reorder.spec.ts',
      'tests/e2e/storybook/reorder.autoscroll.spec.ts',
      'tests/e2e/storybook/reorderActivator.spec.ts',
    ],
  },
  {
    name: 'shared overlay outside-interaction lifecycle',
    sourcePrefixes: [
      'src/shared/lib/onInteractionOutside.ts',
      'src/shared/ui/Menu/MDMenuBase.vue',
      'src/shared/ui/Tooltips/MDOverlayTooltip.vue',
      'src/shared/ui/Tooltips/MDRichTooltip.vue',
      'src/shared/ui/Overlay/OverlayLifecycleRegression.stories.ts',
      'src/shared/ui/Overlay/stories/OverlayLifecycleRegressionStory.vue',
    ],
    specs: ['tests/e2e/storybook/overlayLifecycle.spec.ts'],
  },
];

// Broad blast-radius paths: the Storybook build/runtime, the behavior
// Playwright config, the shared container runner, and this resolver's own
// registry. A change here can affect every behavior spec, so it always
// triggers a full lane run instead of relying on scenario mapping.
const FULL_LANE_EXACT_FILES = new Set([
  'config/tooling.json',
  'playwright.storybook.config.ts',
  'pnpm-lock.yaml',
  'scripts/lib/storybookBehaviorRisk.mjs',
  'scripts/playwrightContainer.mjs',
  'scripts/storybook.mjs',
  'scripts/storybookBehavior.mjs',
  'scripts/verify.mjs',
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

/**
 * Recursively discover `*.spec.ts` files under `dir`, matching Playwright's
 * recursive `testDir` discovery so nested behavior specs (for example
 * `tests/e2e/storybook/reorder/reorder.spec.ts`) are covered by registry
 * validation instead of being silently invisible to it. Exported so tests
 * can exercise recursive discovery directly against an OS temporary
 * directory instead of the real Storybook behavior spec directory.
 * @param dir Directory to walk, relative to the repository root or absolute.
 * @returns Sorted unique list of discovered spec file paths.
 */
export function findStorybookBehaviorSpecFiles(dir) {
  const specFiles = [];
  const pendingDirs = [dir];

  while (pendingDirs.length > 0) {
    const currentDir = pendingDirs.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.posix.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        pendingDirs.push(entryPath);
      } else if (entry.isFile() && entryPath.endsWith('.spec.ts')) {
        specFiles.push(entryPath);
      }
    }
  }

  return uniqSorted(specFiles);
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
 * verification contract: every referenced spec must exist, be a `.spec.ts`
 * file, and live under `tests/e2e/storybook/` (rejecting app e2e, visual,
 * release, or otherwise arbitrary paths), and every existing Storybook
 * behavior spec on disk — discovered recursively, matching Playwright's
 * `testDir` discovery — must be covered by the registry or the standalone
 * list. A broken registry must fail verification rather than degrade to a
 * skipped behavior run.
 * @param overrides Test-only overrides for the scenario registry, standalone
 * exception list, spec directory, discovered spec paths, and spec-existence
 * check. Production callers should omit this argument so the real registry,
 * exception list, and filesystem are validated.
 * @param [overrides.specFiles] Test-only override for the discovered spec
 * paths, bypassing filesystem discovery under `specDir`. Lets registry
 * coverage be tested against deterministic virtual paths.
 * @param [overrides.fileExists] Test-only override for the spec-existence
 * check used for registry and standalone entries, bypassing the real
 * filesystem.
 * @returns Validation result with `valid` and human-readable `errors`.
 */
export function validateStorybookBehaviorScenarioRegistry(overrides = {}) {
  const scenarios = overrides.scenarios ?? STORYBOOK_BEHAVIOR_SCENARIO_SCOPES;
  const standaloneSpecs = overrides.standaloneSpecs ?? STORYBOOK_BEHAVIOR_STANDALONE_SPECS;
  const specDir = overrides.specDir ?? STORYBOOK_BEHAVIOR_SPEC_DIR;
  const fileExists = overrides.fileExists ?? isExistingFile;
  const errors = [];
  const registrySpecs = getAllRegistrySpecs(scenarios).map(String);

  for (const spec of registrySpecs) {
    if (!isStorybookBehaviorSpecPath(spec)) {
      errors.push(
        `scenario registry must only reference specs under ${STORYBOOK_BEHAVIOR_SPEC_PREFIX} ending in .spec.ts, got ${spec}`,
      );
      continue;
    }

    if (!fileExists(spec)) {
      errors.push(`scenario registry references missing spec ${spec}`);
    }
  }

  for (const spec of standaloneSpecs) {
    if (!isStorybookBehaviorSpecPath(spec)) {
      errors.push(
        `STORYBOOK_BEHAVIOR_STANDALONE_SPECS must only reference specs under ${STORYBOOK_BEHAVIOR_SPEC_PREFIX} ending in .spec.ts, got ${spec}`,
      );
      continue;
    }

    if (!fileExists(spec)) {
      errors.push(`STORYBOOK_BEHAVIOR_STANDALONE_SPECS references missing spec ${spec}`);
    }
  }

  let specFiles;

  if (overrides.specFiles) {
    specFiles = uniqSorted(overrides.specFiles);
  } else {
    try {
      specFiles = findStorybookBehaviorSpecFiles(specDir);
    } catch (error) {
      errors.push(`unable to list ${specDir}/*.spec.ts: ${error.message}`);
      specFiles = [];
    }
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
