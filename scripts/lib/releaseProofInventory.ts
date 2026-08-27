import fs from 'node:fs';

/**
 * Single source of truth for the exceptional release-browser execution
 * membership: the fresh-container/cross-engine `artifact` and
 * `managed-updates-browser-integration` browser-integration leaves, and the
 * `release-smoke` and `managed-updates-e2e` productionArtifact E2E leaves
 * (see docs/testing/verify-redesign-final-review-correction.md's
 * "Decision 2"). Both the affected planners (`browserIntegrationRisk.ts`,
 * `e2eRisk.ts`) and the real execution runner
 * (`scripts/release/managedUpdatesProof.ts`) consume this exact inventory,
 * so there is exactly one place this membership can be edited, and one
 * fail-closed equality check against the current filesystem before either
 * planner may select from it.
 */

const APP_UPDATE_DIR = 'src/shared/service/appUpdate/';
const BROWSER_INTEGRATION_SUFFIX = '.browser-integration.spec.ts';
const PAGES_PRODUCTION_ARTIFACT_DIR = 'tests/e2e/pages';
const WIDGETS_PRODUCTION_ARTIFACT_DIR = 'tests/e2e/widgets';
const PRODUCTION_ARTIFACT_SEGMENT = 'productionArtifact';
const E2E_SUFFIX = '.e2e.spec.ts';

/** The single browser-integration spec owned by the `artifact` leaf. */
export const PRODUCTION_ARTIFACT_SMOKE_SPEC = `${APP_UPDATE_DIR}productionArtifactSmoke${BROWSER_INTEGRATION_SUFFIX}`;

/** The single productionArtifact E2E spec owned by the `release-smoke` leaf. */
export const RELEASE_SMOKE_SPEC =
  'tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts';

// Browser-integration managed-update groups: every spec here verifies an
// isolated browser/runtime contract, never a complete product scenario, so
// this whole set runs as the `managed-updates-browser-integration` proof
// leaf. Fixed run order: each group must complete before the next starts
// (see scripts/release/managedUpdatesProof.ts).

export const MANAGED_UPDATES_LIFECYCLE_LABEL = 'managed-updates-lifecycle';
export const MANAGED_UPDATES_LIFECYCLE_SPECS: readonly string[] = [
  'src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesAutomaticCheck.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesUncontrolledWindow.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesRecovery.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesVueBootFailure.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesRollbackDiagnostics.browser-integration.spec.ts',
];

export const MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL = 'managed-updates-migration-isolation';
export const MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS: readonly string[] = [
  'src/shared/service/appUpdate/managedUpdatesControllerUpgrade.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesDevelop.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesMigration.browser-integration.spec.ts',
];

export const MANAGED_UPDATES_CROSS_ENGINE_LABEL = 'managed-updates-cross-engine';
export const MANAGED_UPDATES_CROSS_ENGINE_SPECS: readonly string[] = [
  'src/shared/service/appUpdate/managedUpdatesCrossEngineLifecycle.browser-integration.spec.ts',
];

/** One fixed execution group: a diagnostic label plus its ordered spec list. */
export interface ReleaseProofGroup {
  label: string;
  specs: readonly string[];
}

/** Fixed run order for the browser-integration proof leaf. */
export const MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS: readonly ReleaseProofGroup[] = [
  { label: MANAGED_UPDATES_LIFECYCLE_LABEL, specs: MANAGED_UPDATES_LIFECYCLE_SPECS },
  {
    label: MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
    specs: MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  },
  { label: MANAGED_UPDATES_CROSS_ENGINE_LABEL, specs: MANAGED_UPDATES_CROSS_ENGINE_SPECS },
];

// E2E managed-update groups: each spec here is a complete product scenario,
// so this set runs as the `managed-updates-e2e` proof leaf. Fixed run
// order: activation-UI, then data-compatibility.

export const MANAGED_UPDATES_ACTIVATION_UI_LABEL = 'managed-updates-activation-ui';
export const MANAGED_UPDATES_ACTIVATION_UI_SPECS: readonly string[] = [
  'tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts',
];

/**
 * Verifier/container label and spec for the managed-release data-
 * compatibility proof leaf (see
 * `scripts/release/runManagedReleaseDataCompatibilityProof.mjs`). Defined
 * here, not there: this module is the sole owner of every exceptional
 * release-browser execution membership constant, including this one (see
 * docs/testing/verify-redesign-final-review-correction-02-agent-task.md's
 * "Make releaseProofInventory.ts the sole exceptional membership owner");
 * the runner file consumes these constants instead of defining them.
 */
export const MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL = 'managed-updates-data-compatibility';
export const MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC =
  'tests/e2e/widgets/DocumentView/productionArtifact/managedReleaseDataCompatibility.e2e.spec.ts';

/** Fixed run order for the E2E proof leaf. */
export const MANAGED_UPDATES_E2E_GROUPS: readonly ReleaseProofGroup[] = [
  { label: MANAGED_UPDATES_ACTIVATION_UI_LABEL, specs: MANAGED_UPDATES_ACTIVATION_UI_SPECS },
  {
    label: MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
    specs: [MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC],
  },
];

