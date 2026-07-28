import type { ManagedChannel, ReleaseRef } from './contracts';
import { writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import type { AppUpdateWorkerResponse } from './protocol';
import { runReleaseCacheCleanup } from './releaseCache';
import { fetchLatestReleasePointer } from './releasePreparation';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import { applyCheckForUpdates, approveAutomaticRelease } from './stateTransitions';

/**
 * Runs one discovery check: fetches and validates `latest.json`, records
 * the result, and — only in Automatic mode, and only for a genuinely newer
 * release — prepares and approves it in the background.
 *
 * Shared by the explicit `CHECK_FOR_UPDATES` protocol request and the
 * navigation-triggered automatic check ({@link runAutomaticCheckIfEnabled}).
 * The short state lock (`enqueue`) only ever covers the read/decide/persist
 * steps; `latest.json` discovery and release preparation (network + hashing,
 * deduplicated per release id by `coordinator`) always run outside it, so
 * neither this call nor any concurrent navigation is ever blocked on the
 * other. Re-validates the candidate against current state after
 * preparation, before approving it, so a stale completion (mode switched to
 * Manual, or superseded by a newer discovery, while preparing) can never
 * silently approve the wrong release.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting response snapshot.
 */
export async function runUpdateCheck(
  channel: ManagedChannel,
  channelBasePath: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<AppUpdateWorkerResponse> {
  let discovered: ReleaseRef;
  try {
    discovered = await fetchLatestReleasePointer(channelBasePath);
  } catch {
    const currentState = await withState(channel, enqueue, (state) => state);
    return { snapshot: buildAppUpdateSnapshot(currentState, 'check-failed') };
  }

  const checkedAt = new Date().toISOString();
  const afterDiscovery = await withState(channel, enqueue, async (state) => {
    const checked = applyCheckForUpdates(state, discovered, checkedAt);
    if (checked.state !== state) await writeControllerState(channel, checked.state);
    return checked;
  });

  if (afterDiscovery.outcome !== 'updated' || afterDiscovery.state.mode !== 'automatic') {
    return { snapshot: buildAppUpdateSnapshot(afterDiscovery.state) };
  }

  try {
    await coordinator.prepare(channel, channelBasePath, discovered);
  } catch {
    // Background preparation failure never blocks reporting the discovery itself.
    return { snapshot: buildAppUpdateSnapshot(afterDiscovery.state) };
  }

  const approved = await withState(channel, enqueue, async (state) => {
    // Re-validate against the current state: the user may have switched to
    // Manual, or a newer release may already have superseded this one,
    // while preparation was in flight.
    if (state.mode !== 'automatic' || state.latestRelease?.releaseId !== discovered.releaseId) {
      return state;
    }
    const next = approveAutomaticRelease(state, discovered);
    if (next !== state) {
      await writeControllerState(channel, next);
      void runReleaseCacheCleanup(channel, coordinator.getInFlightReleaseIds()).catch(() => {});
    }
    return next;
  });

  return { snapshot: buildAppUpdateSnapshot(approved) };
}

/**
 * Runs {@link runUpdateCheck} only when the current mode is Automatic —
 * never fetching `latest.json` at all for a Manual-mode installation.
 * Never throws: this is a background trigger with no requester waiting on
 * it, so a failure is silently swallowed and does not affect the current
 * session.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 */
export async function runAutomaticCheckIfEnabled(
  channel: ManagedChannel,
  channelBasePath: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<void> {
  const initial = await withState(channel, enqueue, (state) => state);
  if (initial.mode !== 'automatic') return;
  await runUpdateCheck(channel, channelBasePath, enqueue, coordinator);
}
