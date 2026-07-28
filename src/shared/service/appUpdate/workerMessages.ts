/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { isSameChannelWindowClient } from './cleanLaunch';
import type { ManagedChannel } from './contracts';
import { writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import type {
  ActivationStatusResponse,
  AppUpdateBootAckResponse,
  AppUpdateErrorCode,
  AppUpdateRollbackBroadcast,
  AppUpdateWorkerRequest,
  AppUpdateWorkerResponse,
} from './protocol';
import { runReleaseCacheCleanup } from './releaseCache';
import { buildAppUpdateSnapshot } from './snapshot';
import { withState } from './stateLock';
import {
  approveManualRelease,
  cancelScheduledUpdate,
  commitActivation,
  rollbackActivation,
  switchToAutomaticMode,
  switchToManualMode,
} from './stateTransitions';
import { runUpdateCheck } from './updateDiscovery';

/**
 * Broadcasts a rollback instruction to every same-channel window, so every
 * window currently in the failed activation reloads back to the unchanged
 * active release. Only called after the rollback has already been
 * persisted. Never reaches a foreign-channel window (another branch, PR
 * preview, or a different managed channel sharing this origin).
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param failedReleaseId - The release id that failed to boot.
 */
async function broadcastRollback(
  channelBasePath: string,
  channelOrigin: string,
  failedReleaseId: string,
): Promise<void> {
  const message: AppUpdateRollbackBroadcast = {
    type: 'APP_UPDATE_ROLLBACK',
    releaseId: failedReleaseId,
  };
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    if (isSameChannelWindowClient(client, channelBasePath, channelOrigin)) {
      client.postMessage(message);
    }
  }
}

/**
 * Switches to Automatic mode, preparing and approving the latest known
 * release first when needed. The short state lock only covers the initial
 * decision and the final persist; preparation runs unlocked through
 * `coordinator`, and the target is re-validated against current state
 * before being approved, exactly like {@link runUpdateCheck}.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting response.
 */
