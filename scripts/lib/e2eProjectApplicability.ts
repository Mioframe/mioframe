import fs from 'node:fs';

const E2E_TARGET_ROOTS = ['tests/e2e/pages', 'tests/e2e/widgets'];
const E2E_DIR_PREFIX = 'tests/e2e/';
const TARGET_SUFFIX = '.e2e.spec.ts';

/** Playwright project names this module resolves ignore lists for. */
export const DESKTOP_PROJECT_NAME = 'chromium';
export const MOBILE_PROJECT_NAME = 'Mobile Chrome';

/** Which Playwright project(s) a target E2E spec must run in. */
export type E2EProjectApplicability = 'desktop' | 'mobile' | 'both';

/** One explicit spec -> project-applicability entry. */
export interface E2EProjectApplicabilityEntry {
  spec: string;
  applicability: E2EProjectApplicability;
}

const VALID_APPLICABILITY_VALUES = new Set<E2EProjectApplicability>(['desktop', 'mobile', 'both']);

/**
 * Explicit project applicability for every current target E2E spec.
 * Separate from primary/additional E2E ownership: this
 * registry owns which Playwright project(s) a spec runs in, never which
 * specs a source change selects. Every `tests/e2e/pages/<Owner>/**` /
 * `tests/e2e/widgets/<Owner>/**` `*.e2e.spec.ts` file, including
 * `productionArtifact/` specs, must have exactly one entry here, or
 * {@link validateE2EProjectApplicability} fails.
 */
export const E2E_PROJECT_APPLICABILITY: readonly E2EProjectApplicabilityEntry[] = [
  { spec: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', applicability: 'both' },
  { spec: 'tests/e2e/pages/Settings/settingsToggles.e2e.spec.ts', applicability: 'both' },
  {
    spec: 'tests/e2e/widgets/DocumentView/reorderSurfaceBottomSheet.e2e.spec.ts',
    applicability: 'both',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/reorderSurfaceTouch.e2e.spec.ts',
    applicability: 'mobile',
  },
  {
    spec: 'tests/e2e/pages/HomePane/browserStoragePersistence.e2e.spec.ts',
    applicability: 'desktop',
  },
  { spec: 'tests/e2e/pages/Settings/appUpdatesEntry.e2e.spec.ts', applicability: 'desktop' },
  {
    spec: 'tests/e2e/pages/Settings/browserStoragePersistence.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/pages/AppUpdatesPane/appUpdatesNavigation.e2e.spec.ts',
    applicability: 'desktop',
  },
  { spec: 'tests/e2e/pages/Help/helpNavigation.e2e.spec.ts', applicability: 'desktop' },
  { spec: 'tests/e2e/pages/RepoExplorer/repoExplorerScreen.e2e.spec.ts', applicability: 'desktop' },
  {
    spec: 'tests/e2e/widgets/DocumentView/databasePersistenceSmoke.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/databaseItemFlows.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/databasePropertyFlows.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/databaseViewsAndQueryFlows.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/databaseVirtualizationFlows.e2e.spec.ts',
    applicability: 'both',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/reorderSurfaceCancellation.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/reorderSurfaceMouse.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/reorderSurfacePersistence.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/RepositoryExplorerWidget/exportDocumentBrowserStorage.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/RepositoryExplorerWidget/zipActionFlows.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts',
    applicability: 'desktop',
  },
  {
    spec: 'tests/e2e/widgets/DocumentView/productionArtifact/managedReleaseDataCompatibility.e2e.spec.ts',
    applicability: 'desktop',
  },
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

function isTargetE2ESpecPath(filePath: string): boolean {
  return (
    filePath.startsWith(E2E_DIR_PREFIX) &&
    filePath.endsWith(TARGET_SUFFIX) &&
    E2E_TARGET_ROOTS.some((root) => filePath.startsWith(`${root}/`))
  );
}

function listFilesRecursively(root: string): string[] {
  const results: string[] = [];

  const walk = (dir: string): void => {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = `${dir}/${entry.name}`;

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

function findTargetE2ESpecFiles(): string[] {
  return uniqSorted(
    E2E_TARGET_ROOTS.flatMap((root) =>
      listFilesRecursively(root).filter((filePath) => filePath.endsWith(TARGET_SUFFIX)),
    ),
  );
}

/**
 * Resolve the path-safe, testDir-relative ignore patterns a Playwright
 * project must add to its `testIgnore` to exclude specs not applicable to
 * it. Returns the spec path relative to `playwright.config.ts`'s
 * `tests/e2e` testDir (e.g. `pages/HomePane/appSmoke.e2e.spec.ts`), not a
 * bare basename: a nested target path is not guaranteed to have a unique
 * basename, so basename-only matching is not a durable contract. Only
 * entries for the opposite platform are ignored, so a spec with no registry
 * entry is never added to either list and runs in both projects by default
 * (fail-safe for direct/raw Playwright collection).
 * @param projectName Target Playwright project name.
 * @param [entries] Applicability registry to resolve against.
 * @returns Sorted unique testDir-relative path patterns to ignore for the given project.
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
      .map((entry) => entry.spec.slice(E2E_DIR_PREFIX.length)),
  );
}

/** Validation result for the target E2E project applicability registry. */
export interface E2EProjectApplicabilityValidation {
  valid: boolean;
  errors: string[];
}

/** Test-only overrides for {@link validateE2EProjectApplicability}. */
export interface ValidateE2EProjectApplicabilityOverrides {
  entries?: readonly E2EProjectApplicabilityEntry[];
  findTargetSpecFiles?: () => string[];
}

/**
 * Validate the project applicability registry as a verification contract:
 * every entry must reference an existing target E2E spec with a valid
 * applicability value, entries must not duplicate a spec, and every target
 * E2E spec on disk (recursively under `tests/e2e/pages/**` and
 * `tests/e2e/widgets/**`, including `productionArtifact/` specs) must have
 * an entry. A broken registry must fail verification rather than silently
 * run a reduced or wrong project matrix.
 * @param [overrides] Test-only overrides for the registry and spec discovery.
 * Production callers should omit this so the real registry and workspace
 * state are validated.
 * @returns Validation result with `valid` and human-readable `errors`.
 */
export function validateE2EProjectApplicability(
  overrides: ValidateE2EProjectApplicabilityOverrides = {},
): E2EProjectApplicabilityValidation {
  const entries = overrides.entries ?? E2E_PROJECT_APPLICABILITY;
  const findTargetSpecFiles = overrides.findTargetSpecFiles ?? findTargetE2ESpecFiles;
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

    if (!isTargetE2ESpecPath(entry.spec)) {
      errors.push(`project applicability entry references non-app-e2e spec ${entry.spec}`);
      continue;
    }

    if (!isExistingFile(entry.spec)) {
      errors.push(`project applicability entry references missing spec ${entry.spec}`);
    }
  }

  for (const spec of findTargetSpecFiles()) {
    if (!seenSpecs.has(spec)) {
      errors.push(
        `app e2e spec ${spec} has no project applicability entry in scripts/lib/e2eProjectApplicability.ts`,
      );
    }
  }

  return { valid: errors.length === 0, errors: uniqSorted(errors) };
}
