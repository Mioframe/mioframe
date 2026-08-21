import fs from 'node:fs';

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';
import type { ChangedPath } from './changedPaths.ts';

/**
 * One explicit unit-test file-as-data relation: a repository input consumed
 * by its owning test(s) outside the ordinary module/import relation (so
 * Vitest's own `related` resolution cannot discover it). Covers both a
 * direct fixed-path read (mechanism 3), runtime/tool-driven config discovery
 * (mechanism 4, e.g. ESLint's own cwd-based config resolution), and an exact
 * existence/absence contract (mechanism 6) -- all three are structurally the
 * same "exact source -> exact owning test(s)" relation; only the reason the
 * relation exists differs, which is documented per entry below.
 */
export interface UnitFileAsDataMapping {
  /** Exact repository-relative source path (not a prefix). */
  source: string;
  /** Exact owning Vitest test file path(s). */
  tests: readonly string[];
}

/**
 * Confirmed exact file-as-data relations. Each entry was verified against
 * real repository behavior: `vitest related <source>` alone does not
 * discover the owning test, and each owning test was confirmed to actually
 * consume that exact source outside the import graph. This is a small
 * unit-specific external-input map, not a general dependency registry -- see
 * `docs/testing/verify-unit-impact-correction.md` decision #4 (exact
 * external ownership) and #6 (audit population/mechanism classification).
 */
export const UNIT_FILE_AS_DATA_MAPPINGS: readonly UnitFileAsDataMapping[] = [
  {
    source: 'PRIVACY.md',
    tests: ['src/pages/DataStoragePrivacyPane/DataStoragePrivacyPane.test.ts'],
  },
  // Runtime/tool-discovered external ownership (mechanism 4):
  // eslint.config.test.ts constructs `new ESLint({ cwd: import.meta.dirname })`
  // and lints in-memory code snippets against eslint.config.mjs's real rules;
  // there is no ES `import` of eslint.config.mjs anywhere in that test --
  // ESLint's own runtime loads the config file by cwd-based discovery.
  {
    source: 'eslint.config.mjs',
    tests: ['eslint.config.test.ts'],
  },
  {
    source: '.github/workflows/release.yml',
    tests: [
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
    ],
  },
  {
    source: '.github/workflows/verify.yml',
    tests: [
      'scripts/ciAutofix.test.ts',
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
      'scripts/release/materializePrVersionWorkflow.test.mjs',
      // scripts/verify.test.ts's "verification-release CI job timeout
      // envelope" describe block directly fs.readFileSync's this exact
      // workflow file to extract and assert the verification-release job's
      // timeout-minutes envelope.
      'scripts/verify.test.ts',
    ],
  },
  {
    source: '.github/workflows/deploy-branch.yml',
    tests: [
      'scripts/release/buildDateWorkflow.test.mjs',
      'scripts/release/managedDeploymentValidationWorkflow.test.mjs',
    ],
  },
  // Root files, outside src/config/scripts, so isOrdinaryUnitSourcePath never
  // passes them to Vitest related regardless of any real import edge.
  {
    source: '.gitignore',
    tests: ['scripts/agentEnvironment.test.mjs'],
  },
  // scripts/release/viteBuildDate.test.mjs is deliberately NOT mapped here:
  // it has a real `import viteConfig from '../../vite.config.ts';` ES
  // import, so it is reached only through ordinary Vitest related
  // resolution of vite.config.ts itself (passed through below as ordinary
  // source), never duplicated in external metadata -- see
  // verify-unit-impact-correction.md decision #4 ("an import-reachable
  // owner being redundantly required through external metadata").
  {
    source: 'vite.config.ts',
    tests: ['config/viteConfigFixtureImport.test.ts'],
  },
  // CSS read directly (readFileSync) by these tests, never imported by them.
  {
    source: 'src/shared/lib/md/index.css',
    tests: [
      'config/postcss.config.test.ts',
      'src/shared/lib/md/index.test.ts',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ],
  },
  // Exact existence/absence ownership (mechanism 6): tokens.test.ts asserts
  // this legacy path does NOT exist. The source is not expected to exist on
  // disk -- that is exactly the forbidden-path contract this mapping must
  // catch if the path is ever resurrected.
  {
    source: 'src/shared/lib/md/tokens.css',
    tests: ['src/shared/ui/material/foundation/tokens.test.ts'],
  },
  {
    source: 'src/shared/ui/material/foundation/tokens.css',
    tests: ['config/postcss.config.test.ts', 'src/shared/ui/material/foundation/tokens.test.ts'],
  },
  {
    source: 'src/shared/ui/material/foundation/theme.css',
    tests: [
      'config/postcss.config.test.ts',
      'src/shared/ui/material/foundation/theme.test.ts',
      'src/shared/ui/material/foundation/tokens.test.ts',
    ],
  },
  {
    source: 'src/shared/ui/material/foundation/index.css',
    tests: ['src/shared/ui/material/foundation/tokens.test.ts'],
  },
  {
    source: 'src/app/styles/styles.css',
    tests: ['src/shared/ui/material/foundation/tokens.test.ts'],
  },
  {
    source: 'src/app/styles/base.css',
    tests: ['src/shared/ui/material/foundation/tokens.test.ts'],
  },
  // Read directly by MDStateLayer.test.ts's cross-file opacity-alias
  // assertions; none is imported by that test. MDCard.vue is additionally
  // real ordinary .vue unit source (see isOrdinaryUnitSourcePath below),
  // so its own colocated test still reaches it through pass-through.
  {
    source: 'src/shared/ui/Card/MDCard.vue',
    tests: ['src/shared/ui/State/MDStateLayer.test.ts'],
  },
  {
    source: 'src/shared/ui/Lists/listItemAnatomy.css',
    tests: ['src/shared/ui/State/MDStateLayer.test.ts'],
  },
  {
    source: 'src/shared/ui/State/ripple.css',
    tests: ['src/shared/ui/State/MDStateLayer.test.ts'],
  },
];

