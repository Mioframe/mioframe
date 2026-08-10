/// <reference lib="webworker" />

import { toReleaseSummary, type ManagedChannel, type ReleaseDescriptor } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import { probePredecessor, type PredecessorLike } from './predecessorProbe';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  fetchLatestReleasePointer,
  fetchReleaseDescriptor,
  reportReleasePreparationFailure,
} from './releasePreparation';
import { buildInitialControllerState } from './stateTransitions';

/**
 * Fetches, fully prepares, and persists this channel's very first managed
 * release, for an allowed bootstrap (persisted state `'absent'` and either
 * no active predecessor or a compatible Workbox predecessor). Persists state
 * only once preparation fully succeeds — a failure here never leaves
 * partial managed state, and (since this runs inside the `install` event)
 * leaves the browser to reject this installation and keep any previous
 * worker active. Runs through the shared {@link PreparationCoordinator} so
 * this never duplicates a concurrent preparation of the same release number,
 * and passes the already-validated descriptor so preparation does not fetch
 * it twice.
 * Reports a direct discovery failure (fetching/validating `latest.json` or
 * its descriptor, before `coordinator.prepare()` even starts) at the same
 * classified boundary preparation failures use — never reported twice, since
 * `coordinator.prepare()` owns its own failures separately.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param coordinator - The channel's preparation coordinator.
 * @throws When discovery or preparation fails.
 */
export async function prepareInitialManagedRelease(
  channel: ManagedChannel,
  channelBasePath: string,
  coordinator: PreparationCoordinator,
): Promise<void> {
  let descriptor: ReleaseDescriptor;
  try {
    const latest = await fetchLatestReleasePointer(channelBasePath);
    descriptor = await fetchReleaseDescriptor(channelBasePath, latest);
  } catch (error) {
    reportReleasePreparationFailure(error);
    throw error;
  }
  const activeRelease = toReleaseSummary(descriptor);
  await coordinator.prepare(channel, channelBasePath, activeRelease, descriptor);
  await writeControllerState(channel, buildInitialControllerState(activeRelease));
}

/**
 * Runs this worker instance's complete `install`-time decision (Stage 3):
 *
 * - valid persisted state is preserved completely unchanged — no predecessor
 *   probe, no network, no state write; a controller-code upgrade must never
 *   change, or need to re-verify, which application release is selected;
 * - invalid persisted state rejects installation outright, before probing
 *   or any network/cache work — an invalid record is never repaired;
 * - absent state with no active predecessor (`active` is `null`) is a
 *   genuine first registration and bootstraps unconditionally;
 * - absent state with an active predecessor sends the exact concurrent
 *   managed/Workbox probes (see {@link probePredecessor}): a managed
 *   predecessor means state loss and rejects installation; a compatible
 *   Workbox predecessor allows the one-time bootstrap; any conflicting,
 *   malformed, unknown, or silent outcome rejects installation.
 *
 * Stale caches never authorize a bootstrap decision — only this exact
 * predecessor-probe outcome does.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param active - `self.registration.active` at install time, or `null` for a genuinely fresh registration.
 * @param coordinator - The channel's preparation coordinator.
 * @throws When persisted state is invalid, the predecessor is not an allowed bootstrap source, or fresh-install preparation fails.
 */
export async function runInstall(
  channel: ManagedChannel,
  channelBasePath: string,
  active: PredecessorLike | null,
  coordinator: PreparationCoordinator,
): Promise<void> {
  const read = await readControllerState(channel);
  if (read.status === 'invalid' || read.status === 'storage-unavailable') {
    throw new Error('Persisted controller state is invalid; refusing to install a new controller');
  }
  if (read.status === 'valid') return;

  if (active) {
    const outcome = await probePredecessor(active, channel);
    if (outcome === 'managed') {
      throw new Error(
        'A managed predecessor answered with absent local state; refusing to install (managed-state loss)',
      );
    }
    if (outcome === 'reject') {
      throw new Error(
        'Predecessor is not a genuine first registration or a compatible Workbox worker; refusing to install',
      );
    }
  }

  await prepareInitialManagedRelease(channel, channelBasePath, coordinator);
}
