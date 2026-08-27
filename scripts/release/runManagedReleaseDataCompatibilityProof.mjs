/**
 * Runs the managed-release data-compatibility browser proof
 * (`tests/e2e/widgets/DocumentView/productionArtifact/managedReleaseDataCompatibility.e2e.spec.ts`) against a
 * given staged retained-release work directory, in its own fresh Playwright
 * container via `scripts/e2eReleaseContainer.mjs` — the same mechanism
 * `scripts/release/managedUpdatesProof.ts` uses for its own groups.
 *
 * The single seam `scripts/pages/lib/managedCompatibilityPreflight.mjs`
 * calls to actually execute the browser proof, kept separate from the
 * preflight's own orchestration so publication decision logic stays
 * Playwright-free and independently unit-testable.
 */

import { relative } from 'node:path';

import { runLocalCommand } from '../lib/runLocalCommand.ts';
import {
  MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
  MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
} from '../lib/releaseProofInventory.ts';

const E2E_RELEASE_CONTAINER_SCRIPT = 'scripts/e2eReleaseContainer.mjs';

// Re-exported for this proof's own consumers/tests; the label and spec are
// owned by scripts/lib/releaseProofInventory.ts (see
// docs/testing/verify-redesign-final-review-correction-02-agent-task.md's
// "Make releaseProofInventory.ts the sole exceptional membership owner").
export { MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL, MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC };

const defaultDeps = { runLocalCommand };

/**
 * Runs the data-compatibility proof spec against a staged work directory
 * that already contains every retained previous release and the newly
 * staged candidate release (see
 * `scripts/pages/lib/managedCompatibilityPreflight.mjs`).
 *
 * `stagedWorkDir` is forwarded as a path relative to this process's own
 * working directory (the repository root), never an absolute host path: the
 * Playwright container mounts the whole repository root at `/work` and runs
 * with `/work` as its own working directory, so a repo-relative path
 * resolves identically on the host and inside the container, while an
 * absolute host path (e.g. under the OS temp directory) would not be visible
 * inside the container at all.
 * @param options Proof inputs.
 * @param options.stagedWorkDir The staged retained-release work directory to serve; must be under the repository root.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.previousReleaseNumbers Every retained previous release ("A") to prove read-back against, in ascending order.
 * @param options.candidateReleaseNumber The newly staged candidate release ("B") whose data every A must be able to read.
 * @param [deps] Test seam for child-process execution.
 * @returns `{ passed }`; `passed` is `true` only when the container process exits 0 with no signal.
 */
export async function runManagedReleaseDataCompatibilityProof(
  { stagedWorkDir, channel, previousReleaseNumbers, candidateReleaseNumber },
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
      MANAGED_COMPAT_WORK_DIR: relative(process.cwd(), stagedWorkDir),
      MANAGED_COMPAT_CHANNEL: channel,
      MANAGED_COMPAT_PREVIOUS_RELEASES: previousReleaseNumbers.join(','),
      MANAGED_COMPAT_CANDIDATE_RELEASE: String(candidateReleaseNumber),
    },
  });
  return { passed: result.status === 0 && result.signal === null };
}