/**
 * One bounded repository-scan ownership relation (mechanism 5): a Vitest
 * test whose own deterministic scan predicate observes a population of
 * repository paths outside the import graph and outside a single exact
 * source mapping -- for example a boundary test that recursively reads
 * every non-test source file under a directory, or a registry-validation
 * test that lists a directory's files against a static registry. Each
 * `matchesPath` predicate mirrors the real scanning production code exactly
 * (confirmed by direct read, not inferred), per
 * `docs/testing/verify-unit-impact-correction.md` decision #5. This is a
 * small set of narrow local rules, not a generated per-file mapping and not
 * a general dependency graph.
 */
export interface UnitScanOwner {
  /** Exact owning Vitest test file path. */
  test: string;
  /** True when `filePath` is part of this test's real bounded scan population. */
  matchesPath: (filePath: string) => boolean;
}

/** Resolved unit-impact plan, discriminated by `mode`. */
// `relatedInputs` is present on every variant (empty outside `focused`),
// matching the established codebase convention for lane plans
// (AppE2EPlan/VisualPlan/StorybookBehaviorPlan) so callers/tests never need
// a mode-narrowing guard merely to read it.
export type UnitPlan =
  | { mode: 'skip'; relatedInputs: string[]; reasons: string[] }
  | { mode: 'focused'; relatedInputs: string[]; reasons: string[] }
  | { mode: 'full'; relatedInputs: string[]; reasons: string[] }
  | { mode: 'invalid'; relatedInputs: string[]; reasons: string[] };

/** Resolution options for {@link resolveUnitPlan}. */
export interface ResolveUnitPlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only unit impact refinement. Pass `null` when no reliable base
   * ref is known; that fails closed to runtime-relevant (full unit).
   */
  packageJsonOldRef?: string | null;
  /**
   * Test-only override for file-existence checks, bypassing the real
   * filesystem. Production callers should omit this so real repository
   * state is consulted.
   */
  fileExists?: (filePath: string) => boolean;
  /**
   * Test-only override for the file-as-data registry, bypassing
   * {@link UNIT_FILE_AS_DATA_MAPPINGS}. Production callers should omit this.
   */
  fileAsDataMappings?: readonly UnitFileAsDataMapping[];
}

