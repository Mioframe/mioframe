/**
 * Single source of truth for repository paths whose runtime semantics are
 * genuinely shared by every Playwright-container-backed verification type
 * (behavior, visual, browser-integration, and E2E): the command/lock/result/
 * signal execution boundary `scripts/playwrightContainer.ts` itself calls
 * into, plus the shared tooling/lock config those modules read (see
 * docs/testing/verify-redesign-final-review-architecture-revision.md's
 * "Shared Playwright execution infrastructure"). A change to any of these
 * paths can alter container startup, locking, process-result propagation, or
 * signal handling for every consumer, so it always widens each consuming
 * type's affected planner to its complete owning type instead of a narrower
 * path-based selection.
 *
 * `package.json` is deliberately excluded: its runtime/version relevance
 * stays owned by each type-specific planner's existing
 * `isPackageJsonRuntimeRelevantChange` refinement, so a confirmed
 * version-only change does not automatically widen browser proof.
 *
 * This module is only a path predicate. It is not a verification-type
 * registry, test registry, planner manager, or generic verification
 * framework; consuming planners remain the single owner of their own
 * type-specific full-lane paths and composition.
 */

const SHARED_PLAYWRIGHT_EXECUTION_INFRASTRUCTURE_PATHS: ReadonlySet<string> = new Set([
  'config/tooling.json',
  'pnpm-lock.yaml',
  'scripts/playwrightContainer.ts',
  'scripts/lib/localCommandGuard.ts',
  'scripts/lib/commandLock.ts',
  'scripts/lib/runLocalCommand.ts',
  'scripts/lib/processResult.ts',
  'scripts/lib/signalForward.ts',
]);

/**
 * Check whether a changed file is shared Playwright execution infrastructure
 * genuinely relied on by every Playwright-container-backed verification
 * type.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is shared Playwright execution infrastructure.
 */
export function isSharedPlaywrightExecutionInfrastructurePath(filePath: string): boolean {
  return SHARED_PLAYWRIGHT_EXECUTION_INFRASTRUCTURE_PATHS.has(filePath);
}
