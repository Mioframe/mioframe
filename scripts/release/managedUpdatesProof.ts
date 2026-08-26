import { fileURLToPath } from 'node:url';

import { applyProcessResult } from '../lib/processResult.ts';
import { runLocalCommand } from '../lib/runLocalCommand.ts';
import {
  MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
  MANAGED_UPDATES_ACTIVATION_UI_LABEL,
  MANAGED_UPDATES_ACTIVATION_UI_SPECS,
  MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS,
  MANAGED_UPDATES_CROSS_ENGINE_LABEL,
  MANAGED_UPDATES_CROSS_ENGINE_SPECS,
  MANAGED_UPDATES_E2E_GROUPS,
  MANAGED_UPDATES_LIFECYCLE_LABEL,
  MANAGED_UPDATES_LIFECYCLE_SPECS,
  MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
  MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  type ReleaseProofGroup,
} from '../lib/releaseProofInventory.ts';
import type { ProcessResult } from '../lib/processResult.ts';

/**
 * Runs the two exceptional managed-update proof leaves —
 * `managed-updates-browser-integration` and `managed-updates-e2e` — from the
 * single fixed group inventory registered in
 * `scripts/lib/releaseProofInventory.ts` (see
 * docs/testing/verify-redesign-final-review-correction.md's "Decision 2"):
 * that module is the sole source of truth for group membership and order;
 * this file owns only their fresh-container execution.
 *
 * Each proof leaf runs its own fixed groups sequentially, each in its own
 * fresh Playwright container (see `pnpm e2e:release`); a later group never
 * starts unless every earlier group in the same leaf passes. There is no
 * cross-type ordering: the browser-integration leaf and the E2E leaf are
 * independent proof leaves, and neither is required to finish before the
 * other starts (see docs/testing/verify-redesign-final-review-correction.md's
 * "Decision 7" — a stale comment previously claimed the whole
 * browser-integration type had to finish before E2E; `scripts/verify.ts`
 * never enforced that, and no accepted contract requires it).
 */

const E2E_RELEASE_CONTAINER_SCRIPT = 'scripts/e2eReleaseContainer.mjs';

export {
  MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
  MANAGED_UPDATES_ACTIVATION_UI_LABEL,
  MANAGED_UPDATES_ACTIVATION_UI_SPECS,
  MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS,
  MANAGED_UPDATES_CROSS_ENGINE_LABEL,
  MANAGED_UPDATES_CROSS_ENGINE_SPECS,
  MANAGED_UPDATES_E2E_GROUPS,
  MANAGED_UPDATES_LIFECYCLE_LABEL,
  MANAGED_UPDATES_LIFECYCLE_SPECS,
  MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
  MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
};

/** Test-only dependencies for the group runners. */
export interface ManagedUpdatesProofDeps {
  /** Test seam for child-process execution. */
  runLocalCommand: typeof runLocalCommand;
}

const defaultDeps: ManagedUpdatesProofDeps = {
  runLocalCommand,
};

function isPassingResult(result: ProcessResult): boolean {
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
 * @param groups - Fixed, ordered group list to run.
 * @param options - Run options.
 * @param deps - Test seams for child-process execution.
 * @returns The last group's normalized `{ status, signal }` result.
 */
async function runGroupsSequentially(
  groups: readonly ReleaseProofGroup[],
  { env }: { env: NodeJS.ProcessEnv },
  deps: ManagedUpdatesProofDeps,
): Promise<ProcessResult> {
  let lastResult: ProcessResult = { status: 0, signal: null };

  for (const group of groups) {
    // oxlint-disable-next-line no-await-in-loop -- groups must run sequentially, and a later group must never start after an earlier group's failure.
    // eslint-disable-next-line no-await-in-loop -- Groups must run sequentially, and a later group must never start after an earlier group's failure.
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

/** Run options shared by {@link runManagedUpdatesBrowserIntegrationProof} and {@link runManagedUpdatesE2EProof}. */
export interface RunManagedUpdatesProofOptions {
  /**
   * Environment forwarded to each container child process; carries forward
   * the verification lock env and `RELEASE_ARTIFACT_SKIP_BUILD` because it
   * defaults to this process's own inherited environment.
   */
  env?: NodeJS.ProcessEnv;
  /** Override for the fixed group list, for tests only. */
  groups?: readonly ReleaseProofGroup[];
}

/**
 * Runs every browser-integration managed-update group (see
 * {@link MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS}) as the
 * `managed-updates-browser-integration` verifier proof leaf.
 * @param options - Run options.
 * @param deps - Test seams for child-process execution.
 * @returns The last group's normalized `{ status, signal }` result.
 */
export async function runManagedUpdatesBrowserIntegrationProof(
  {
    env = process.env,
    groups = MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS,
  }: RunManagedUpdatesProofOptions = {},
  deps: ManagedUpdatesProofDeps = defaultDeps,
): Promise<ProcessResult> {
  return runGroupsSequentially(groups, { env }, deps);
}

/**
 * Runs every E2E managed-update group (see {@link MANAGED_UPDATES_E2E_GROUPS})
 * as the `managed-updates-e2e` verifier proof leaf.
 * @param options - Run options.
 * @param deps - Test seams for child-process execution.
 * @returns The last group's normalized `{ status, signal }` result.
 */
export async function runManagedUpdatesE2EProof(
  { env = process.env, groups = MANAGED_UPDATES_E2E_GROUPS }: RunManagedUpdatesProofOptions = {},
  deps: ManagedUpdatesProofDeps = defaultDeps,
): Promise<ProcessResult> {
  return runGroupsSequentially(groups, { env }, deps);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kindIndex = process.argv.indexOf('--kind');
  const kind = kindIndex !== -1 ? process.argv[kindIndex + 1] : null;

  if (kind !== 'browser-integration' && kind !== 'e2e') {
    console.error('scripts/release/managedUpdatesProof.ts requires --kind browser-integration|e2e');
    process.exitCode = 1;
  } else {
    const result =
      kind === 'e2e'
        ? await runManagedUpdatesE2EProof()
        : await runManagedUpdatesBrowserIntegrationProof();
    applyProcessResult(result);
  }
}
