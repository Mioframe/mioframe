import { fileURLToPath } from 'node:url';

import { applyProcessResult } from '../lib/processResult.mjs';
import { runLocalCommand } from '../lib/runLocalCommand.mjs';
import { MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL } from './runManagedReleaseDataCompatibilityProof.mjs';

const E2E_RELEASE_CONTAINER_SCRIPT = 'scripts/e2eReleaseContainer.mjs';

// Group 1: lifecycle, Automatic check, uncontrolled-window, the Stage 7
// activation-UI specs, and worker-owned recovery. Runs in its own fresh
// Playwright container.
export const MANAGED_UPDATES_LIFECYCLE_LABEL = 'managed-updates-lifecycle';
export const MANAGED_UPDATES_LIFECYCLE_SPECS = [
  'tests/e2e/release/managedUpdatesLifecycle.spec.ts',
  'tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts',
  'tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts',
  'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
  'tests/e2e/release/managedUpdatesRecovery.spec.ts',
  'tests/e2e/release/managedUpdatesVueBootFailure.spec.ts',
];

// Group 2: controller-upgrade, develop, and migration specs (Chromium).
// Runs in a second fresh Playwright container, only after group 1 passes.
// managedUpdatesControllerUpgrade.spec.ts runs first within this fresh
// Chromium container, before the longer migration suites.
export const MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL = 'managed-updates-migration-isolation';
export const MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS = [
  'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
  'tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts',
  'tests/e2e/release/managedUpdatesDevelop.spec.ts',
  'tests/e2e/release/managedUpdatesMigration.spec.ts',
];

// Group 3: the narrow cross-engine lifecycle smoke, run on Firefox and
// WebKit only (via this file's own Playwright project entries; Chromium's
// project excludes it). Runs in a third fresh Playwright container, only
// after group 2 passes, isolated from the Chromium migration/isolation
// proof above.
export const MANAGED_UPDATES_CROSS_ENGINE_LABEL = 'managed-updates-cross-engine';
export const MANAGED_UPDATES_CROSS_ENGINE_SPECS = [
  'tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts',
];

// Group 4: the data-compatibility publication gate's own browser proof (see
// scripts/pages/lib/managedCompatibilityPreflight.mjs), run hermetically
// against two releases it builds and publishes itself. Runs in a fourth
// fresh Playwright container, only after group 3 passes.
export const MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS = [
  'tests/e2e/release/managedReleaseDataCompatibility.spec.ts',
];

// Fixed run order: each group must complete before the next starts.
export const MANAGED_UPDATES_GROUPS = [
  { label: MANAGED_UPDATES_LIFECYCLE_LABEL, specs: MANAGED_UPDATES_LIFECYCLE_SPECS },
  {
    label: MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
    specs: MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  },
  { label: MANAGED_UPDATES_CROSS_ENGINE_LABEL, specs: MANAGED_UPDATES_CROSS_ENGINE_SPECS },
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
 * Run the managed-update release proof as four fixed sequential groups,
 * each in its own fresh Playwright container via
 * `scripts/e2eReleaseContainer.mjs` (see `pnpm e2e:release`). A later group
 * never starts unless every earlier group passes; the aggregate result
 * preserves whichever group's exact exit status or termination signal
 * caused the run to stop, so this owns only fixed
 * grouping/ordering/propagation — never a general test scheduler.
 * @param [options] Run options.
 * @param [options.env] Environment forwarded to each container child process;
 * carries forward the verification lock env and `RELEASE_ARTIFACT_SKIP_BUILD`
 * because it defaults to this process's own inherited environment.
 * @param [options.groups] Override for the fixed group list, for tests only.
 * @param [deps] Test seams for child-process execution.
 * @returns The last group's normalized `{ status, signal }` result.
 */
export async function runManagedUpdatesProof(
  { env = process.env, groups = MANAGED_UPDATES_GROUPS } = {},
  deps = defaultDeps,
) {
  let lastResult = { status: 0, signal: null };

  for (const group of groups) {
    // oxlint-disable-next-line no-await-in-loop -- groups must run sequentially, and group 2 must never start after a group 1 failure.
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runManagedUpdatesProof();
  applyProcessResult(result);
}
