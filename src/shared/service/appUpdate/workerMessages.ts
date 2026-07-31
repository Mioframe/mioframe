/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { isSameChannelWindowClient } from './cleanLaunch';
import type { ManagedChannel } from './contracts';
import { writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  withProtocolVersion,
  type ActivationStatusResponse,
  type AppUpdateBootAckResponse,
  type AppUpdateErrorCode,
  type AppUpdateRollbackBroadcast,
  type AppUpdateStateChangedBroadcast,
  type AppUpdateWorkerRequest,
  type AppUpdateWorkerResponse,
  type WorkerMessageResult,
} from './protocol';
import { runReleaseCacheCleanup } from './releaseCache';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import {
  approveAutomaticRelease,
  approveManualRelease,
  cancelScheduledUpdate,
  commitActivation,
  resolveAutomaticPreparationTarget,
  rollbackActivation,
  switchToAutomaticMode,
  switchToManualMode,
} from './stateTransitions';
import { runUpdateCheck } from './updateDiscovery';

/**
 * Broadcasts `message` to every currently live same-channel window client.
 * Never reaches a foreign-channel window (another branch, PR preview, or a
 * different managed channel sharing this origin).
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param message - The broadcast message to send.
 */
async function broadcastToSameChannelWindows(
  channelBasePath: string,
  channelOrigin: string,
  message: AppUpdateRollbackBroadcast | AppUpdateStateChangedBroadcast,
): Promise<void> {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    if (isSameChannelWindowClient(client, channelBasePath, channelOrigin)) {
      client.postMessage(message);
    }
  }
}

/**
 * Broadcasts a rollback instruction to every same-channel window, so every
 * window currently in the failed activation reloads back to the unchanged
 * active release. Only called after the rollback has already been
 * persisted.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param failedReleaseId - The release id that failed to boot.
 */
async function broadcastRollback(
  channelBasePath: string,
  channelOrigin: string,
  failedReleaseId: string,
): Promise<void> {
  await broadcastToSameChannelWindows(
    channelBasePath,
    channelOrigin,
    withProtocolVersion({ type: 'APP_UPDATE_ROLLBACK' as const, releaseId: failedReleaseId }),
  );
}

/**
 * Broadcasts the private state-invalidation notification to every
 * same-channel window, so an already-open window can refresh its own
 * snapshot via `GET_SNAPSHOT` after a state change. Used both after a
 * background check (with no foreground requester waiting on its own
 * response) and, as this module's own message-event follow-up work, after a
 * foreground command durably changes snapshot-relevant state — the
 * initiating caller already received its own resulting snapshot directly,
 * so this only ever needs to reach every *other* same-channel window. Never
 * called for a failed or no-op change.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 */
export async function broadcastStateChanged(
  channelBasePath: string,
  channelOrigin: string,
): Promise<void> {
  await broadcastToSameChannelWindows(
    channelBasePath,
    channelOrigin,
    withProtocolVersion({ type: 'APP_UPDATE_STATE_CHANGED' as const }),
  );
}

/**
 * Runs this channel's release-cache cleanup as best-effort follow-up work:
 * failures are swallowed rather than surfaced, since cleanup must never
 * change an already-durable command result. Deferred: starting the cleanup
 * itself is the caller's responsibility, not this function's — this only
 * builds the promise once called.
 * @param channel - Managed channel to clean up.
 * @param coordinator - The channel's preparation coordinator.
 * @returns A promise that never rejects.
 */
function cleanupReleaseCache(
  channel: ManagedChannel,
  coordinator: PreparationCoordinator,
): Promise<void> {
  return coordinator
    .runCleanup((inFlightReleaseIds) => runReleaseCacheCleanup(channel, inFlightReleaseIds))
    .catch(() => {});
}

/**
 * Combines zero or more optional deferred follow-up work callbacks into the
 * single `runLifetimeWork` callback a `WorkerMessageResult` carries.
 * `undefined` when none are given, so a read-only or no-op request never
 * carries pointless follow-up work. None of `work`'s callbacks are invoked
 * until the combined callback itself is invoked — this must never start any
 * follow-up work before the response has been posted. Once invoked, the
 * underlying work items may run concurrently.
 * @param work - Optional deferred follow-up work callbacks to combine.
 * @returns The combined callback, or `undefined` when `work` is empty.
 */
function combineLifetimeWork(
  ...work: Array<(() => Promise<void>) | undefined>
): (() => Promise<void>) | undefined {
  const pending = work.filter((item): item is () => Promise<void> => item !== undefined);
  if (pending.length === 0) return undefined;
  return () => Promise.all(pending.map((run) => run())).then(() => undefined);
}

