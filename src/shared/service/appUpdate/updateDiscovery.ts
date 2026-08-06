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
import {
  mergeReconciliationEffects,
  type ReconciliationEffects,
  type ReconciliationPassResult,
} from './updateReconciliation';
import { broadcastStateChanged, cleanupReleaseCache } from './workerBroadcast';

const NO_EFFECTS: ReconciliationEffects = {
  broadcastStateChanged: false,
  cleanupReleaseCache: false,
};

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
  /** Follow-up work this discovery step requires. Not executed here. */
  effects: ReconciliationEffects;
};

const readCurrentState = (channel: ManagedChannel, enqueue: OperationQueue) =>
  withState(channel, enqueue, (state) => state);

async function discoverLatest(
  dependencies: UpdateDiscoveryDependencies,
): Promise<DiscoveryOutcome> {
  const { channel, channelBasePath, enqueue } = dependencies;
  let descriptor: ReleaseDescriptor;
  try {
    const pointer = await fetchLatestReleasePointer(channelBasePath);
    descriptor = await fetchReleaseDescriptor(channelBasePath, pointer);
  } catch {
    return {
      error: 'check-failed',
      stateAfterDiscovery: await readCurrentState(channel, enqueue),
      effects: NO_EFFECTS,
    };
  }

  const discovered = toReleaseSummary(descriptor);
  const checkedAt = new Date().toISOString();
  const applied = await withState(channel, enqueue, async (state) => {
    const result = applyDiscovery(state, discovered, checkedAt);
    if (result.state !== state) await writeControllerState(channel, result.state);
    return result;
  });

  const effects: ReconciliationEffects = {
    broadcastStateChanged: applied.outcome !== 'skipped',
    cleanupReleaseCache: applied.outcome === 'updated',
  };

  return { descriptor, stateAfterDiscovery: applied.state, effects };
}

/** Result of {@link prepareAutomaticTarget}. */
type AutomaticPreparationOutcome = {
  /** `'install-failed'` when preparation was attempted and failed; `undefined` on success. */
  error?: AppUpdateErrorCode;
  /** Follow-up work this preparation step requires. Not executed here. */
  effects: ReconciliationEffects;
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
 * @returns The preparation error, if any, plus the follow-up effects it requires.
 */
async function prepareAutomaticTarget(
  dependencies: UpdateDiscoveryDependencies,
  target: ReleaseSummary,
  descriptor: ReleaseDescriptor | undefined,
): Promise<AutomaticPreparationOutcome> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;
  const reusableDescriptor =
    descriptor && releaseSummariesMatch(toReleaseSummary(descriptor), target)
      ? descriptor
      : undefined;

  try {
    await coordinator.prepare(channel, channelBasePath, target, reusableDescriptor);
  } catch (error) {
    console.error('[app-update] Automatic release preparation failed', target.releaseNumber, error);
    return { error: 'install-failed', effects: NO_EFFECTS };
  }

  const changed = await withState(channel, enqueue, async (state) => {
    const next = completeAutomaticPreparation(state, target);
    if (next === state) return false;
    await writeControllerState(channel, next);
    return true;
  });
  return {
    effects: { broadcastStateChanged: changed, cleanupReleaseCache: !changed },
  };
}

/**
 * Runs one cohesive reconciliation pass from freshly persisted state.
 * The mode captured at the start defines discovery and preparation policy
 * for the whole pass; a concurrent durable mode change is handled by the
 * reconciliation owner's subsequent fresh-state rerun.
 *
 * Returns the durable snapshot separately from the {@link ReconciliationEffects}
 * it requires: every persisted transition (discovery, Automatic preparation
 * completion, the final fresh-state read) happens before this returns, but
 * the returned effects are purely declarative — this function never itself
 * broadcasts or cleans up. Only the reconciler's own attempt-level effect
 * runner (see `updateReconciliation.ts`) translates them into the actual
 * calls, via {@link runReconciliationEffects}.
 * @param dependencies - Channel state, preparation, and event-side effects.
 * @returns The final durable snapshot plus the effects this pass requires.
 */
export async function runUpdateReconciliationPass(
  dependencies: UpdateDiscoveryDependencies,
): Promise<ReconciliationPassResult> {
  const { channel, enqueue } = dependencies;
  const initialState = await readCurrentState(channel, enqueue);
  const passMode = initialState.mode;
  const initialCandidate = initialState.candidate;

  if (initialCandidate?.phase === 'ready' || initialCandidate?.phase === 'activating') {
    return { snapshot: buildAppUpdateSnapshot(initialState), effects: NO_EFFECTS };
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
  let preparationEffects = NO_EFFECTS;
  if (target) {
    const prepared = await prepareAutomaticTarget(dependencies, target, discovery.descriptor);
    preparationError = prepared.error;
    preparationEffects = prepared.effects;
  }

  const finalState = await readCurrentState(channel, enqueue);
  return {
    snapshot: buildAppUpdateSnapshot(finalState, preparationError ?? discovery.error),
    effects: mergeReconciliationEffects(discovery.effects, preparationEffects),
  };
}

/**
 * Executes the given {@link ReconciliationEffects}: the actual same-channel
 * `APP_UPDATE_STATE_CHANGED` broadcast and/or release-cache cleanup. Never
 * called by `runUpdateReconciliationPass` itself — only by the reconciler's
 * own attempt-level effect runner, strictly after the owning response has
 * already been posted (see `updateReconciliation.ts`). Both underlying calls
 * are already best-effort (`broadcastStateChanged` here, `cleanupReleaseCache`
 * internally): neither can reject out of this function.
 * @param dependencies - Channel state and cleanup coordinator.
 * @param effects - The effects to execute.
 */
export async function runReconciliationEffects(
  dependencies: UpdateDiscoveryDependencies,
  effects: ReconciliationEffects,
): Promise<void> {
  const { channel, channelBasePath, channelOrigin, coordinator } = dependencies;
  await Promise.all([
    effects.broadcastStateChanged
      ? broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {})
      : undefined,
    effects.cleanupReleaseCache ? cleanupReleaseCache(channel, coordinator) : undefined,
  ]);
}