const FULL_UNIT_EXACT_FILES = new Set([
  'vitest.config.ts',
  'src/setupVitest.ts',
  'config/alias.ts',
  'config/plugins/base.ts',
  'pnpm-lock.yaml',
]);

const UNIT_RELEVANT_PREFIXES = ['src/', 'config/', 'scripts/'];
const ORDINARY_SOURCE_EXTENSIONS = ['.ts', '.vue', '.mjs', '.js', '.json', '.css'];
const PACKAGE_JSON_PATH = 'package.json';
const ROOT_PLAYWRIGHT_TEST_PATTERN = /^playwright\.[^/]+\.test\.ts$/;

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

// Playwright-owned proof inputs only; never Vitest-owned regardless of
// location (see .agents/skills/verification/SKILL.md): colocated
// *.browser.spec.ts/*.visual.spec.ts anywhere, plus every tests/e2e/**/*.spec.ts.
// Explicit rather than incidental: now that ordinary-source eligibility below
// is repository-wide, a *.spec.ts under tests/e2e/ would otherwise match the
// ordinary `.ts` shape merely because it is no longer confined to
// src/config/scripts.
function isPlaywrightOnlyProofPath(filePath: string): boolean {
  if (filePath.endsWith('.browser.spec.ts') || filePath.endsWith('.visual.spec.ts')) {
    return true;
  }

  return filePath.startsWith('tests/e2e/') && filePath.endsWith('.spec.ts');
}

/**
 * A path shaped like a Vitest-owned test file, matching `vitest.config.ts`'s
 * real `include` globs (`src/**`, `config/**`, `scripts/**`, root
 * `eslint.config.test.ts`/`playwright.<name>.test.ts`, and
 * `tests/e2e/**\/*.test.mjs`; never `tests/e2e/**\/*.spec.ts`, which is
 * Playwright-owned).
 * @param filePath Repository-relative path.
 * @returns True when the path is Vitest-test-shaped.
 */
function isTestShapedPath(filePath: string): boolean {
  if (filePath.startsWith('tests/e2e/')) {
    return filePath.endsWith('.test.mjs');
  }

  if (filePath === 'eslint.config.test.ts' || ROOT_PLAYWRIGHT_TEST_PATTERN.test(filePath)) {
    return true;
  }

  return (
    UNIT_RELEVANT_PREFIXES.some((prefix) => filePath.startsWith(prefix)) &&
    (filePath.endsWith('.test.ts') || filePath.endsWith('.test.mjs'))
  );
}

/**
 * An ordinary (non-test) source/support path Vitest's own related-test
 * resolution can trace, deliberately excluding Playwright-only proof files.
 * Repository-wide by design: dependency-input eligibility for `vitest
 * related` is not the same concept as Vitest's test-discovery roots (see
 * `isTestShapedPath` and `docs/testing/verify-unit-impact-correction.md`), so
 * a plausible ordinary module/style/support path is eligible regardless of
 * whether it lives under `src/`, `config/`, `scripts/`, `tests/e2e/`, or the
 * repository root.
 * @param filePath Repository-relative path.
 * @returns True when the path is ordinary unit-relevant source.
 */
function isOrdinaryUnitSourcePath(filePath: string): boolean {
  // package.json has its own dedicated version-only/runtime-relevant
  // full-unit trigger (see checkInfrastructureTrigger below); it is never
  // ordinary pass-through source, so a version-only change stays skippable
  // instead of manufacturing an unwanted `vitest related package.json` input.
  if (
    isTestShapedPath(filePath) ||
    isPlaywrightOnlyProofPath(filePath) ||
    filePath === PACKAGE_JSON_PATH
  ) {
    return false;
  }

  return ORDINARY_SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension));
}

function isUnitRelevantByShape(filePath: string): boolean {
  return isTestShapedPath(filePath) || isOrdinaryUnitSourcePath(filePath);
}