/**
 * Switches to Automatic mode, preparing and approving the latest known
 * release first when needed.
 *
 * Runs as two short serialized transactions with unlocked preparation in
 * between, so a long-running switch can never let a later, faster request
 * (e.g. a Manual switch) be silently overwritten once it completes:
 *
 * 1. Reads current state, switches it to Automatic, and persists that mode
 *    change immediately — before any preparation starts — then resolves
 *    whether preparation is required from the now-current state.
 * 2. Only if a target was resolved: preparation runs unlocked through
 *    `coordinator`; once it settles, a second transaction re-reads state
 *    fresh and attempts the approval through {@link approveAutomaticRelease}.
 *    That transition is the sole owner of the mode invariant (see its own
 *    doc): if mode is no longer Automatic (a later request switched to
 *    Manual while this one was preparing), the approval is silently skipped
 *    rather than resurrecting Automatic mode or the stale target. This
 *    transaction never itself sets the mode.
 *
 * While an activation is already in progress, the mode still switches, but
 * never triggers preparation or approval of another release:
 * `approvedRelease` and `activation` are mutually exclusive, and no release
 * may be approved until the current clean-launch attempt resolves.
 *
 * Uses {@link resolveAutomaticPreparationTarget} — the same decision
 * `runUpdateCheck` uses — to decide whether preparation is required, rather
 * than a separate simplified `latestRelease !== activeRelease` condition:
 * this is what makes a repeated `SET_MODE automatic` with the latest release
 * already approved fetch nothing, prepare nothing, write nothing, and
 * broadcast nothing. State is written, and follow-up work created, only when
 * a transition actually returns a different state object.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting response, plus cache-cleanup and same-channel invalidation follow-up work when a real change occurred.
 */
async function switchToAutomaticModeWithPrepare(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<WorkerMessageResult<AppUpdateWorkerResponse>> {
  const afterModeSwitch = await withState(channel, enqueue, async (state) => {
    const next = switchToAutomaticMode(state);
    const changed = next !== state;
    if (changed) await writeControllerState(channel, next);
    return { state: next, changed, target: resolveAutomaticPreparationTarget(next) };
  });

  if (!afterModeSwitch.target) {
    return {
      response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(afterModeSwitch.state) }),
      runLifetimeWork: afterModeSwitch.changed
        ? () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {})
        : undefined,
    };
  }

  const target = afterModeSwitch.target;
  let error: AppUpdateErrorCode | undefined;
  try {
    await coordinator.prepare(channel, channelBasePath, target);
  } catch {
    error = 'install-failed';
  }

  return withState(channel, enqueue, async (state) => {
    const stillValid = !error && state.latestRelease?.releaseId === target.releaseId;
    const next = stillValid ? approveAutomaticRelease(state, target) : state;
    if (next === state) {
      return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(state, error) }) };
    }
    await writeControllerState(channel, next);
    return {
      response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next, error) }),
      runLifetimeWork: combineLifetimeWork(
        () => cleanupReleaseCache(channel, coordinator),
        () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
      ),
    };
  });
}

/**
 * Prepares and approves the current latest release for Manual
 * `INSTALL_ON_NEXT_LAUNCH`. Preparation runs unlocked through `coordinator`;
 * the target is re-validated against current state before being approved.
 *
 * A no-op, performing no preparation or approval, outside Manual mode: an
 * unchanged snapshot is returned before preparation ever starts. Since mode
 * can still change while preparation is in flight, the final approval also
 * goes through {@link approveManualRelease}, which re-checks the mode
 * against state read fresh after preparation completes — switching to
 * Automatic mid-preparation can never create a Manual approval.
 *
 * A no-op, performing no preparation or approval, while an activation is
 * already in progress: `approvedRelease` and `activation` are mutually
 * exclusive, and no release may be approved until the current clean-launch
 * attempt resolves.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting response, plus cache-cleanup and same-channel invalidation follow-up work.
 */
async function installLatestOnNextLaunch(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<WorkerMessageResult<AppUpdateWorkerResponse>> {
  const initial = await withState(channel, enqueue, (state) => state);
  if (initial.mode !== 'manual') {
    return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(initial) }) };
  }
  if (initial.activation) {
    return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(initial) }) };
  }
  const target = initial.latestRelease;
  if (!target) {
    return {
      response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(initial, 'unavailable') }),
    };
  }

  let error: AppUpdateErrorCode | undefined;
  try {
    await coordinator.prepare(channel, channelBasePath, target);
  } catch {
    error = 'install-failed';
  }

  return withState(channel, enqueue, async (state) => {
    if (error) {
      return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(state, error) }) };
    }
    if (state.latestRelease?.releaseId !== target.releaseId) {
      // Superseded by a newer discovery while preparing: approving it now
      // would silently schedule a release the user never saw offered.
      return {
        response: withProtocolVersion({
          snapshot: buildAppUpdateSnapshot(state, 'install-failed'),
        }),
      };
    }
    const next = approveManualRelease(state, target);
    if (next === state) {
      return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }) };
    }
    await writeControllerState(channel, next);
    return {
      response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }),
      runLifetimeWork: combineLifetimeWork(
        () => cleanupReleaseCache(channel, coordinator),
        () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
      ),
    };
  });
}