/** Every browser-integration spec registered across the exceptional inventory. */
export const REGISTERED_BROWSER_INTEGRATION_SPECS: readonly string[] = [
  PRODUCTION_ARTIFACT_SMOKE_SPEC,
  ...MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS.flatMap((group) => group.specs),
];

/** Every productionArtifact E2E spec registered across the exceptional inventory. */
export const REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS: readonly string[] = [
  RELEASE_SMOKE_SPEC,
  ...MANAGED_UPDATES_E2E_GROUPS.flatMap((group) => group.specs),
];

/** The exact spec set that routes through the `managed-updates-e2e` leaf. */
export const MANAGED_UPDATES_E2E_SPEC_SET: ReadonlySet<string> = new Set(
  MANAGED_UPDATES_E2E_GROUPS.flatMap((group) => group.specs),
);

/** The exact spec set that routes through the `managed-updates-browser-integration` leaf. */
export const MANAGED_UPDATES_BROWSER_INTEGRATION_SPEC_SET: ReadonlySet<string> = new Set(
  MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS.flatMap((group) => group.specs),
);

/** Result of validating one exceptional release-proof spec-set equality check. */
export interface ReleaseProofInventoryValidation {
  valid: boolean;
  errors: string[];
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates].sort((left, right) => left.localeCompare(right));
}

function validateSetEquality(
  registered: readonly string[],
  filesystem: readonly string[],
  { kind }: { kind: string },
): ReleaseProofInventoryValidation {
  const errors: string[] = [];

  for (const duplicate of findDuplicates(registered)) {
    errors.push(`${kind} registry contains duplicate entry ${duplicate}`);
  }

  const registeredSet = new Set(registered);
  const filesystemSet = new Set(filesystem);

  for (const filePath of filesystemSet) {
    if (!registeredSet.has(filePath)) {
      errors.push(
        `${kind} spec ${filePath} exists on disk but is not registered in scripts/lib/releaseProofInventory.ts`,
      );
    }
  }

  for (const filePath of registeredSet) {
    if (!filesystemSet.has(filePath)) {
      errors.push(
        `${kind} spec ${filePath} is registered in scripts/lib/releaseProofInventory.ts but does not exist on disk`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Test-only dependencies for filesystem-scanning validation functions. */
export interface ReleaseProofInventoryDeps {
  listDirectoryFileNames?: (dirPath: string) => string[];
  listFilesRecursively?: (root: string) => string[];
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

/**
 * Validate that the registered browser-integration exceptional inventory
 * (the `artifact` spec plus every managed-update browser-integration group
 * spec) equals, exactly, every direct
 * `src/shared/service/appUpdate/*.browser-integration.spec.ts` file
 * currently on disk. A filesystem file missing from the registry, or a
 * registered entry missing from disk, fails closed.
 * @param [deps] Test-only dependencies.
 * @returns Validation result.
 */
export function validateBrowserIntegrationMembership({
  listDirectoryFileNames = defaultListDirectoryFileNames,
}: ReleaseProofInventoryDeps = {}): ReleaseProofInventoryValidation {
  const filesystemSpecs = listDirectoryFileNames(APP_UPDATE_DIR.slice(0, -1))
    .filter((name) => name.endsWith(BROWSER_INTEGRATION_SUFFIX))
    .map((name) => `${APP_UPDATE_DIR}${name}`);

  return validateSetEquality(REGISTERED_BROWSER_INTEGRATION_SPECS, filesystemSpecs, {
    kind: 'appUpdate browser-integration',
  });
}

function isProductionArtifactE2EPath(filePath: string): boolean {
  const segments = filePath.split('/');
  return segments.includes(PRODUCTION_ARTIFACT_SEGMENT) && filePath.endsWith(E2E_SUFFIX);
}

/**
 * Validate that the registered productionArtifact E2E exceptional
 * inventory (the `release-smoke` spec plus every managed-update E2E group
 * spec) equals, exactly, every `productionArtifact/*.e2e.spec.ts` file
 * currently on disk under `tests/e2e/pages/**` or `tests/e2e/widgets/**`. A
 * filesystem file missing from the registry, or a registered entry missing
 * from disk, fails closed.
 * @param [deps] Test-only dependencies.
 * @returns Validation result.
 */
export function validateProductionArtifactE2EMembership({
  listFilesRecursively = defaultListFilesRecursively,
}: ReleaseProofInventoryDeps = {}): ReleaseProofInventoryValidation {
  const filesystemSpecs = [
    ...listFilesRecursively(PAGES_PRODUCTION_ARTIFACT_DIR),
    ...listFilesRecursively(WIDGETS_PRODUCTION_ARTIFACT_DIR),
  ].filter(isProductionArtifactE2EPath);

  return validateSetEquality(REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS, filesystemSpecs, {
    kind: 'productionArtifact E2E',
  });
}
