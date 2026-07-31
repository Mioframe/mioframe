/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { isSameChannelWindowClient } from './cleanLaunch';
import type { ManagedChannel } from './contracts';
import {
  withProtocolVersion,
  type AppUpdateRollbackBroadcast,
  type AppUpdateStateChangedBroadcast,
} from './protocol';
import type { PreparationCoordinator } from './preparationCoordinator';
import { runReleaseCacheCleanup } from './releaseCache';

/**
 * Broadcasts `message` to every currently live same-channel window client,
 * other than any in `excludedClientIds`. Never reaches a foreign-channel
 * window (another branch, PR preview, or a different managed channel sharing
 * this origin).
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param message - The broadcast message to send.
 * @param excludedClientIds - Client ids to skip, e.g. the navigation currently receiving the same rolled-back release directly.
 */
async function broadcastToSameChannelWindows(
  channelBasePath: string,
  channelOrigin: string,
  message: AppUpdateRollbackBroadcast | AppUpdateStateChangedBroadcast,
  excludedClientIds: ReadonlySet<string> = new Set(),
): Promise<void> {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    if (excludedClientIds.has(client.id)) continue;
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
 *
 * `excludedClientIds` excludes a navigation that is already receiving the
 * unchanged active release directly as its own response — it needs no
 * reload broadcast. A `BOOT_FAILED` acknowledgement's own reporting window
 * is never excluded: unlike a fresh navigation, it is an already-loaded
 * window whose only reload trigger is this broadcast (see
 * `scripts/pages/lib/watchdogInject.mjs`'s `reportBootFailed`).
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param failedReleaseNumber - The release number that failed to boot.
 * @param excludedClientIds - Client ids never to reach with this broadcast.
 */
export async function broadcastRollback(
  channelBasePath: string,
  channelOrigin: string,
  failedReleaseNumber: number,
  excludedClientIds: ReadonlySet<string> = new Set(),
): Promise<void> {
  await broadcastToSameChannelWindows(
    channelBasePath,
    channelOrigin,
    withProtocolVersion({
      type: 'APP_UPDATE_ROLLBACK' as const,
      releaseNumber: failedReleaseNumber,
    }),
    excludedClientIds,
  );
}

/**
 * Broadcasts the private state-invalidation notification to every
 * same-channel window, so an already-open window can refresh its own
 * snapshot via `GET_SNAPSHOT` after a state change. Used both after a
 * background check (with no foreground requester waiting on its own
 * response) and, as message-event follow-up work, after a foreground
 * command durably changes snapshot-relevant state — the initiating caller
 * already received its own resulting snapshot directly, so this only ever
 * needs to reach every *other* same-channel window. Never called for a
 * failed or no-op change.
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
export function cleanupReleaseCache(
  channel: ManagedChannel,
  coordinator: PreparationCoordinator,
): Promise<void> {
  return coordinator
    .runCleanup((inFlightReleaseNumbers) => runReleaseCacheCleanup(channel, inFlightReleaseNumbers))
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
export function combineLifetimeWork(
  ...work: Array<(() => Promise<void>) | undefined>
): (() => Promise<void>) | undefined {
  const pending = work.filter((item): item is () => Promise<void> => item !== undefined);
  if (pending.length === 0) return undefined;
  return () => Promise.all(pending.map((run) => run())).then(() => undefined);
}