/**
 * Handles one private worker protocol request.
 *
 * Every case's persisted-state read/decide/persist runs through `enqueue`
 * (the channel's short state lock, see `stateLock.ts`); release discovery
 * and preparation (network fetch + hashing) always run outside it via
 * `runUpdateCheck`/`coordinator`, so a long release download can never block
 * navigation or another protocol request waiting on the same lock.
 *
 * Returns a {@link WorkerMessageResult}: `src/sw.ts` posts `response`
 * immediately, then only afterwards invokes and keeps `runLifetimeWork`
 * (cache cleanup, a same-channel invalidation broadcast, or a rollback
 * broadcast) alive under the same `message` event's `waitUntil()`. A
 * read-only or no-op request carries no `runLifetimeWork` at all.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param request - The incoming protocol request.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting message result.
 * @throws When persisted state is absent or invalid; this should never happen once install prerequisites have succeeded.
 */
export async function handleWorkerMessage(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  request: AppUpdateWorkerRequest,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<
  WorkerMessageResult<AppUpdateWorkerResponse | AppUpdateBootAckResponse | ActivationStatusResponse>
> {
  switch (request.type) {
    case 'GET_SNAPSHOT': {
      const response = await withState(channel, enqueue, (state) =>
        withProtocolVersion({ snapshot: buildAppUpdateSnapshot(state) }),
      );
      return { response };
    }

    case 'CHECK_FOR_UPDATES': {
      const result = await runUpdateCheck(channel, channelBasePath, enqueue, coordinator);
      const stateChanged = result.response.snapshot.error !== 'check-failed';
      return {
        response: result.response,
        runLifetimeWork: combineLifetimeWork(
          result.runLifetimeWork,
          stateChanged
            ? () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {})
            : undefined,
        ),
      };
    }

    case 'SET_MODE': {
      if (request.mode === 'manual') {
        return withState(channel, enqueue, async (state) => {
          const next = switchToManualMode(state);
          if (next === state) {
            return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }) };
          }
          await writeControllerState(channel, next);
          return {
            response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }),
            runLifetimeWork: combineLifetimeWork(
              () => cleanupReleaseCache(channel, coordinator),
              () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
            ),
          };
        });
      }
      return switchToAutomaticModeWithPrepare(
        channel,
        channelBasePath,
        channelOrigin,
        enqueue,
        coordinator,
      );
    }

    case 'INSTALL_ON_NEXT_LAUNCH':
      return installLatestOnNextLaunch(
        channel,
        channelBasePath,
        channelOrigin,
        enqueue,
        coordinator,
      );

    case 'CANCEL_SCHEDULED_UPDATE':
      return withState(channel, enqueue, async (state) => {
        const next = cancelScheduledUpdate(state);
        if (next === state) {
          return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }) };
        }
        await writeControllerState(channel, next);
        return {
          response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }),
          runLifetimeWork: combineLifetimeWork(
            () => cleanupReleaseCache(channel, coordinator),
            () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
          ),
        };
      });

    case 'BOOT_OK':
      return withState(channel, enqueue, async (state) => {
        const committed = commitActivation(state, request.releaseId);
        if (committed === state) {
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'ignored' as const,
            }),
          };
        }
        try {
          await writeControllerState(channel, committed);
        } catch {
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'error' as const,
            }),
          };
        }
        return {
          response: withProtocolVersion({
            snapshot: buildAppUpdateSnapshot(committed),
            ack: 'committed' as const,
          }),
          // Existing UI readers refresh from the committed active release
          // instead of remaining on their pre-commit snapshot.
          runLifetimeWork: combineLifetimeWork(
            () => cleanupReleaseCache(channel, coordinator),
            () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
          ),
        };
      });

    case 'BOOT_FAILED':
      return withState(channel, enqueue, async (state) => {
        const rolledBack = rollbackActivation(state, request.releaseId);
        if (rolledBack === state) {
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'ignored' as const,
            }),
          };
        }
        try {
          await writeControllerState(channel, rolledBack);
        } catch {
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'error' as const,
            }),
          };
        }
        return {
          response: withProtocolVersion({
            snapshot: buildAppUpdateSnapshot(rolledBack),
            ack: 'rolled-back' as const,
          }),
          // The acknowledgement above is posted before this broadcast can
          // reload same-channel windows, including this one.
          runLifetimeWork: combineLifetimeWork(
            () =>
              broadcastRollback(channelBasePath, channelOrigin, request.releaseId).catch(() => {}),
            () => cleanupReleaseCache(channel, coordinator),
          ),
        };
      });

    case 'GET_ACTIVATION_STATUS':
      return withState(channel, enqueue, (state) => {
        const { activation } = state;
        if (activation && activation.targetRelease.releaseId === request.releaseId) {
          return {
            response: withProtocolVersion({
              isActivationTarget: true as const,
              deadlineAt: activation.deadlineAt,
            }),
          };
        }
        return { response: withProtocolVersion({ isActivationTarget: false as const }) };
      });
  }
}
