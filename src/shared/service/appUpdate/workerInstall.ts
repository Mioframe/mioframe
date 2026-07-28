import type { ManagedChannel } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import { buildReleaseCacheNames, checkReleaseAvailability } from './releaseCache';
import {
  fetchLatestReleasePointer,
  fetchReleaseDescriptor,
  prepareRelease,
} from './releasePreparation';
import { buildInitialControllerState } from './stateTransitions';

/**
 * What this worker instance's `install` event must do, decided from
 * persisted state and whether a previously-active worker already controls
 * this channel (see the managed pinned application updates feature,
 * "Worker migration").
 */
export type InstallAction =
  /** Genuinely first-ever installation: no persisted state, no previously-active worker. */
  | 'prepare-fresh-install'
  /** An existing managed installation is being upgraded to this worker's code. */
  | 'confirm-existing-managed-install'
  /** No managed state exists, but a previously-active (necessarily legacy, pre-migration) worker still controls this channel. */
  | 'defer-to-legacy-worker';

/**
 * Decides this worker instance's `install` action.
 *
 * A previously-active worker combined with absent managed state can only
 * mean a pre-migration legacy Workbox worker: this worker's own code always
 * persists managed state before any of its instances ever reaches `active`
 * (see {@link prepareInitialManagedRelease} and `sw.ts`'s `activate`
 * handler), so an active-but-stateless channel predates the managed
 * controller entirely.
 * @param channel - Managed channel.
 * @param hasPreviousActiveController - Whether `self.registration.active` is non-null during this `install` event.
 * @returns The install action to take.
 * @throws When persisted state is structurally invalid; the caller must reject installation.
 */
export async function decideInstallAction(
  channel: ManagedChannel,
  hasPreviousActiveController: boolean,
): Promise<InstallAction> {
  const read = await readControllerState(channel);
  if (read.status === 'invalid') {
    throw new Error('Persisted controller state is invalid; refusing to activate a new controller');
  }
  if (read.status === 'valid') return 'confirm-existing-managed-install';
  return hasPreviousActiveController ? 'defer-to-legacy-worker' : 'prepare-fresh-install';
}

/**
 * Fetches, fully prepares, and persists this channel's very first managed
 * release. Used both for a genuinely fresh installation (during `install`)
 * and to complete a legacy-Workbox migration (during `activate`, once every
 * legacy-controlled window has closed and the browser has promoted this
 * worker on its own). Persists state only once preparation fully succeeds —
 * a failure here never leaves partial managed state.
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
 * Confirms an existing managed installation's active release remains
 * available locally, restoring it from the immutable server archive if
 * necessary. Never changes which release is selected — a controller-code
 * upgrade must never change the selected application release.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @throws When persisted state is not valid, or restoration fails.
 */
export async function confirmExistingManagedInstall(
  channel: ManagedChannel,
  channelBasePath: string,
): Promise<void> {
  const read = await readControllerState(channel);
  if (read.status !== 'valid') {
    throw new Error('Persisted controller state is invalid; refusing to activate a new controller');
  }

  const { activeRelease } = read.state;
  const { final } = buildReleaseCacheNames(channel, activeRelease.releaseId);
  const finalCache = await caches.open(final);
  const alreadyAvailable = await checkReleaseAvailability(
    finalCache,
    activeRelease,
    channelBasePath,
  );
  if (alreadyAvailable) return;

  const descriptor = await fetchReleaseDescriptor(channelBasePath, activeRelease);
  await prepareRelease(channelBasePath, channel, descriptor);
}
