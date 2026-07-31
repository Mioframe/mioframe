import { toReleaseSummary, type ManagedChannel, type ReleaseDescriptor } from './contracts';
import { writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import { withProtocolVersion, type AppUpdateWorkerResponse } from './protocol';
import { fetchLatestReleasePointer, fetchReleaseDescriptor } from './releasePreparation';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import {
  applyDiscovery,
  completeAutomaticPreparation,
  resolveAutomaticPreparationTarget,
} from './stateTransitions';
import { broadcastStateChanged, cleanupReleaseCache } from './workerBroadcast';

/** Result of {@link runDiscovery}. */
export type DiscoveryResult = {
  /** The response to post back for whatever command triggered this discovery. */
  response: AppUpdateWorkerResponse;
  /** Whether the discovery transaction durably changed persisted state at all (a replaced candidate, or merely an updated `lastSuccessfulCheckAt`). */
  durablyChanged: boolean;
  /** Whether the persisted candidate was actually replaced by a newer discovered release — the only discovery outcome that can leave a previous candidate's cache unprotected. */
  candidateReplaced: boolean;
  /** The descriptor this discovery already fetched and validated, when discovery itself succeeded — reusable by a subsequent preparation of the exact same release. */
  discoveredDescriptor?: ReleaseDescriptor;
};

/**
 * Runs one discovery transaction: fetches and validates `latest.json`, then
 * fetches and validates the exact referenced descriptor, and applies it
 * through {@link applyDiscovery}. Owns discovery only — it never prepares or
 * approves anything; that is a separate, deferred decision the caller makes
 * from the resulting response (see {@link runAutomaticPreparationFollowUp}).
 *
 * The short state lock (`enqueue`) only ever covers the read/decide/persist
 * step; the `latest.json`/descriptor fetch always runs outside it, so
 * neither this call nor any concurrent navigation is ever blocked on the
 * other.
 *
 * A failed fetch or a structurally invalid `latest.json`/descriptor reports
 * `check-failed` against the untouched current state.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param enqueue - The channel's serialized operation queue.
 * @returns The resulting response plus durable-change facts for the caller to act on.
 */
export async function runDiscovery(
  channel: ManagedChannel,
  channelBasePath: string,
  enqueue: OperationQueue,
): Promise<DiscoveryResult> {
  let descriptor: ReleaseDescriptor;
  try {
    const pointer = await fetchLatestReleasePointer(channelBasePath);
    descriptor = await fetchReleaseDescriptor(channelBasePath, pointer);
  } catch {
    const currentState = await withState(channel, enqueue, (state) => state);
    return {
      response: withProtocolVersion({
        snapshot: buildAppUpdateSnapshot(currentState, 'check-failed'),
      }),
      durablyChanged: false,
      candidateReplaced: false,
    };
  }
  const discovered = toReleaseSummary(descriptor);
  const checkedAt = new Date().toISOString();

  const result = await withState(channel, enqueue, async (state) => {
    const applied = applyDiscovery(state, discovered, checkedAt);
    if (applied.state !== state) await writeControllerState(channel, applied.state);
    return applied;
  });

  return {
    response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(result.state) }),
    durablyChanged: result.outcome !== 'skipped',
    candidateReplaced: result.outcome === 'updated',
    discoveredDescriptor: descriptor,
  };
}

/**
 * Attempts Automatic preparation of whatever release currently requires it,
 * re-read fresh at call time — never a target captured earlier by the
 * caller — since this always runs as deferred follow-up work after some
 * other command's response has already been posted. A no-op when nothing
 * currently requires preparation (wrong mode, no candidate, or the
 * candidate is not `available`).
 *
 * A transient preparation failure never persists or throws: a later
 * eligible trigger retries. A stale completion (mode changed, or the
 * candidate was replaced or already advanced while preparing) also never
 * persists, but best-effort cleans up any cache the stale preparation may
 * have just written, since that cache may no longer be protected.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @param reusableDescriptor - An already fetched and validated descriptor to reuse when it matches the resolved target, so preparation can skip a redundant descriptor fetch.
 */
export async function runAutomaticPreparationFollowUp(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
  reusableDescriptor?: ReleaseDescriptor,
): Promise<void> {
  const target = await withState(channel, enqueue, (state) =>
    resolveAutomaticPreparationTarget(state),
  );
  if (!target) return;

  const descriptorToReuse =
    reusableDescriptor?.releaseNumber === target.releaseNumber ? reusableDescriptor : undefined;

  try {
    await coordinator.prepare(channel, channelBasePath, target, descriptorToReuse);
  } catch {
    return;
  }

  const { changed } = await withState(channel, enqueue, async (state) => {
    const next = completeAutomaticPreparation(state, target.releaseNumber);
    if (next === state) return { changed: false };
    await writeControllerState(channel, next);
    return { changed: true };
  });

  if (changed) {
    await broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {});
  } else {
    await cleanupReleaseCache(channel, coordinator);
  }
}

/**
 * Runs the scheduled once-per-worker-lifetime background discovery check.
 *
 * Skipped entirely, without even fetching `latest.json`, when the candidate
 * is `ready` or `activating` (pinned, discovery never reaches them) or when
 * mode is Manual and the candidate is `failed` (preserving explicit Manual
 * retry — an automatic background check must never silently replace a
 * failure the user has not yet acted on, though a strictly newer release is
 * still discoverable through this same path once mode allows it or the
 * candidate advances).
 *
 * Otherwise runs discovery, then — in Automatic mode, when the resulting
 * candidate is `available` — attempts preparation as a genuinely separate
 * background transition. Broadcasts every durable state change: discovery's
 * own change (if any), and preparation completion's own change (if any),
 * as two independent invalidations when both occur. Never throws: a failure
 * is silently swallowed and does not affect the current session.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 */
export async function runScheduledDiscoveryCheck(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<void> {
  const initial = await withState(channel, enqueue, (state) => state);
  const { candidate } = initial;
  if (candidate?.phase === 'ready' || candidate?.phase === 'activating') return;
  if (initial.mode === 'manual' && candidate?.phase === 'failed') return;

  const discovery = await runDiscovery(channel, channelBasePath, enqueue);
  if (discovery.candidateReplaced) await cleanupReleaseCache(channel, coordinator);
  if (discovery.durablyChanged) {
    await broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {});
  }

  const shouldPrepare =
    discovery.response.snapshot.mode === 'automatic' &&
    discovery.response.snapshot.candidate?.phase === 'available';
  if (shouldPrepare) {
    await runAutomaticPreparationFollowUp(
      channel,
      channelBasePath,
      channelOrigin,
      enqueue,
      coordinator,
      discovery.discoveredDescriptor,
    );
  }
}
