import { fileURLToPath } from 'node:url';

import { applyProcessResult } from '../lib/processResult.ts';
import { runLocalCommand } from '../lib/runLocalCommand.ts';
import { MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL } from './runManagedReleaseDataCompatibilityProof.mjs';

const E2E_RELEASE_CONTAINER_SCRIPT = 'scripts/e2eReleaseContainer.mjs';

// Browser-integration managed-update groups (see
// docs/testing/verify-redesign-implementation-preflight.md's "Managed-updates
// grouping"): every spec here verifies an isolated browser/runtime contract,
// never a complete product scenario, so this whole set runs as the
// `managed-updates-browser-integration` proof leaf only. Controller artifact
// byte identity is no longer here at all — it is static proof (see
// scripts/release/managedUpdatesControllerArtifactIdentityProof.mjs) and no
// longer requires Playwright. The E2E activation-UI scenario also used to
// share this file's first group; it now runs separately under
// MANAGED_UPDATES_E2E_GROUPS below.

// Group 1: lifecycle, automatic check, uncontrolled-window, and worker-owned
// recovery/boot-failure/rollback specs. Runs in its own fresh Playwright
// container.
export const MANAGED_UPDATES_LIFECYCLE_LABEL = 'managed-updates-lifecycle';
export const MANAGED_UPDATES_LIFECYCLE_SPECS = [
  'tests/e2e/release/managedUpdatesLifecycle.spec.ts',
  'tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts',
  'tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts',
  'tests/e2e/release/managedUpdatesRecovery.spec.ts',
  'tests/e2e/release/managedUpdatesVueBootFailure.spec.ts',
  'tests/e2e/release/managedUpdatesRollbackDiagnostics.spec.ts',
];

// Group 2: controller-upgrade, develop, and migration specs (Chromium).
// Runs in a second fresh Playwright container, only after group 1 passes.
// managedUpdatesControllerUpgrade.spec.ts runs first within this fresh
// Chromium container, before the longer migration suites.
export const MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL = 'managed-updates-migration-isolation';
export const MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS = [
  'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
  'tests/e2e/release/managedUpdatesDevelop.spec.ts',
  'tests/e2e/release/managedUpdatesMigration.spec.ts',
];

// Group 3: the narrow cross-engine lifecycle smoke, run on Firefox and
// WebKit only (via playwright.release.config.ts's own project entries;
// Chromium's project excludes it). Runs in a third fresh Playwright
// container, only after group 2 passes.
export const MANAGED_UPDATES_CROSS_ENGINE_LABEL = 'managed-updates-cross-engine';
export const MANAGED_UPDATES_CROSS_ENGINE_SPECS = [
  'tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts',
];

// Fixed run order for the browser-integration proof leaf: each group must
// complete before the next starts.
export const MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS = [
  { label: MANAGED_UPDATES_LIFECYCLE_LABEL, specs: MANAGED_UPDATES_LIFECYCLE_SPECS },
  {
    label: MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
    specs: MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  },
  { label: MANAGED_UPDATES_CROSS_ENGINE_LABEL, specs: MANAGED_UPDATES_CROSS_ENGINE_SPECS },
];

// E2E managed-update groups: each spec here is a complete product scenario,
// so this set runs as the `managed-updates-e2e` proof leaf only, after the
// browser-integration leaf has entirely passed (enforced by their relative
// order among scripts/verify.ts's release-only commands, which share the
// same fail-fast expensive-command skip on any earlier failure).

// Group 1: the Stage 7 activation-UI product scenario. Runs in its own
// fresh Playwright container.
export const MANAGED_UPDATES_ACTIVATION_UI_LABEL = 'managed-updates-activation-ui';
export const MANAGED_UPDATES_ACTIVATION_UI_SPECS = [
  'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
];

// Group 2: the data-compatibility publication gate's own browser proof (see
// scripts/pages/lib/managedCompatibilityPreflight.mjs), run hermetically
// against two releases it builds and publishes itself. Runs in a second
// fresh Playwright container, only after group 1 passes.
export const MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS = [
  'tests/e2e/release/managedReleaseDataCompatibility.spec.ts',
];

