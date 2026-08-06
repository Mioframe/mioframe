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
import type { AppUpdateErrorCode } from './protocol';
import { fetchLatestReleasePointer, fetchReleaseDescriptor } from './releasePreparation';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import { applyDiscovery, completeAutomaticPreparation } from './stateTransitions';
import type { ReconciliationResult } from './updateReconciliation';
import { broadcastStateChanged, cleanupReleaseCache, combineLifetimeWork } from './workerBroadcast';

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
  /** Cold deferred broadcast/cleanup work; not started until explicitly invoked. */
  deferred?: (() => Promise<void>) | undefined;
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

  const deferred = combineLifetimeWork(
    applied.outcome !== 'skipped'
      ? () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {})
      : undefined,
    applied.outcome === 'updated' ? () => cleanupReleaseCache(channel, coordinator) : undefined,
  );

  return { descriptor, stateAfterDiscovery: applied.state, deferred };
}

/** Result of {@link prepareAutomaticTarget}. */
type AutomaticPreparationOutcome = {
  /** `'install-failed'` when preparation was attempted and failed; `undefined` on success. */
  error?: AppUpdateErrorCode;
  /** Cold deferred broadcast/cleanup work; not started until explicitly invoked. */
  deferred?: (() => Promise<void>) | undefined;
};

/**
 * Prepares `target` for Automatic mode and, on success, completes it to
 * `ready`. A preparation failure is a transient, non-persisted outcome: the
 * candidate stays `available`, no failure state is persisted, and no retry
 * is scheduled here — only a later ordinary reconciliation pass may attempt
 * preparation again, per the existing mode rules.
 * @param dependencies - Channel state, preparation, and event-side effects.
 * @param target - The release to prepare.
 * @param descriptor - An already fetched descriptor for `target`, when discovery just fetched it.
 * @returns The preparation error, if any, plus cold deferred broadcast/cleanup work.
 */
async function prepareAutomaticTarget(
  dependencies: UpdateDiscoveryDependencies,
  target: ReleaseSummary,
  descriptor: ReleaseDescriptor | undefined,
): Promise<AutomaticPreparationOutcome> {
  const { channel, channelBasePath, channelOrigin, enqueue, coordinator } = dependencies;
  const reusableDescriptor =
    descriptor && releaseSummariesMatch(toReleaseSummary(descriptor), target)
      ? descriptor
      : undefined;

  try {
    await coordinator.prepare(channel, channelBasePath, target, reusableDescriptor);
  } catch (error) {
    console.error('[app-update] Automatic release preparation failed', target.releaseNumber, error);
    return { error: 'install-failed' };
  }

  const changed = await withState(channel, enqueue, async (state) => {
    const next = completeAutomaticPreparation(state, target);
    if (next === state) return false;
    await writeControllerState(channel, next);
    return true;
  });
  return {
    deferred: changed
      ? () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {})
      : () => cleanupReleaseCache(channel, coordinator),
  };
}

/**
 * Runs one cohesive reconciliation pass from freshly persisted state.
 * The mode captured at the start defines discovery and preparation policy
 * for the whole pass; a concurrent durable mode change is handled by the
 * reconciliation owner's subsequent fresh-state rerun.
 *
 * Returns the durable snapshot separately from deferred broadcast/cleanup
 * work: every persisted transition (discovery, Automatic preparation
 * completion, the final fresh-state read) happens before this returns, but
 * `runLifetimeWork` — same-channel broadcast, release-cache cleanup — is a
 * cold callback the caller must explicitly invoke, and must never start on
 * its own by this function returning.
 * @param dependencies - Channel state, preparation, and event-side effects.
 * @returns The final durable snapshot plus optional deferred follow-up work.
 */
export async function runUpdateReconciliationPass(
  dependencies: UpdateDiscoveryDependencies,
): Promise<ReconciliationResult> {
  const { channel, enqueue } = dependencies;
  const initialState = await readCurrentState(channel, enqueue);
  const passMode = initialState.mode;
  const initialCandidate = initialState.candidate;

  if (initialCandidate?.phase === 'ready' || initialCandidate?.phase === 'activating') {
    return { snapshot: buildAppUpdateSnapshot(initialState) };
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

  let preparationError: AppUpdateErrorCode | undefined;
  let preparationDeferred: (() => Promise<void>) | undefined;
  if (target) {
    const prepared = await prepareAutomaticTarget(dependencies, target, discovery.descriptor);
    preparationError = prepared.error;
    preparationDeferred = prepared.deferred;
  }

  const finalState = await readCurrentState(channel, enqueue);
  return {
    snapshot: buildAppUpdateSnapshot(finalState, preparationError ?? discovery.error),
    runLifetimeWork: combineLifetimeWork(discovery.deferred, preparationDeferred),
  };
}