const MATERIAL_ROOT_PREFIX = 'src/shared/ui/material/';
const FEATURES_ROOT_PREFIX = 'src/features/';
const RENDERER_BOUNDARY_EXTENSIONS = ['.css', '.vue', '.ts', '.mts', '.tsx'];
const COMPONENT_TOKENS_CSS_PATTERN = /^src\/shared\/ui\/material\/components\/[^/]+\/tokens\.css$/;
const STORYBOOK_BEHAVIOR_CENTRAL_PREFIX = 'tests/e2e/storybook/';
const COLOCATED_BROWSER_SPEC_SUFFIX = '.browser.spec.ts';
const COLOCATED_VISUAL_SPEC_SUFFIX = '.visual.spec.ts';
const APP_E2E_SPEC_DIR_PREFIX = 'tests/e2e/';

// src/readRecoveryImportBoundary.test.ts and
// src/features/fileSystemAccessImportBoundary.test.ts both recursively
// readFile every non-test .ts/.vue file under their respective root,
// excluding any path whose name contains ".test." (confirmed by direct read
// of collectProductionFiles/collectFeatureFiles).
function isNonTestBoundaryScanPath(filePath: string, prefix: string): boolean {
  return (
    filePath.startsWith(prefix) &&
    (filePath.endsWith('.ts') || filePath.endsWith('.vue')) &&
    !filePath.includes('.test.')
  );
}

// scripts/lib/e2eRisk.test.ts and scripts/lib/e2eProjectApplicability.test.ts
// each validate their registry against a NON-recursive readdirSync of
// tests/e2e/*.spec.ts direct children only (findAppE2ESpecFiles/
// findRootAppE2ESpecFiles), never the nested storybook/visual/release
// subdirectories.
function isRootAppE2ESpecPath(filePath: string): boolean {
  if (!filePath.startsWith(APP_E2E_SPEC_DIR_PREFIX) || !filePath.endsWith('.spec.ts')) {
    return false;
  }

  return !filePath.slice(APP_E2E_SPEC_DIR_PREFIX.length).includes('/');
}

/**
 * Confirmed bounded repository-scan owners. Each `matchesPath` predicate was
 * verified against the real scanning production code, not just the
 * consuming test file -- see `docs/testing/verify-unit-impact-correction.md`
 * decision #5 for the full audit.
 */
export const UNIT_SCAN_OWNERS: readonly UnitScanOwner[] = [
  {
    test: 'src/readRecoveryImportBoundary.test.ts',
    matchesPath: (filePath) => isNonTestBoundaryScanPath(filePath, 'src/'),
  },
  {
    test: 'src/features/fileSystemAccessImportBoundary.test.ts',
    matchesPath: (filePath) => isNonTestBoundaryScanPath(filePath, FEATURES_ROOT_PREFIX),
  },
  // rendererBoundary.test.ts's collectRuntimeFiles recursively scans
  // src/**/*.{css,vue,ts,mts,tsx} outside src/shared/ui/material/** with NO
  // ".test." exclusion at all (confirmed by direct read) -- unlike the two
  // scans above.
  {
    test: 'src/shared/ui/material/rendererBoundary.test.ts',
    matchesPath: (filePath) =>
      filePath.startsWith('src/') &&
      !filePath.startsWith(MATERIAL_ROOT_PREFIX) &&
      RENDERER_BOUNDARY_EXTENSIONS.some((extension) => filePath.endsWith(extension)),
  },
  // foundation/tokens.test.ts's getComponentTokenSources() does a
  // non-recursive readdirSync of src/shared/ui/material/components and reads
  // each entry's exact tokens.css when present -- a single path segment,
  // exact filename, non-recursive.
  {
    test: 'src/shared/ui/material/foundation/tokens.test.ts',
    matchesPath: (filePath) => COMPONENT_TOKENS_CSS_PATTERN.test(filePath),
  },
  // playwright.lanes.test.ts scans the complete current Playwright spec
  // population it enumerates across all four lanes -- functionally the same
  // population isPlaywrightOnlyProofPath already recognizes.
  {
    test: 'playwright.lanes.test.ts',
    matchesPath: isPlaywrightOnlyProofPath,
  },
  {
    test: 'scripts/lib/e2eRisk.test.ts',
    matchesPath: isRootAppE2ESpecPath,
  },
  {
    test: 'scripts/lib/e2eProjectApplicability.test.ts',
    matchesPath: isRootAppE2ESpecPath,
  },
  // storybookBehaviorRisk.test.ts's validateStorybookBehaviorScenarioRegistry
  // scans BOTH the recursive legacy tests/e2e/storybook/**/*.spec.ts tree AND
  // the recursive colocated src/**/*.browser.spec.ts tree.
  {
    test: 'scripts/lib/storybookBehaviorRisk.test.ts',
    matchesPath: (filePath) =>
      (filePath.startsWith(STORYBOOK_BEHAVIOR_CENTRAL_PREFIX) && filePath.endsWith('.spec.ts')) ||
      (filePath.startsWith('src/') && filePath.endsWith(COLOCATED_BROWSER_SPEC_SUFFIX)),
  },
  // visualRisk.test.ts's findColocatedVisualSpecFiles() scans only the
  // recursive colocated src/**/*.visual.spec.ts tree; the legacy central
  // tests/e2e/visual/** subtree is full-lane-fallback only, not a
  // registry-coverage scan (confirmed by full read of visualRisk.ts).
  {
    test: 'scripts/lib/visualRisk.test.ts',
    matchesPath: (filePath) =>
      filePath.startsWith('src/') && filePath.endsWith(COLOCATED_VISUAL_SPEC_SUFFIX),
  },
];

