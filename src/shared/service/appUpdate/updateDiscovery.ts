import {
  releaseSummariesMatch,
  toReleaseSummary,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseSummary,
} from './contracts';
import { writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import type { AppUpdateErrorCode, AppUpdateSnapshot } from './protocol';
import { fetchLatestReleasePointer, fetchReleaseDescriptor } from './releasePreparation';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import { applyDiscovery, completeAutomaticPreparation } from './stateTransitions';
import { broadcastStateChanged, cleanupReleaseCache } from './workerBroadcast';

/** Dependencies for one fresh-state discovery and preparation pass. */
export type UpdateDiscoveryDependencies = {
  /** Managed publication channel. */
  channel: ManagedChannel;
  /** Channel-root URL path. */
  channelBasePath: string;
  /** Channel's same-origin URL. */
  channelOrigin: string;
  /** Short persisted-state operation queue. */
  enqueue: OperationQueue;
  /** Exact-identity preparation and cleanup coordinator. */
  coordinator: PreparationCoordinator;
};

type DiscoveryOutcome = {
  descriptor?: ReleaseDescriptor;
  error?: AppUpdateErrorCode;
  stateAfterDiscovery: Awaited<ReturnType<typeof readCurrentState>>;
};

const readCurrentState = (channel: ManagedChannel, enqueue: OperationQueue) =>
  withState(channel, enqueue, (state) => state);

async function discoverLatest(
  dependencies: UpdateDiscoveryDependencies,
): Promise<DiscoveryOutcome> {
  const { channel, channelBasePath, channelOrigin, enqueue, coordinator } = dependencies;
  let descriptor: ReleaseDescriptor;
  try {
    const pointer = await fetchLatestReleasePointer(channelBasePath);
    descriptor = await fetchReleaseDescriptor(channelBasePath, pointer);
  } catch {
    return {
      error: 'check-failed',
      stateAfterDiscovery: await readCurrentState(channel, enqueue),
    };
  }

  const discovered = toReleaseSummary(descriptor);
  const checkedAt = new Date().toISOString();
  const applied = await withState(channel, enqueue, async (state) => {
    const result = applyDiscovery(state, discovered, checkedAt);
    if (result.state !== state) await writeControllerState(channel, result.state);
    return result;
  });

  if (applied.outcome !== 'skipped') {
    await broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {});
  }
  if (applied.outcome === 'updated') {
    await cleanupReleaseCache(channel, coordinator);
  }

  return { descriptor, stateAfterDiscovery: applied.state };
}

async function prepareAutomaticTarget(
  dependencies: UpdateDiscoveryDependencies,
  target: ReleaseSummary,
  descriptor: ReleaseDescriptor | undefined,
): Promise<void> {
  const { channel, channelBasePath, channelOrigin, enqueue, coordinator } = dependencies;
  const reusableDescriptor =
    descriptor && releaseSummariesMatch(toReleaseSummary(descriptor), target)
      ? descriptor
      : undefined;

  try {
    await coordinator.prepare(channel, channelBasePath, target, reusableDescriptor);
  } catch {
    return;
  }

  const changed = await withState(channel, enqueue, async (state) => {
    const next = completeAutomaticPreparation(state, target.releaseNumber);
    if (next === state) return false;
    await writeControllerState(channel, next);
    return true;
  });
  if (changed) {
    await broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {});
  } else {
    await cleanupReleaseCache(channel, coordinator);
  }
}

/**
 * Runs one cohesive reconciliation pass from freshly persisted state.
 * The mode captured at the start defines discovery and preparation policy
 * for the whole pass; a concurrent durable mode change is handled by the
 * reconciliation owner's subsequent fresh-state rerun.
 * @param dependencies - Channel state, preparation, and event-side effects.
 * @returns The final snapshot after discovery and any eligible preparation.
 */
export async function runUpdateReconciliationPass(
  dependencies: UpdateDiscoveryDependencies,
): Promise<AppUpdateSnapshot> {
  const { channel, enqueue } = dependencies;
  const initialState = await readCurrentState(channel, enqueue);
  const passMode = initialState.mode;
  const initialCandidate = initialState.candidate;

  if (initialCandidate?.phase === 'ready' || initialCandidate?.phase === 'activating') {
    return buildAppUpdateSnapshot(initialState);
  }

  const discovery = await discoverLatest(dependencies);
  let target: ReleaseSummary | undefined;
  if (passMode === 'automatic') {
    if (discovery.error) {
      target = initialCandidate?.phase === 'available' ? initialCandidate.release : undefined;
    } else if (discovery.stateAfterDiscovery.candidate?.phase === 'available') {
      target = discovery.stateAfterDiscovery.candidate.release;
    }
  }

  if (target) {
    await prepareAutomaticTarget(dependencies, target, discovery.descriptor);
  }

  const finalState = await readCurrentState(channel, enqueue);
  return buildAppUpdateSnapshot(finalState, discovery.error);
}
