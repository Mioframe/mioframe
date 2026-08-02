import type { ManagedChannel } from './contracts';
import { writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  withProtocolVersion,
  type ActivationStatusResponse,
  type AppUpdateBootAckResponse,
  type AppUpdateErrorCode,
  type AppUpdateWorkerRequest,
  type AppUpdateWorkerResponse,
  type WorkerMessageResult,
} from './protocol';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import {
  cancelScheduledUpdate,
  commitActivation,
  completeManualInstall,
  rollbackActivation,
  setMode,
} from './stateTransitions';
import type { UpdateReconciler } from './updateReconciliation';
import {
  broadcastRollback,
  broadcastStateChanged,
  cleanupReleaseCache,
  combineLifetimeWork,
} from './workerBroadcast';

/**
 * Prepares and approves the current Manual candidate for
 * `INSTALL_ON_NEXT_LAUNCH`. Preparation runs unlocked through `coordinator`;
 * the exact candidate release number and phase are captured before
 * preparation starts and re-validated against fresh state afterwards.
 *
 * Accepts only an `available` or `failed` candidate. A no-op, performing no
 * preparation, outside Manual mode or when the candidate is `ready` or
 * `activating` already (nothing to install, or already in progress) — an
 * unchanged snapshot is returned before preparation ever starts. Reports
 * `unavailable` only when there is no candidate at all to install.
 *
 * Success moves the candidate to `ready` — never approves a release
 * different from the one preparation actually ran for, even when mode or
 * the candidate changed while preparing. No cleanup is required for an
 * `available`/`failed` → `ready` transition (candidate ownership does not
 * shrink); a stale completion may leave an unowned prepared cache, cleaned
 * up as best effort.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting response, plus a same-channel invalidation follow-up when the install succeeded.
 */
async function installOnNextLaunch(
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
  const { candidate } = initial;
  if (!candidate) {
    return {
      response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(initial, 'unavailable') }),
    };
  }
  if (candidate.phase !== 'available' && candidate.phase !== 'failed') {
    // Already ready or activating: nothing more to install.
    return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(initial) }) };
  }
  const target = candidate.release;

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
    const next = completeManualInstall(state, target.releaseNumber);
    if (next === state) {
      // Superseded, mode-switched, or already advanced while preparing.
      return {
        response: withProtocolVersion({
          snapshot: buildAppUpdateSnapshot(state, 'install-failed'),
        }),
        runLifetimeWork: () => cleanupReleaseCache(channel, coordinator),
      };
    }
    await writeControllerState(channel, next);
    return {
      response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }),
      runLifetimeWork: () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
    };
  });
}

/**
 * Handles one private worker protocol request.
 *
 * Every case's persisted-state read/decide/persist runs through `enqueue`
 * (the channel's short state lock, see `stateLock.ts`); release discovery
 * and preparation (network fetch + hashing) always run outside it via
 * `updateDiscovery.ts`/`coordinator`, so a long release download can never
 * block navigation or another protocol request waiting on the same lock.
 *
 * Returns a {@link WorkerMessageResult}: `src/sw.ts` posts `response`
 * immediately, then only afterwards invokes and keeps `runLifetimeWork`
 * (cache cleanup, a same-channel invalidation broadcast, a rollback
 * broadcast, or deferred Automatic preparation) alive under the same
 * `message` event's `waitUntil()`. A read-only or no-op request carries no
 * `runLifetimeWork` at all.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param request - The incoming protocol request.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @param reconciler - The worker-local shared reconciliation owner.
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
  reconciler: UpdateReconciler,
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
      return {
        response: withProtocolVersion({ snapshot: await reconciler.checkForUpdates() }),
      };
    }

    case 'SET_MODE': {
      const { state: next, changed } = await withState(channel, enqueue, async (state) => {
        const result = setMode(state, request.mode);
        if (result !== state) await writeControllerState(channel, result);
        return { state: result, changed: result !== state };
      });
      return {
        response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }),
        runLifetimeWork: combineLifetimeWork(
          changed
            ? () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {})
            : undefined,
          changed ? () => reconciler.reconcileAfterModeChange() : undefined,
        ),
      };
    }

    case 'INSTALL_ON_NEXT_LAUNCH':
      return installOnNextLaunch(channel, channelBasePath, channelOrigin, enqueue, coordinator);

    case 'CANCEL_SCHEDULED_UPDATE':
      return withState(channel, enqueue, async (state) => {
        const next = cancelScheduledUpdate(state);
        if (next === state) {
          return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }) };
        }
        await writeControllerState(channel, next);
        return {
          response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(next) }),
          runLifetimeWork: () =>
            broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
        };
      });

    case 'BOOT_OK':
      return withState(channel, enqueue, async (state) => {
        const committed = commitActivation(state, request.releaseNumber);
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
        const rolledBack = rollbackActivation(state, request.releaseNumber);
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
          // reload same-channel windows, including this one. No cleanup:
          // activating -> failed does not shrink cache ownership.
          runLifetimeWork: () =>
            broadcastRollback(channelBasePath, channelOrigin, request.releaseNumber).catch(
              () => {},
            ),
        };
      });

    case 'GET_ACTIVATION_STATUS':
      return withState(channel, enqueue, (state) => {
        const { candidate } = state;
        if (
          candidate?.phase === 'activating' &&
          candidate.release.releaseNumber === request.releaseNumber
        ) {
          return {
            response: withProtocolVersion({
              isActivationTarget: true as const,
              deadlineAt: candidate.deadlineAt,
            }),
          };
        }
        return { response: withProtocolVersion({ isActivationTarget: false as const }) };
      });
  }
}
