/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import type { ManagedChannel, ReleaseRef } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import { BOOT_CONFIRMATION_TIMEOUT_MS } from './bootConfirmation';
import { countSameChannelWindowClients, type WindowClientIdentity } from './cleanLaunch';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  buildReleaseCacheName,
  checkReleaseAvailability,
  isReleaseFilePath,
  readReleaseDescriptorMarker,
  readReleaseIndexMarker,
  runReleaseCacheCleanup,
} from './releaseCache';
import {
  isActivationExpired,
  rollbackActivation,
  shouldStartActivation,
  startActivation,
} from './stateTransitions';

const UNAVAILABLE_RESPONSE = () => new Response('Release unavailable', { status: 503 });

/**
 * Lists every live window client, including a same-channel window this
 * worker does not yet control (no `clients.claim()` means a fresh
 * registration's first page stays uncontrolled) — such a page must still be
 * counted by the clean-launch decision.
 * @returns Every live window client's identity.
 */
async function getAllWindowClients(): Promise<WindowClientIdentity[]> {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return clients.map((client) => ({ id: client.id, url: client.url }));
}

/**
 * Attempts to restore a release from its immutable server archive, through
 * the shared {@link PreparationCoordinator} so this never duplicates a
 * concurrent Automatic or Manual preparation of the same release id. Never
 * substitutes a different release.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param release - The exact release to restore.
 * @param coordinator - The channel's preparation coordinator.
 * @returns Whether restoration succeeded.
 */
async function restoreRelease(
  channel: ManagedChannel,
  channelBasePath: string,
  release: ReleaseRef,
  coordinator: PreparationCoordinator,
): Promise<boolean> {
  try {
    await coordinator.prepare(channel, channelBasePath, release);
    return true;
  } catch {
    return false;
  }
}

/**
 * Serves `request` from `release`'s cache, restoring it from the immutable
 * server archive first if its local cache is missing or incomplete. Never
 * falls through to a different release or to the current root deployment.
 *
 * For a non-navigation request whose path is not one of `release`'s own
 * listed files (a manifest, PWA icon, API route, or any other same-origin
 * resource this worker does not own), this never even inspects the release
 * cache: it returns `undefined` so the caller can fall through to an
 * ordinary network fetch instead of a synthetic release-cache 404.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param release - The release to serve.
 * @param request - The incoming request.
 * @param isNavigation - Whether this is a top-level navigation request.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The response to serve, or `undefined` when `request` is not owned by this release.
 */
export async function serveRelease(
  channel: ManagedChannel,
  channelBasePath: string,
  release: ReleaseRef,
  request: Request,
  isNavigation: boolean,
  coordinator: PreparationCoordinator,
): Promise<Response | undefined> {
  const cacheName = buildReleaseCacheName(channel, release.releaseId);
  let cache = await caches.open(cacheName);
  let descriptor = await readReleaseDescriptorMarker(cache);

  if (!isNavigation && descriptor) {
    const relativePath = new URL(request.url).pathname.slice(channelBasePath.length);
    if (!isReleaseFilePath(descriptor, relativePath)) return undefined;
  }

  let available = await checkReleaseAvailability(cache, release, channelBasePath);

  if (!available) {
    if (!(await restoreRelease(channel, channelBasePath, release, coordinator))) {
      return UNAVAILABLE_RESPONSE();
    }
    cache = await caches.open(cacheName);
    descriptor = await readReleaseDescriptorMarker(cache);
    available = await checkReleaseAvailability(cache, release, channelBasePath);
    if (!available) return UNAVAILABLE_RESPONSE();
    if (!isNavigation && descriptor) {
      const relativePath = new URL(request.url).pathname.slice(channelBasePath.length);
      if (!isReleaseFilePath(descriptor, relativePath)) return undefined;
    }
  }

  if (isNavigation) {
    const indexResponse = await readReleaseIndexMarker(cache);
    return indexResponse ?? UNAVAILABLE_RESPONSE();
  }

  const cached = await cache.match(request);
  return cached ?? new Response('Not found', { status: 404 });
}

