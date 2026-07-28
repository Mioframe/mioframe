import type { ManagedChannel } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import {
  fetchLatestReleasePointer,
  fetchReleaseDescriptor,
  prepareRelease,
} from './releasePreparation';
import { buildInitialControllerState } from './stateTransitions';

/**
 * Fetches, fully prepares, and persists this channel's very first managed
 * release, for a genuinely fresh installation (persisted state `'absent'`).
 * Persists state only once preparation fully succeeds — a failure here
 * never leaves partial managed state, and (since this runs inside the
 * `install` event) leaves the browser to reject this installation and keep
 * any previous worker active.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @throws When discovery or preparation fails.
 */
export async function prepareInitialManagedRelease(
  channel: ManagedChannel,
  channelBasePath: string,
): Promise<void> {
  const latest = await fetchLatestReleasePointer(channelBasePath);
  const descriptor = await fetchReleaseDescriptor(channelBasePath, latest);
  await prepareRelease(channelBasePath, channel, descriptor);
  await writeControllerState(channel, buildInitialControllerState(latest));
}

/**
 * Runs this worker instance's complete `install`-time decision: an invalid
 * persisted state rejects installation outright; an absent state prepares
 * and persists the very first managed release; an existing valid state is
 * preserved completely unchanged — no discovery, no active-release change,
 * no approval, and no cache restoration. A controller-code upgrade must
 * never change, or need to re-verify, which application release is
 * selected; missing cache restoration for an existing installation remains
 * the ordinary selected-release fetch responsibility (see `workerFetch.ts`).
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @throws When persisted state is invalid, or fresh-install preparation fails.
 */
export async function runInstall(channel: ManagedChannel, channelBasePath: string): Promise<void> {
  const read = await readControllerState(channel);
  if (read.status === 'invalid') {
    throw new Error('Persisted controller state is invalid; refusing to install a new controller');
  }
  if (read.status === 'absent') {
    await prepareInitialManagedRelease(channel, channelBasePath);
  }
}
