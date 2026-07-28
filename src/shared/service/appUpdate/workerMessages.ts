/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import type { ManagedChannel, ReleaseRef, UpdateControllerState } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type {
  ActivationStatusResponse,
  AppUpdateRollbackBroadcast,
  AppUpdateWorkerRequest,
  AppUpdateWorkerResponse,
} from './protocol';
import {
  fetchLatestReleasePointer,
  fetchReleaseDescriptor,
  prepareRelease,
} from './releasePreparation';
import { buildAppUpdateSnapshot } from './snapshot';
import {
  approveAutomaticRelease,
  approveManualRelease,
  applyCheckForUpdates,
  cancelScheduledUpdate,
  commitActivation,
  rollbackActivation,
  switchToAutomaticMode,
  switchToManualMode,
} from './stateTransitions';

async function persistAndRespond(
  channel: ManagedChannel,
  state: UpdateControllerState,
  error?: Parameters<typeof buildAppUpdateSnapshot>[1],
): Promise<AppUpdateWorkerResponse> {
  await writeControllerState(channel, state);
  return { snapshot: buildAppUpdateSnapshot(state, error) };
}

async function prepareAndApproveLatest(
  channelBasePath: string,
  channel: ManagedChannel,
  state: UpdateControllerState,
  approve: (state: UpdateControllerState, prepared: ReleaseRef) => UpdateControllerState,
): Promise<UpdateControllerState> {
  const target = state.latestRelease;
  if (!target || target.releaseId === state.activeRelease.releaseId) return state;
  const descriptor = await fetchReleaseDescriptor(channelBasePath, target);
  await prepareRelease(channelBasePath, channel, descriptor);
  return approve(state, target);
}

/**
 * Broadcasts a rollback instruction to every same-channel window, so every
 * window currently in the failed activation reloads back into the restored
 * previous release. Only called after the rollback has already been
 * persisted.
 * @param failedReleaseId - The release id that failed to boot.
 */
async function broadcastRollback(failedReleaseId: string): Promise<void> {
  const message: AppUpdateRollbackBroadcast = {
    type: 'APP_UPDATE_ROLLBACK',
    releaseId: failedReleaseId,
  };
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) client.postMessage(message);
}

/**
 * Handles one private worker protocol request, serialized through this
 * channel's operation queue so concurrent commands (discovery, approval,
 * mode changes, boot confirmation) never interleave.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param request - The incoming protocol request.
 * @param enqueue - The channel's serialized operation queue.
 * @returns The resulting response.
 * @throws When persisted state is absent or invalid; this should never happen once install prerequisites have succeeded.
 */
export async function handleWorkerMessage(
  channel: ManagedChannel,
  channelBasePath: string,
  request: AppUpdateWorkerRequest,
  enqueue: OperationQueue,
): Promise<AppUpdateWorkerResponse | ActivationStatusResponse> {
  return enqueue(async () => {
    const read = await readControllerState(channel);
    if (read.status !== 'valid') {
      throw new Error('Controller state is unavailable; cannot handle worker protocol request');
    }
    const state = read.state;

    switch (request.type) {
      case 'GET_SNAPSHOT':
        return { snapshot: buildAppUpdateSnapshot(state) };

      case 'CHECK_FOR_UPDATES': {
        let discovered: ReleaseRef;
        try {
          discovered = await fetchLatestReleasePointer(channelBasePath);
        } catch {
          return { snapshot: buildAppUpdateSnapshot(state, 'check-failed') };
        }
        const checked = applyCheckForUpdates(state, discovered, new Date().toISOString());
        let nextState = checked.state;
        if (checked.outcome === 'updated' && nextState.mode === 'automatic') {
          try {
            nextState = await prepareAndApproveLatest(
              channelBasePath,
              channel,
              nextState,
              approveAutomaticRelease,
            );
          } catch {
            // Background preparation failure never blocks reporting the discovery itself.
          }
        }
        return persistAndRespond(channel, nextState);
      }

      case 'SET_MODE': {
        if (request.mode === 'manual') {
          return persistAndRespond(channel, switchToManualMode(state));
        }
        const target = state.latestRelease;
        const needsPrepare = target && target.releaseId !== state.activeRelease.releaseId;
        if (!needsPrepare) {
          return persistAndRespond(channel, switchToAutomaticMode(state));
        }
        try {
          const descriptor = await fetchReleaseDescriptor(channelBasePath, target);
          await prepareRelease(channelBasePath, channel, descriptor);
        } catch {
          return persistAndRespond(channel, switchToAutomaticMode(state), 'install-failed');
        }
        return persistAndRespond(channel, switchToAutomaticMode(state, target));
      }

      case 'INSTALL_ON_NEXT_LAUNCH': {
        if (!state.latestRelease) {
          return { snapshot: buildAppUpdateSnapshot(state, 'unavailable') };
        }
        try {
          const descriptor = await fetchReleaseDescriptor(channelBasePath, state.latestRelease);
          await prepareRelease(channelBasePath, channel, descriptor);
        } catch {
          return { snapshot: buildAppUpdateSnapshot(state, 'install-failed') };
        }
        return persistAndRespond(channel, approveManualRelease(state, state.latestRelease));
      }

      case 'CANCEL_SCHEDULED_UPDATE':
        return persistAndRespond(channel, cancelScheduledUpdate(state));

      case 'BOOT_OK':
        return persistAndRespond(channel, commitActivation(state, request.releaseId));

      case 'BOOT_FAILED': {
        const rolledBack = rollbackActivation(state, request.releaseId);
        const response = await persistAndRespond(channel, rolledBack);
        if (rolledBack !== state) await broadcastRollback(request.releaseId);
        return response;
      }

      case 'GET_ACTIVATION_STATUS': {
        const { activation } = state;
        if (activation && activation.targetRelease.releaseId === request.releaseId) {
          return { isActivationTarget: true, deadlineAt: activation.deadlineAt };
        }
        return { isActivationTarget: false };
      }
    }
  });
}
