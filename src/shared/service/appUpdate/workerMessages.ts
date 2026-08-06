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
  type RecoverInstallLatestResponse,
  type WorkerMessageResult,
} from './protocol';
import { runRecoverInstallLatest } from './recoveryOrchestration';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import {
  cancelScheduledUpdate,
  classifyBootFailed,
  classifyBootOk,
  classifyManualInstallCompletion,
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
    const outcome = classifyManualInstallCompletion(state, target);
    if (outcome.kind === 'already-satisfied') {
      // Already ready(target), activating(target), or activeRelease is
      // already target: a concurrent duplicate Manual install of the exact
      // same release is a success, not install-failed. No write, no cleanup.
      return { response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(state) }) };
    }
    if (outcome.kind === 'stale') {
      // A different candidate, conflicting metadata on the same release
      // number, an incompatible candidate phase, or mode no longer Manual.
      return {
        response: withProtocolVersion({
          snapshot: buildAppUpdateSnapshot(state, 'install-failed'),
        }),
        runLifetimeWork: () => cleanupReleaseCache(channel, coordinator),
      };
    }
    await writeControllerState(channel, outcome.state);
    return {
      response: withProtocolVersion({ snapshot: buildAppUpdateSnapshot(outcome.state) }),
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
  WorkerMessageResult<
    | AppUpdateWorkerResponse
    | AppUpdateBootAckResponse
    | ActivationStatusResponse
    | RecoverInstallLatestResponse
  >
> {
  switch (request.type) {
    case 'GET_SNAPSHOT': {
      const response = await withState(channel, enqueue, (state) =>
        withProtocolVersion({ snapshot: buildAppUpdateSnapshot(state) }),
      );
      return { response };
    }

    case 'CHECK_FOR_UPDATES': {
      const { snapshot, runLifetimeWork } = await reconciler.checkForUpdates();
      return {
        response: withProtocolVersion({ snapshot }),
        runLifetimeWork,
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
        const outcome = classifyBootOk(state, request.releaseNumber, new Date().toISOString());
        if (outcome.kind === 'idempotent-committed') {
          // activeRelease is already this release: a repeated confirmation
          // for the release that already won. No write, no broadcast.
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'committed' as const,
            }),
          };
        }
        if (outcome.kind === 'idempotent-rolled-back') {
          // This release is neither activeRelease nor the current activating
          // target: a stale window whose own rollback broadcast may have
          // been missed. The direct acknowledgement alone recovers it, with
          // no write and no broadcast.
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'rolled-back' as const,
            }),
          };
        }
        try {
          await writeControllerState(channel, outcome.state);
        } catch {
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'error' as const,
            }),
          };
        }
        if (outcome.kind === 'rolled-back') {
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(outcome.state),
              ack: 'rolled-back' as const,
            }),
            // The acknowledgement above is posted before this broadcast can
            // reload same-channel windows, including the reporting window.
            // No cleanup: activating -> failed does not shrink cache ownership.
            runLifetimeWork: () =>
              broadcastRollback(channelBasePath, channelOrigin, request.releaseNumber).catch(
                () => {},
              ),
          };
        }
        return {
          response: withProtocolVersion({
            snapshot: buildAppUpdateSnapshot(outcome.state),
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
        const outcome = classifyBootFailed(state, request.releaseNumber);
        if (outcome.kind === 'ignored') {
          // This release is the current activeRelease but not an activation
          // target at all: the existing non-activation no-op, preserved
          // as-is rather than reinterpreted as a rollback.
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'ignored' as const,
            }),
          };
        }
        if (outcome.kind === 'idempotent-rolled-back') {
          // Neither the current activating target nor activeRelease: a
          // stale window reporting failure for an already-rolled-back
          // release. No write, no broadcast.
          return {
            response: withProtocolVersion({
              snapshot: buildAppUpdateSnapshot(state),
              ack: 'rolled-back' as const,
            }),
          };
        }
        try {
          await writeControllerState(channel, outcome.state);
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
            snapshot: buildAppUpdateSnapshot(outcome.state),
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

    case 'RECOVER_INSTALL_LATEST': {
      // Deliberately never routed through `withState()`: this command must
      // remain handleable when persisted state is absent or invalid, exactly
      // the cases `withState()` intentionally rejects. `runRecoverInstallLatest`
      // owns its own fresh reads/writes, each under the short queue.
      const result = await runRecoverInstallLatest({
        channel,
        channelBasePath,
        enqueue,
        coordinator,
      });
      return {
        response: withProtocolVersion({ result }),
        runLifetimeWork:
          result === 'success'
            ? combineLifetimeWork(
                () => cleanupReleaseCache(channel, coordinator),
                () => broadcastStateChanged(channelBasePath, channelOrigin).catch(() => {}),
              )
            : undefined,
      };
    }
  }
}