async function switchToAutomaticModeWithPrepare(
  channel: ManagedChannel,
  channelBasePath: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<AppUpdateWorkerResponse> {
  const decision = await withState(channel, enqueue, async (state) => {
    const target = state.latestRelease;
    const needsPrepare = target && target.releaseId !== state.activeRelease.releaseId;
    if (!needsPrepare) {
      const next = switchToAutomaticMode(state);
      await writeControllerState(channel, next);
      return { done: true as const, response: { snapshot: buildAppUpdateSnapshot(next) } };
    }
    return { done: false as const, target };
  });
  if (decision.done) return decision.response;

  const target = decision.target;
  let error: AppUpdateErrorCode | undefined;
  try {
    await coordinator.prepare(channel, channelBasePath, target);
  } catch {
    error = 'install-failed';
  }

  return withState(channel, enqueue, async (state) => {
    const stillValid = !error && state.latestRelease?.releaseId === target.releaseId;
    const next = switchToAutomaticMode(state, stillValid ? target : undefined);
    await writeControllerState(channel, next);
    if (next !== state) {
      void runReleaseCacheCleanup(channel, coordinator.getInFlightReleaseIds()).catch(() => {});
    }
    return { snapshot: buildAppUpdateSnapshot(next, error) };
  });
}

/**
 * Prepares and approves the current latest release for Manual
 * `INSTALL_ON_NEXT_LAUNCH`. Preparation runs unlocked through `coordinator`;
 * the target is re-validated against current state before being approved.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting response.
 */
async function installLatestOnNextLaunch(
  channel: ManagedChannel,
  channelBasePath: string,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<AppUpdateWorkerResponse> {
  const initial = await withState(channel, enqueue, (state) => state);
  const target = initial.latestRelease;
  if (!target) return { snapshot: buildAppUpdateSnapshot(initial, 'unavailable') };

  let error: AppUpdateErrorCode | undefined;
  try {
    await coordinator.prepare(channel, channelBasePath, target);
  } catch {
    error = 'install-failed';
  }

  return withState(channel, enqueue, async (state) => {
    if (error) return { snapshot: buildAppUpdateSnapshot(state, error) };
    if (state.latestRelease?.releaseId !== target.releaseId) {
      // Superseded by a newer discovery while preparing: approving it now
      // would silently schedule a release the user never saw offered.
      return { snapshot: buildAppUpdateSnapshot(state, 'install-failed') };
    }
    const next = approveManualRelease(state, target);
    await writeControllerState(channel, next);
    void runReleaseCacheCleanup(channel, coordinator.getInFlightReleaseIds()).catch(() => {});
    return { snapshot: buildAppUpdateSnapshot(next) };
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
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param request - The incoming protocol request.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The resulting response.
 * @throws When persisted state is absent or invalid; this should never happen once install prerequisites have succeeded.
 */
export async function handleWorkerMessage(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  request: AppUpdateWorkerRequest,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<AppUpdateWorkerResponse | AppUpdateBootAckResponse | ActivationStatusResponse> {
  switch (request.type) {
    case 'GET_SNAPSHOT':
      return withState(channel, enqueue, (state) => ({ snapshot: buildAppUpdateSnapshot(state) }));

    case 'CHECK_FOR_UPDATES':
      return runUpdateCheck(channel, channelBasePath, enqueue, coordinator);

    case 'SET_MODE': {
      if (request.mode === 'manual') {
        return withState(channel, enqueue, async (state) => {
          const next = switchToManualMode(state);
          await writeControllerState(channel, next);
          void runReleaseCacheCleanup(channel, coordinator.getInFlightReleaseIds()).catch(() => {});
          return { snapshot: buildAppUpdateSnapshot(next) };
        });
      }
      return switchToAutomaticModeWithPrepare(channel, channelBasePath, enqueue, coordinator);
    }

    case 'INSTALL_ON_NEXT_LAUNCH':
      return installLatestOnNextLaunch(channel, channelBasePath, enqueue, coordinator);

    case 'CANCEL_SCHEDULED_UPDATE':
      return withState(channel, enqueue, async (state) => {
        const next = cancelScheduledUpdate(state);
        if (next !== state) {
          await writeControllerState(channel, next);
          void runReleaseCacheCleanup(channel, coordinator.getInFlightReleaseIds()).catch(() => {});
        }
        return { snapshot: buildAppUpdateSnapshot(next) };
      });

    case 'BOOT_OK': {
      const result = await withState(channel, enqueue, async (state) => {
        const committed = commitActivation(state, request.releaseId);
        if (committed === state) {
          return {
            response: { snapshot: buildAppUpdateSnapshot(state), ack: 'ignored' as const },
            didCommit: false,
          };
        }
        try {
          await writeControllerState(channel, committed);
        } catch {
          return {
            response: { snapshot: buildAppUpdateSnapshot(state), ack: 'error' as const },
            didCommit: false,
          };
        }
        return {
          response: { snapshot: buildAppUpdateSnapshot(committed), ack: 'committed' as const },
          didCommit: true,
        };
      });
      if (result.didCommit) {
        void runReleaseCacheCleanup(channel, coordinator.getInFlightReleaseIds()).catch(() => {});
      }
      return result.response;
    }

    case 'BOOT_FAILED': {
      const result = await withState(channel, enqueue, async (state) => {
        const rolledBack = rollbackActivation(state, request.releaseId);
        if (rolledBack === state) {
          return {
            response: { snapshot: buildAppUpdateSnapshot(state), ack: 'ignored' as const },
            didRollback: false,
          };
        }
        try {
          await writeControllerState(channel, rolledBack);
        } catch {
          return {
            response: { snapshot: buildAppUpdateSnapshot(state), ack: 'error' as const },
            didRollback: false,
          };
        }
        return {
          response: { snapshot: buildAppUpdateSnapshot(rolledBack), ack: 'rolled-back' as const },
          didRollback: true,
        };
      });
      if (result.didRollback) {
        await broadcastRollback(channelBasePath, channelOrigin, request.releaseId);
        void runReleaseCacheCleanup(channel, coordinator.getInFlightReleaseIds()).catch(() => {});
      }
      return result.response;
    }

    case 'GET_ACTIVATION_STATUS':
      return withState(channel, enqueue, (state) => {
        const { activation } = state;
        if (activation && activation.targetRelease.releaseId === request.releaseId) {
          return { isActivationTarget: true, deadlineAt: activation.deadlineAt };
        }
        return { isActivationTarget: false };
      });
  }
}
