/**
 * Runs the managed-release data-compatibility browser proof
 * (`tests/e2e/release/managedReleaseDataCompatibility.spec.ts`) against a
 * given staged retained-release work directory, in its own fresh Playwright
 * container via `scripts/e2eReleaseContainer.mjs` — the same mechanism
 * `scripts/release/managedUpdatesProof.mjs` uses for its own groups.
 *
 * The single seam `scripts/pages/lib/managedCompatibilityPreflight.mjs`
 * calls to actually execute the browser proof, kept separate from the
 * preflight's own orchestration so publication decision logic stays
 * Playwright-free and independently unit-testable.
 */

import { runLocalCommand } from '../lib/runLocalCommand.mjs';

const E2E_RELEASE_CONTAINER_SCRIPT = 'scripts/e2eReleaseContainer.mjs';

/** Verifier/container label for this proof's own isolated Playwright run. */
export const MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL = 'managed-updates-data-compatibility';
/** The single spec this proof runs. */
export const MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC =
  'tests/e2e/release/managedReleaseDataCompatibility.spec.ts';

const defaultDeps = { runLocalCommand };

/**
 * Runs the data-compatibility proof spec against a staged work directory
 * that already contains both the previous retained release and the newly
 * staged candidate release (see
 * `scripts/pages/lib/managedCompatibilityPreflight.mjs`).
 * @param options Proof inputs.
 * @param options.stagedWorkDir The staged retained-release work directory to serve.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.previousReleaseNumber The previously retained release ("A") to prove read-back against.
 * @param options.candidateReleaseNumber The newly staged candidate release ("B") whose data A must be able to read.
 * @param [deps] Test seam for child-process execution.
 * @returns `{ passed }`; `passed` is `true` only when the container process exits 0 with no signal.
 */
export async function runManagedReleaseDataCompatibilityProof(
  { stagedWorkDir, channel, previousReleaseNumber, candidateReleaseNumber },
  deps = defaultDeps,
) {
  const result = await deps.runLocalCommand({
    command: 'node',
    args: [
      E2E_RELEASE_CONTAINER_SCRIPT,
      '--label',
      MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
      MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
    ],
    env: {
      ...process.env,
      MANAGED_COMPAT_WORK_DIR: stagedWorkDir,
      MANAGED_COMPAT_CHANNEL: channel,
      MANAGED_COMPAT_PREVIOUS_RELEASE: String(previousReleaseNumber),
      MANAGED_COMPAT_CANDIDATE_RELEASE: String(candidateReleaseNumber),
    },
  });
  return { passed: result.status === 0 && result.signal === null };
}
