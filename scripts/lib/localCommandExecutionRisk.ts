/**
 * Single source of truth for the neutral command/lock/result/signal
 * execution boundary shared by every current verifier proof path that
 * actually executes a local command through it, independent of Playwright
 * (see docs/testing/verify-redesign-final-review-architecture-revision-02.md's
 * "Shared local command execution"): `scripts/release/buildArtifact.mjs`,
 * `scripts/release/productionArtifactStaticProof.ts`,
 * `scripts/release/managedUpdatesControllerArtifactIdentityProof.ts`, and
 * `scripts/storybook.mjs` use this boundary directly, and
 * `scripts/playwrightContainer.ts` also calls into it for every
 * Playwright-container-backed type.
 *
 * This module is only a path predicate, not a verification-type registry:
 * consuming planners remain the single owner of which of their own leaves a
 * hit selects.
 */

const SHARED_LOCAL_COMMAND_EXECUTION_PATHS: ReadonlySet<string> = new Set([
  'scripts/lib/localCommandGuard.ts',
  'scripts/lib/commandLock.ts',
  'scripts/lib/runLocalCommand.ts',
  'scripts/lib/processResult.ts',
  'scripts/lib/signalForward.ts',
]);

/**
 * Check whether a changed file is the shared local command/lock/result/
 * signal execution boundary, independent of Playwright.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is shared local-command execution infrastructure.
 */
export function isSharedLocalCommandExecutionPath(filePath: string): boolean {
  return SHARED_LOCAL_COMMAND_EXECUTION_PATHS.has(filePath);
}
