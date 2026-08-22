/**
 * Release Playwright specifications executed by the existing artifact,
 * release-smoke, and managed-update release contracts. The nested
 * managed-update groups preserve the orchestrator's required execution
 * order and fresh-container isolation boundaries.
 */
export interface ReleaseSpecExecutionInventory {
  /** Specifications executed by the artifact release contract. */
  readonly artifact: readonly string[];
  /** Specifications executed by the first-user/returning-user smoke contract. */
  readonly releaseSmoke: readonly string[];
  /** Specifications executed by the four managed-update release proof groups. */
  readonly managedUpdates: {
    /** Lifecycle proof group executed in its first fresh container. */
    readonly lifecycle: readonly string[];
    /** Controller upgrade and migration-isolation proof group. */
    readonly migrationIsolation: readonly string[];
    /** Cross-engine lifecycle proof group. */
    readonly crossEngine: readonly string[];
    /** Managed release data-compatibility proof group. */
    readonly dataCompatibility: readonly string[];
  };
}

/**
 * Current release-spec execution membership shared by release command
 * construction, managed-update orchestration, and release-impact planning.
 */
export const RELEASE_SPEC_EXECUTION_INVENTORY: ReleaseSpecExecutionInventory = {
  artifact: ['tests/e2e/release/productionArtifactSmoke.spec.ts'],
  releaseSmoke: ['tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts'],
  managedUpdates: {
    lifecycle: [
      'tests/e2e/release/managedUpdatesLifecycle.spec.ts',
      'tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts',
      'tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts',
      'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
      'tests/e2e/release/managedUpdatesRecovery.spec.ts',
      'tests/e2e/release/managedUpdatesVueBootFailure.spec.ts',
      'tests/e2e/release/managedUpdatesRollbackDiagnostics.spec.ts',
    ],
    migrationIsolation: [
      'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
      'tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts',
      'tests/e2e/release/managedUpdatesDevelop.spec.ts',
      'tests/e2e/release/managedUpdatesMigration.spec.ts',
    ],
    crossEngine: ['tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts'],
    dataCompatibility: ['tests/e2e/release/managedReleaseDataCompatibility.spec.ts'],
  },
};
