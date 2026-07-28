import type { ManagedChannel } from './contracts';

/**
 * Derives this controller worker instance's managed channel from its own
 * registration scope, e.g. `https://mioframe.example/` (stable) or
 * `https://mioframe.example/branch/develop/` (develop).
 *
 * Deliberately runtime-derived rather than build-embedded: the exact same
 * compiled worker script is deployed to both channels, and only its scope
 * differs. This is controller-owned protocol/channel information, not
 * application release identity.
 * @param scope - This worker's `self.registration.scope`.
 * @returns The channel this worker instance is controlling.
 */
export function deriveManagedChannel(scope: string): ManagedChannel {
  return new URL(scope).pathname.includes('/branch/develop/') ? 'develop' : 'stable';
}

/**
 * Builds the channel-root-relative base path this worker instance's scope
 * corresponds to, e.g. `/` or `/branch/develop/`.
 * @param channel - Managed channel.
 * @returns The channel's base path.
 */
export function buildManagedChannelBasePath(channel: ManagedChannel): string {
  return channel === 'stable' ? '/' : '/branch/develop/';
}
