/**
 * Single canonical implementation of the managed pinned application updates
 * feature's channel/cache/path isolation contract: deployment channel type,
 * cache namespace derivation (general and managed-worker), branch tombstone
 * cache-prefix derivation, and foreign-channel path/denylist classification.
 *
 * Cache Storage is per-origin, not per service-worker-scope, so channel
 * isolation across `/`, `/branch/<slug>/`, and `/pr/<number>/` depends on
 * these primitives being identical everywhere a channel/cache/path decision
 * is made: the Node-side PWA build config (`config/plugins/pwa.ts`), the
 * managed worker's own runtime cache namespace (`releaseCache.ts`), the
 * managed worker's clean-launch client classification (`cleanLaunch.ts`),
 * and the Node-side branch tombstone generator
 * (`scripts/pages/lib/tombstoneContent.mjs`).
 *
 * This module must stay importable directly by plain Node (no TypeScript
 * loader): it uses only erasable TypeScript syntax (no `enum`, decorators,
 * parameter properties, or namespaces), and has no runtime side effects, DOM
 * dependencies, Node dependencies, service implementations, or Vite
 * dependencies — so `tombstoneContent.mjs` can import it directly instead of
 * duplicating its cache-prefix derivation.
 *
 * Kept free of any import from this directory's other modules (e.g.
 * `contracts.ts`'s zod-derived `ManagedChannel`) so `config/plugins/pwa.ts`
 * — a separate `tsconfig.node.json` TypeScript project that does not
 * reference the application's own `tsconfig.app.json` project — can import
 * this one file directly without pulling in the rest of the runtime wire
 * contract. {@link ManagedChannel} below is structurally identical to (and
 * therefore freely interchangeable with) `contracts.ts`'s own
 * `ManagedChannel`.
 */

/** A build's deployment channel: the stable production deployment, or a branch/PR-preview deployment. */
export type ReleaseChannel = 'stable' | 'branch';

/** The two channels the managed pinned-update controller worker supports. */
export type ManagedChannel = 'stable' | 'develop';

/**
 * Build the Cache Storage name prefix for a release channel.
 * @param channel - Release channel.
 * @param channelId - Channel identifier; required for the `branch` channel.
 * @returns Cache name prefix, e.g. `stable` or `branch-develop`.
 * @throws When `channel` is `branch` and `channelId` is not given.
 */
export function buildChannelCacheNamespace(channel: ReleaseChannel, channelId?: string): string {
  if (channel === 'branch') {
    if (!channelId) {
      throw new Error('channelId is required for the "branch" release channel.');
    }
    return `branch-${channelId}`;
  }
  return 'stable';
}

/**
 * Builds the managed controller worker's own Cache Storage name prefix for
 * its channel — the managed worker's counterpart of
 * {@link buildChannelCacheNamespace}, fixed to the two channels the managed
 * worker supports.
 * @param channel - Managed channel.
 * @returns The channel's Cache Storage name prefix, e.g. `stable` or `branch-develop`.
 */
export function buildManagedCacheNamespace(channel: ManagedChannel): string {
  return channel === 'stable' ? 'stable' : buildChannelCacheNamespace('branch', channel);
}

/**
 * Build the Cache Storage name prefix a branch channel's tombstone must
 * clear on its own activation.
 * @param slug - Branch slug.
 * @returns Cache name prefix, e.g. `branch-develop-`.
 */
export function buildBranchCacheNamePrefix(slug: string): string {
  return `${buildChannelCacheNamespace('branch', slug)}-`;
}

/**
 * Returns `true` when `pathname` is under `base` but belongs to a different
 * top-level channel namespace (`/branch/*` or `/pr/*`).
 * @param pathname - The URL pathname to test, e.g. `/branch/develop/assets/app.js`.
 * @param base - The channel base path, e.g. `/`.
 * @returns `true` when the pathname belongs to a different channel's deployment.
 */
export function isForeignChannelPath(pathname: string, base: string): boolean {
  if (!pathname.startsWith(base)) return false;
  const rest = pathname.slice(base.length);
  return /^(?:branch|pr)\/.*$/.test(rest);
}

/**
 * Builds a RegExp that matches foreign-channel paths (`/branch/*`, `/pr/*`)
 * under the given base path.
 * @param base - The base path, e.g. `/`.
 * @returns A RegExp matching `/branch/*` and `/pr/*` path prefixes under `base`.
 */
export function buildForeignChannelDenylistPattern(base: string): RegExp {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escapedBase}(?:branch|pr)\\/`);
}