/**
 * Handles a same-channel asset request (any non-navigation request): serves
 * it from whichever release is currently selected (the in-progress
 * activation's target, if any, else the active release) when the path is
 * one of that release's own files; otherwise falls through to an ordinary
 * network fetch, never a synthetic release-cache response.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param request - The incoming request.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The response to serve.
 */
export async function handleAssetFetch(
  channel: ManagedChannel,
  channelBasePath: string,
  request: Request,
  coordinator: PreparationCoordinator,
): Promise<Response> {
  const read = await readControllerState(channel);
  if (read.status !== 'valid') return fetch(request);
  const target = read.state.activation?.targetRelease ?? read.state.activeRelease;
  const served = await serveRelease(channel, channelBasePath, target, request, false, coordinator);
  return served ?? fetch(request);
}

/**
 * Handles a same-channel top-level navigation request.
 *
 * Serialized through `enqueue` (the sole clean-launch/activation
 * concurrency primitive): rolls back an expired activation once no
 * same-channel window remains, then starts a new activation when this
 * navigation qualifies as a clean launch, before resolving which release to
 * serve.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param request - The incoming navigation request.
 * @param isReloadOfControlledClient - Whether this navigation reloads an existing controlled client.
 * @param excludedClientIds - This navigation's own client ids, never counted as another live window.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The response to serve.
 */
export async function handleNavigationFetch(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  request: Request,
  isReloadOfControlledClient: boolean,
  excludedClientIds: ReadonlySet<string>,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<Response> {
  const { target, didRollback } = await enqueue(
    async (): Promise<{ target: ReleaseRef | undefined; didRollback: boolean }> => {
      const read = await readControllerState(channel);
      if (read.status !== 'valid') return { target: undefined, didRollback: false };
      let state = read.state;
      const now = new Date().toISOString();
      let rolledBackExpiredActivation = false;

      if (state.activation && isActivationExpired(state, now)) {
        const otherLiveClientCount = countSameChannelWindowClients(
          await getAllWindowClients(),
          excludedClientIds,
          channelBasePath,
          channelOrigin,
        );
        if (otherLiveClientCount === 0) {
          state = rollbackActivation(state, state.activation.targetRelease.releaseId);
          await writeControllerState(channel, state);
          rolledBackExpiredActivation = true;
        }
      }

      if (!state.activation && state.approvedRelease) {
        const otherLiveClientCount = countSameChannelWindowClients(
          await getAllWindowClients(),
          excludedClientIds,
          channelBasePath,
          channelOrigin,
        );
        if (shouldStartActivation(state, { isReloadOfControlledClient, otherLiveClientCount })) {
          const deadlineAt = new Date(Date.now() + BOOT_CONFIRMATION_TIMEOUT_MS).toISOString();
          state = startActivation(state, state.approvedRelease, deadlineAt);
          await writeControllerState(channel, state);
        }
      }

      return {
        target: state.activation?.targetRelease ?? state.activeRelease,
        didRollback: rolledBackExpiredActivation,
      };
    },
  );

  // Fire-and-forget: a crash-recovery rollback releases cache ownership of
  // the failed target, but cleanup (a full cache-storage scan) must never
  // delay this or any other navigation.
  if (didRollback) {
    void coordinator
      .runCleanup((inFlightReleaseIds) => runReleaseCacheCleanup(channel, inFlightReleaseIds))
      .catch(() => {});
  }

  // No managed state at all (e.g. an install that has not finished, or
  // failed, preparing the first managed release): there is no release
  // identity to protect yet, so fall back to an ordinary network fetch
  // instead of a hard failure — this is the one case where that is safe,
  // since no pinning guarantee is being bypassed. Once a release identity
  // is known (`target` resolved), every other unavailable path below still
  // fails closed rather than silently substituting a different release.
  if (!target) return fetch(request);
  // Navigation always resolves to a Response: `serveRelease` only ever
  // returns `undefined` for a non-owned, non-navigation asset path.
  const served = await serveRelease(channel, channelBasePath, target, request, true, coordinator);
  return served ?? UNAVAILABLE_RESPONSE();
}