export const MANAGED_UPDATES_E2E_GROUPS = [
  { label: MANAGED_UPDATES_ACTIVATION_UI_LABEL, specs: MANAGED_UPDATES_ACTIVATION_UI_SPECS },
  {
    label: MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
    specs: MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS,
  },
];

const defaultDeps = {
  runLocalCommand,
};

function isPassingResult(result) {
  return result.signal === null && result.status === 0;
}

/**
 * Runs a fixed list of groups sequentially, each in its own fresh Playwright
 * container via `scripts/e2eReleaseContainer.mjs` (see `pnpm e2e:release`). A
 * later group never starts unless every earlier group passes; the aggregate
 * result preserves whichever group's exact exit status or termination signal
 * caused the run to stop. Shared by both
 * {@link runManagedUpdatesBrowserIntegrationProof} and
 * {@link runManagedUpdatesE2EProof} so the fresh-container orchestration
 * itself is not duplicated between the two proof leaves.
 * @param groups Fixed, ordered group list to run.
 * @param options Run options.
 * @param options.env Environment forwarded to each container child process.
 * @param deps Test seams for child-process execution.
 * @returns The last group's normalized `{ status, signal }` result.
 */
async function runGroupsSequentially(groups, { env }, deps) {
  let lastResult = { status: 0, signal: null };

  for (const group of groups) {
    // oxlint-disable-next-line no-await-in-loop -- groups must run sequentially, and a later group must never start after an earlier group's failure.
    lastResult = await deps.runLocalCommand({
      command: 'node',
      args: [E2E_RELEASE_CONTAINER_SCRIPT, '--label', group.label, ...group.specs],
      env,
    });

    if (!isPassingResult(lastResult)) {
      return lastResult;
    }
  }

  return lastResult;
}

/**
 * Runs every browser-integration managed-update group (see
 * {@link MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS}) as the
 * `managed-updates-browser-integration` verifier proof leaf.
 * @param [options] Run options.
 * @param [options.env] Environment forwarded to each container child
 * process; carries forward the verification lock env and
 * `RELEASE_ARTIFACT_SKIP_BUILD` because it defaults to this process's own
 * inherited environment.
 * @param [options.groups] Override for the fixed group list, for tests only.
 * @param [deps] Test seams for child-process execution.
 * @returns The last group's normalized `{ status, signal }` result.
 */
export async function runManagedUpdatesBrowserIntegrationProof(
  { env = process.env, groups = MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS } = {},
  deps = defaultDeps,
) {
  return runGroupsSequentially(groups, { env }, deps);
}

/**
 * Runs every E2E managed-update group (see {@link MANAGED_UPDATES_E2E_GROUPS})
 * as the `managed-updates-e2e` verifier proof leaf.
 * @param [options] Run options.
 * @param [options.env] Environment forwarded to each container child
 * process; carries forward the verification lock env and
 * `RELEASE_ARTIFACT_SKIP_BUILD` because it defaults to this process's own
 * inherited environment.
 * @param [options.groups] Override for the fixed group list, for tests only.
 * @param [deps] Test seams for child-process execution.
 * @returns The last group's normalized `{ status, signal }` result.
 */
export async function runManagedUpdatesE2EProof(
  { env = process.env, groups = MANAGED_UPDATES_E2E_GROUPS } = {},
  deps = defaultDeps,
) {
  return runGroupsSequentially(groups, { env }, deps);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kindIndex = process.argv.indexOf('--kind');
  const kind = kindIndex !== -1 ? process.argv[kindIndex + 1] : null;

  if (kind !== 'browser-integration' && kind !== 'e2e') {
    console.error(
      'scripts/release/managedUpdatesProof.mjs requires --kind browser-integration|e2e',
    );
    process.exitCode = 1;
  } else {
    const result =
      kind === 'e2e'
        ? await runManagedUpdatesE2EProof()
        : await runManagedUpdatesBrowserIntegrationProof();
    applyProcessResult(result);
  }
}
