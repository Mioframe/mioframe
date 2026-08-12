/**
 * Publisher-owned static classification of retained managed releases that
 * remain retained and fully integrity-validated (see
 * `retainedReleaseTree.mjs`'s `validateRetainedContent`), but are excluded
 * from the set of releases the managed release data-compatibility proof
 * requires a new candidate to support as a pin/rollback target (see
 * `managedCompatibilityPreflight.mjs`).
 *
 * A static, source-controlled fact about specific historical releases, never
 * worker/runtime state: this module is Node-only publisher infrastructure
 * and is never bundled into the Service Worker or application client. Adding
 * an entry here never changes the release wire descriptor format, never
 * deletes or allows reuse of the release number, and never skips retained-tree
 * byte/hash validation for the release itself — it only narrows which
 * retained releases a new candidate's compatibility proof must cover.
 *
 * Develop release 2 (see `docs/managed-pinned-updates.md`, "Unsupported
 * retained releases") was published with a broken build — wrong
 * root-relative application/PWA URLs and a Service Worker built without
 * runtime Sentry configuration — before this preflight existed to prevent
 * it. It can never be a real active pin/rollback target, so continuing to
 * require every future develop candidate to prove backward data
 * compatibility with it would block real publication for no safety benefit.
 */
const UNSUPPORTED_COMPAT_TARGETS = new Set([
  // develop release 2: docs/managed-pinned-updates.md, "Unsupported retained releases"
  'develop:2',
]);

/**
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @param releaseNumber Retained release number.
 * @returns `true` when this retained release is excluded from the set of
 * compatibility-proof targets a new candidate must support.
 */
export function isUnsupportedCompatTarget(channel, releaseNumber) {
  return UNSUPPORTED_COMPAT_TARGETS.has(`${channel}:${releaseNumber}`);
}