interface RegistryValidation {
  valid: boolean;
  errors: string[];
}

function validateFileAsDataMappings(
  mappings: readonly UnitFileAsDataMapping[],
  fileExists: (filePath: string) => boolean,
): RegistryValidation {
  const errors: string[] = [];
  const seenSources = new Set<string>();

  for (const mapping of mappings) {
    if (mapping.source.length === 0) {
      errors.push('unit file-as-data mapping has an empty source');
      continue;
    }

    if (seenSources.has(mapping.source)) {
      errors.push(`unit file-as-data source ${mapping.source} is registered more than once`);
    }

    seenSources.add(mapping.source);

    if (mapping.tests.length === 0) {
      errors.push(`unit file-as-data mapping ${mapping.source} has no owning tests`);
      continue;
    }

    for (const test of mapping.tests) {
      if (!isTestShapedPath(test)) {
        errors.push(
          `unit file-as-data mapping ${mapping.source} references non-Vitest-owned test path ${test}`,
        );
        continue;
      }

      if (!fileExists(test)) {
        errors.push(`unit file-as-data mapping ${mapping.source} references missing test ${test}`);
      }
    }
  }

  return { valid: errors.length === 0, errors: uniqSorted(errors) };
}

function validateScanOwners(
  scanOwners: readonly UnitScanOwner[],
  fileExists: (filePath: string) => boolean,
): RegistryValidation {
  const errors: string[] = [];
  const seenTests = new Set<string>();

  for (const owner of scanOwners) {
    if (seenTests.has(owner.test)) {
      errors.push(`unit scan owner ${owner.test} is registered more than once`);
    }

    seenTests.add(owner.test);

    if (!isTestShapedPath(owner.test)) {
      errors.push(`unit scan owner ${owner.test} is not a Vitest-owned test path`);
      continue;
    }

    if (!fileExists(owner.test)) {
      errors.push(`unit scan owner ${owner.test} references missing test ${owner.test}`);
    }
  }

  return { valid: errors.length === 0, errors: uniqSorted(errors) };
}

/**
 * Resolve the unit-impact mode for the given status-aware changed paths, in
 * priority order: invalid (file-as-data or scan-owner registry failed
 * self-validation), full (unit-infrastructure risk, runtime-relevant
 * `package.json`, or a deleted/renamed unit-relevant path whose safe
 * surviving ownership cannot be established), focused (direct changed tests,
 * file-as-data relations, bounded scan-owner relations, and/or ordinary
 * source/support paths handed to Vitest's own related-test resolution), or
 * skip (no unit-relevant changes). Deleted/renamed status must be consumed
 * from `changedPaths` because removed/moved dependencies cannot be resolved
 * safely from the current filesystem alone. Bounded scan-owner relations are
 * evaluated for every status (including deletions), because a deleted path
 * still changes the real repository population its owning scan test
 * observes, even when the same path is not otherwise unit-relevant by shape
 * (for example a deleted Playwright spec).
 * @param changedPaths Status-aware changed paths from `changedPaths.ts`.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, candidate `relatedInputs` when focused, and
 * human-readable `reasons`.
 */
