import { toReleaseSummary, type ManagedChannel, type ReleaseDescriptor } from './contracts';
import { writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import type { AppUpdateWorkerResponse } from './protocol';
import { runReleaseCacheCleanup } from './releaseCache';
import { fetchLatestReleasePointer, fetchReleaseDescriptor } from './releasePreparation';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import {
  applyCheckForUpdates,
  approveAutomaticRelease,
  resolveAutomaticPreparationTarget,
} from './stateTransitions';

/**
 * Runs one discovery check: fetches and validates `latest.json`, then
 * fetches and validates the exact referenced descriptor, records the
 * resulting release summary, and — only in Automatic mode — prepares and
 * approves whichever release {@link resolveAutomaticPreparationTarget}
 * currently selects, reusing the descriptor already fetched here when it
 * matches that target instead of fetching it again.
 *
 * The preparation decision is deliberately independent of whether *this*
 * discovery changed `latestRelease`: a `latestRelease` that was already
 * known but never got fully prepared (e.g. a prior temporary network,
 * hashing, or cache-write failure) is retried by any later successful check
 * that still resolves it as the current target — not only by a newer
 * discovery.
 *
 * A same-sequence conflicting identity (`applyCheckForUpdates`'s
 * `'rejected-conflict'` outcome) is invalid publication metadata and fails
 * closed: the complete previous state is preserved untouched and this
 * reports `check-failed`, exactly like an unreachable `latest.json`.
 *
 * Shared by the explicit `CHECK_FOR_UPDATES` protocol request and the
 * navigation-triggered scheduled discovery check ({@link runScheduledDiscoveryCheck}).
 * The short state lock (`enqueue`) only ever covers the read/decide/persist
 * steps; `latest.json`/descriptor discovery and release preparation
 * (network + hashing, deduplicated per release id by `coordinator`) always
 * run outside it, so neither this call nor any concurrent navigation is
 * ever blocked on the other. Re-validates the candidate against current
 * state after preparation, before approving it, so a stale completion (mode
 * switched to Manual, or superseded by a newer discovery, while preparing)
 * can never silently approve the wrong release.
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
  let descriptor: ReleaseDescriptor;
  try {
    const pointer = await fetchLatestReleasePointer(channelBasePath);
    descriptor = await fetchReleaseDescriptor(channelBasePath, pointer);
  } catch {
    const currentState = await withState(channel, enqueue, (state) => state);
    return { snapshot: buildAppUpdateSnapshot(currentState, 'check-failed') };
  }
  const discovered = toReleaseSummary(descriptor);

  const checkedAt = new Date().toISOString();
  const afterDiscovery = await withState(channel, enqueue, async (state) => {
    const checked = applyCheckForUpdates(state, discovered, checkedAt);
    if (checked.state !== state) await writeControllerState(channel, checked.state);
    return checked;
  });

  if (afterDiscovery.outcome === 'rejected-conflict') {
    return { snapshot: buildAppUpdateSnapshot(afterDiscovery.state, 'check-failed') };
  }

  const target = resolveAutomaticPreparationTarget(afterDiscovery.state);
  if (!target) {
    // Nothing currently requires Automatic preparation: wrong mode, nothing
    // newer than `activeRelease`, already approved, an activation is in
    // progress, or it is the recorded failed release.
    return { snapshot: buildAppUpdateSnapshot(afterDiscovery.state) };
  }

  // Reuse the descriptor this check already fetched and validated only when
  // it is for the exact same release as `target`; otherwise `coordinator`
  // fetches the exact descriptor for `target` itself.
  const reusableDescriptor = target.releaseId === discovered.releaseId ? descriptor : undefined;

  try {
    await coordinator.prepare(channel, channelBasePath, target, reusableDescriptor);
  } catch {
    // Background preparation failure never blocks reporting the discovery
    // itself: `latestRelease` stays recorded, and a later check retries
    // preparation via `resolveAutomaticPreparationTarget` above.
    return { snapshot: buildAppUpdateSnapshot(afterDiscovery.state) };
  }

  const approved = await withState(channel, enqueue, async (state) => {
    // Re-validate against the current state: the user may have switched to
    // Manual, or a newer release may already have superseded this one,
    // while preparation was in flight.
    if (state.mode !== 'automatic' || state.latestRelease?.releaseId !== target.releaseId) {
      return state;
    }
    const next = approveAutomaticRelease(state, target);
    if (next !== state) {
      await writeControllerState(channel, next);
      void coordinator
        .runCleanup((inFlightReleaseIds) => runReleaseCacheCleanup(channel, inFlightReleaseIds))
        .catch(() => {});
    }
    return next;
  });

  return { snapshot: buildAppUpdateSnapshot(approved) };
}

/**
 * Runs the scheduled once-per-worker-lifetime discovery check, regardless of
 * update mode: fetches and validates `latest.json` and the exact
 * descriptor, and records the resulting release summary. Preparing and
 * approving a genuinely newer release remains an Automatic-only decision
 * {@link runUpdateCheck} makes internally — Manual mode always stops after
 * discovery, but still learns about, and reports, a newer release.
 *
 * This is a thin adapter over {@link runUpdateCheck} for the scheduler (see
 * `scheduledDiscoveryCheckScheduler.ts`), which has no requester waiting on
 * a response. Never throws: a failure is silently swallowed and does not
 * affect the current session.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns `true` when the check actually changed snapshot-relevant state
 * (a successful check always at least records a new `lastSuccessfulCheckAt`)
 * and same-channel windows should be notified to refresh their own
 * snapshot; `false` for a failed check, which changes nothing.
 */
export async function runScheduledDiscoveryCheck(
  channel: ManagedChannel,
  channelBasePath: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<boolean> {
  const result = await runUpdateCheck(channel, channelBasePath, enqueue, coordinator);
  return result.snapshot.error !== 'check-failed';
}
