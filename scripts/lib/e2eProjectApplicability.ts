import fs from 'node:fs';
import path from 'node:path';

const APP_E2E_SPEC_DIR = 'tests/e2e';
const APP_E2E_SPEC_PREFIX = `${APP_E2E_SPEC_DIR}/`;

/** Playwright project names this module resolves ignore lists for. */
export const DESKTOP_PROJECT_NAME = 'chromium';
export const MOBILE_PROJECT_NAME = 'Mobile Chrome';

/** Which Playwright project(s) an app e2e spec must run in. */
export type E2EProjectApplicability = 'desktop' | 'mobile' | 'both';

/** One explicit spec -> project-applicability entry. */
export interface E2EProjectApplicabilityEntry {
  spec: string;
  applicability: E2EProjectApplicability;
}

const VALID_APPLICABILITY_VALUES = new Set<E2EProjectApplicability>(['desktop', 'mobile', 'both']);

/**
 * Explicit project applicability for every current root application e2e
 * spec. Separate from {@link E2E_SCENARIO_SCOPES} in `e2eRisk.ts`: this
 * registry owns which Playwright project(s) a spec runs in, never which
 * specs a source change selects. Every `tests/e2e/*.spec.ts` file must have
 * exactly one entry here, or {@link validateE2EProjectApplicability} fails.
 */
export const E2E_PROJECT_APPLICABILITY: readonly E2EProjectApplicabilityEntry[] = [
  { spec: 'tests/e2e/appSmoke.spec.ts', applicability: 'both' },
  { spec: 'tests/e2e/reorderSurfaceBottomSheet.spec.ts', applicability: 'both' },
  { spec: 'tests/e2e/reorderSurfaceTouch.spec.ts', applicability: 'mobile' },
  { spec: 'tests/e2e/appUpdatesNavigation.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/browserStoragePersistenceSmoke.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/databasePersistenceSmoke.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/databaseItemFlows.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/databasePropertyFlows.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/databaseViewsAndQueryFlows.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/databaseVirtualizationFlows.spec.ts', applicability: 'both' },
  { spec: 'tests/e2e/exportDocumentBrowserStorage.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/helpNavigation.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/reorderSurfaceCancellation.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/reorderSurfaceMouse.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/reorderSurfacePersistence.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/repoExplorerScreen.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/repositoryFlows.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/zipActionFlows.spec.ts', applicability: 'desktop' },
];

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check whether a path is a root-level application e2e spec: directly under
 * `tests/e2e/`, not in a nested lane directory (`visual/`, `release/`,
 * `storybook/`, or any other subdirectory).
 * @param filePath Repository-relative path.
 * @returns True when the path is a root app e2e spec file path shape.
 */
function isRootAppE2ESpecPath(filePath: string): boolean {
  if (!filePath.startsWith(APP_E2E_SPEC_PREFIX) || !filePath.endsWith('.spec.ts')) {
    return false;
  }

  return !filePath.slice(APP_E2E_SPEC_PREFIX.length).includes('/');
}

function findRootAppE2ESpecFiles(specDir: string): string[] {
  return uniqSorted(
    fs
      .readdirSync(specDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
      .map((entry) => `${specDir}/${entry.name}`),
  );
}

/**
 * Resolve the basename-glob patterns a Playwright project must add to its
 * `testIgnore` to exclude specs not applicable to it. Only entries for the
 * opposite platform are ignored, so a spec with no registry entry is never
 * added to either list and runs in both projects by default (fail-safe for
 * direct/raw Playwright collection).
 * @param projectName Target Playwright project name.
 * @param [entries] Applicability registry to resolve against.
 * @returns Sorted unique basename patterns to ignore for the given project.
 */
export function getProjectIgnoredSpecs(
  projectName: typeof DESKTOP_PROJECT_NAME | typeof MOBILE_PROJECT_NAME,
  entries: readonly E2EProjectApplicabilityEntry[] = E2E_PROJECT_APPLICABILITY,
): string[] {
  const excludedApplicability: E2EProjectApplicability =
    projectName === DESKTOP_PROJECT_NAME ? 'mobile' : 'desktop';

  return uniqSorted(
    entries
      .filter((entry) => entry.applicability === excludedApplicability)
      .map((entry) => path.posix.basename(entry.spec)),
  );
}

/** Validation result for the app e2e project applicability registry. */
export interface E2EProjectApplicabilityValidation {
  valid: boolean;
  errors: string[];
}

/** Test-only overrides for {@link validateE2EProjectApplicability}. */
export interface ValidateE2EProjectApplicabilityOverrides {
  entries?: readonly E2EProjectApplicabilityEntry[];
  specDir?: string;
}

/**
 * Validate the project applicability registry as a verification contract:
 * every entry must reference an existing root app e2e spec with a valid
 * applicability value, entries must not duplicate a spec, and every root app
 * e2e spec on disk must have an entry. A broken registry must fail
 * verification rather than silently run a reduced or wrong project matrix.
 * @param [overrides] Test-only overrides for the registry and spec directory.
 * Production callers should omit this so the real registry and workspace
 * state are validated.
 * @returns Validation result with `valid` and human-readable `errors`.
 */
export function validateE2EProjectApplicability(
  overrides: ValidateE2EProjectApplicabilityOverrides = {},
): E2EProjectApplicabilityValidation {
  const entries = overrides.entries ?? E2E_PROJECT_APPLICABILITY;
  const specDir = overrides.specDir ?? APP_E2E_SPEC_DIR;
  const errors: string[] = [];
  const seenSpecs = new Set<string>();

  for (const entry of entries) {
    if (seenSpecs.has(entry.spec)) {
      errors.push(`duplicate project applicability entry for spec ${entry.spec}`);
    }

    seenSpecs.add(entry.spec);

    if (!VALID_APPLICABILITY_VALUES.has(entry.applicability)) {
      errors.push(
        `project applicability entry for spec ${entry.spec} has invalid applicability value ${entry.applicability}`,
      );
      continue;
    }

    if (!isRootAppE2ESpecPath(entry.spec)) {
      errors.push(`project applicability entry references non-app-e2e spec ${entry.spec}`);
      continue;
    }

    if (!isExistingFile(entry.spec)) {
      errors.push(`project applicability entry references missing spec ${entry.spec}`);
    }
  }

  let specFiles: string[];

  try {
    specFiles = findRootAppE2ESpecFiles(specDir);
  } catch (error) {
    errors.push(
      `unable to list ${specDir}/*.spec.ts: ${error instanceof Error ? error.message : String(error)}`,
    );
    specFiles = [];
  }

  for (const spec of specFiles) {
    if (!seenSpecs.has(spec)) {
      errors.push(
        `app e2e spec ${spec} has no project applicability entry in scripts/lib/e2eProjectApplicability.ts`,
      );
    }
  }

  return { valid: errors.length === 0, errors: uniqSorted(errors) };
}