export function resolveUnitPlan(
  changedPaths: readonly ChangedPath[],
  {
    packageJsonOldRef = null,
    fileExists = isExistingFile,
    fileAsDataMappings = UNIT_FILE_AS_DATA_MAPPINGS,
  }: ResolveUnitPlanOptions = {},
): UnitPlan {
  const registryValidation = validateFileAsDataMappings(fileAsDataMappings, fileExists);
  const scanOwnerValidation = validateScanOwners(UNIT_SCAN_OWNERS, fileExists);

  if (!registryValidation.valid || !scanOwnerValidation.valid) {
    return {
      mode: 'invalid',
      relatedInputs: [],
      reasons: uniqSorted([...registryValidation.errors, ...scanOwnerValidation.errors]),
    };
  }

  const fullReasons: string[] = [];
  const relatedInputs = new Set<string>();
  const focusedReasons: string[] = [];
  let packageJsonChecked = false;

  const checkInfrastructureTrigger = (filePath: string): void => {
    if (FULL_UNIT_EXACT_FILES.has(filePath)) {
      fullReasons.push(`unit infrastructure path ${filePath} -> full unit`);
    }

    if (filePath === PACKAGE_JSON_PATH && !packageJsonChecked) {
      packageJsonChecked = true;

      if (isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef })) {
        fullReasons.push('runtime-relevant package.json change -> full unit');
      }
    }
  };

  const checkScanOwners = (filePath: string): void => {
    for (const owner of UNIT_SCAN_OWNERS) {
      if (owner.matchesPath(filePath)) {
        relatedInputs.add(owner.test);
        focusedReasons.push(`bounded scan owner ${owner.test} <- ${filePath}`);
      }
    }
  };

  for (const change of changedPaths) {
    if (change.status === 'renamed') {
      checkInfrastructureTrigger(change.oldPath);
      checkInfrastructureTrigger(change.newPath);
      checkScanOwners(change.oldPath);
      checkScanOwners(change.newPath);

      if (isUnitRelevantByShape(change.oldPath) || isUnitRelevantByShape(change.newPath)) {
        fullReasons.push(
          `renamed unit-relevant path ${change.oldPath} -> ${change.newPath}; safe surviving ownership cannot be resolved from the current tree -> full unit`,
        );
      }

      continue;
    }

    checkInfrastructureTrigger(change.path);
    checkScanOwners(change.path);

    if (change.status === 'deleted') {
      if (isUnitRelevantByShape(change.path)) {
        fullReasons.push(`deleted unit-relevant path ${change.path} -> full unit`);
      }

      continue;
    }

    // added | modified
    const mapping = fileAsDataMappings.find((entry) => entry.source === change.path);

    if (mapping) {
      for (const test of mapping.tests) {
        relatedInputs.add(test);
      }

      focusedReasons.push(`file-as-data relation ${change.path} -> ${mapping.tests.join(', ')}`);
    }

    if (isTestShapedPath(change.path) && fileExists(change.path)) {
      relatedInputs.add(change.path);
      focusedReasons.push(`changed unit test ${change.path} -> ${change.path}`);
      continue;
    }

    // A mapping is always additive to real ordinary-source pass-through,
    // never exclusive: an exact file-as-data mapping exists for a
    // non-import consumption relation Vitest related cannot discover, but
    // that never suppresses whatever real import-based relation the same
    // path also has -- see docs/testing/verify-unit-impact-correction.md
    // decision #4 ("mapped CSS must not suppress real CSS import consumers").
    if (isOrdinaryUnitSourcePath(change.path)) {
      relatedInputs.add(change.path);
      focusedReasons.push(`unit-relevant source ${change.path} -> Vitest related resolution`);
    }
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', relatedInputs: [], reasons: uniqSorted(fullReasons) };
  }

  if (relatedInputs.size > 0) {
    return {
      mode: 'focused',
      relatedInputs: uniqSorted([...relatedInputs]),
      reasons: uniqSorted(focusedReasons),
    };
  }

  return { mode: 'skip', relatedInputs: [], reasons: ['no unit-relevant changes'] };
}
