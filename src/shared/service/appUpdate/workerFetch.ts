/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import type { ManagedChannel, ReleaseRef } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import { BOOT_CONFIRMATION_TIMEOUT_MS } from './bootConfirmation';
import { countSameChannelWindowClients } from './cleanLaunch';
import type { OperationQueue } from './operationQueue';
import {
  buildReleaseCacheNames,
  checkReleaseAvailability,
  readReleaseIndexMarker,
} from './releaseCache';
import { fetchReleaseDescriptor, prepareRelease } from './releasePreparation';
import {
  isActivationExpired,
  rollbackActivation,
  shouldStartActivation,
  startActivation,
} from './stateTransitions';

const UNAVAILABLE_RESPONSE = () => new Response('Release unavailable', { status: 503 });

async function getAllWindowClientUrls(): Promise<string[]> {
  const clients = await self.clients.matchAll({ type: 'window' });
  return clients.map((client) => client.url);
}

/**
 * Attempts to restore a release from its immutable server archive by
 * re-fetching and re-preparing it. Never substitutes a different release.
 * @param channelBasePath - This worker's channel base path.
 * @param channel - Managed channel.
 * @param release - The exact release to restore.
 * @returns Whether restoration succeeded.
 */
async function restoreRelease(
  channelBasePath: string,
  channel: ManagedChannel,
  release: ReleaseRef,
): Promise<boolean> {
  try {
    const descriptor = await fetchReleaseDescriptor(channelBasePath, release);
    await prepareRelease(channelBasePath, channel, descriptor);
    return true;
  } catch {
    return false;
  }
}

/**
 * Serves `request` from `release`'s final cache, restoring it from the
 * immutable server archive first if its local cache is missing or
 * incomplete. Never falls through to a different release or to the current
 * root deployment.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param release - The release to serve.
 * @param request - The incoming request.
 * @param isNavigation - Whether this is a top-level navigation request.
 * @returns The response to serve.
 */
export async function serveRelease(
  channel: ManagedChannel,
  channelBasePath: string,
  release: ReleaseRef,
  request: Request,
  isNavigation: boolean,
): Promise<Response> {
  const { final } = buildReleaseCacheNames(channel, release.releaseId);
  let finalCache = await caches.open(final);
  let available = await checkReleaseAvailability(finalCache, release, channelBasePath);

  if (!available) {
    if (!(await restoreRelease(channelBasePath, channel, release))) return UNAVAILABLE_RESPONSE();
    finalCache = await caches.open(final);
    available = await checkReleaseAvailability(finalCache, release, channelBasePath);
    if (!available) return UNAVAILABLE_RESPONSE();
  }

  if (isNavigation) {
    const indexResponse = await readReleaseIndexMarker(finalCache);
    return indexResponse ?? UNAVAILABLE_RESPONSE();
  }

  const cached = await finalCache.match(request);
  return cached ?? new Response('Not found', { status: 404 });
}

/**
 * Handles a same-channel asset request (any non-navigation request): serves
 * it from whichever release is currently selected (the in-progress
 * activation's target, if any, else the active release).
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param request - The incoming request.
 * @returns The response to serve.
 */
export async function handleAssetFetch(
  channel: ManagedChannel,
  channelBasePath: string,
  request: Request,
): Promise<Response> {
  const read = await readControllerState(channel);
  if (read.status !== 'valid') return UNAVAILABLE_RESPONSE();
  const target = read.state.activation?.targetRelease ?? read.state.activeRelease;
  return serveRelease(channel, channelBasePath, target, request, false);
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
 * @param request - The incoming navigation request.
 * @param isReloadOfControlledClient - Whether this navigation reloads an existing controlled client.
 * @param enqueue - The channel's serialized operation queue.
 * @returns The response to serve.
 */
export async function handleNavigationFetch(
  channel: ManagedChannel,
  channelBasePath: string,
  request: Request,
  isReloadOfControlledClient: boolean,
  enqueue: OperationQueue,
): Promise<Response> {
  const target = await enqueue(async (): Promise<ReleaseRef | undefined> => {
    const read = await readControllerState(channel);
    if (read.status !== 'valid') return undefined;
    let state = read.state;
    const now = new Date().toISOString();

    if (state.activation && isActivationExpired(state, now)) {
      const otherLiveClientCount = countSameChannelWindowClients(
        await getAllWindowClientUrls(),
        channelBasePath,
      );
      if (otherLiveClientCount === 0) {
        state = rollbackActivation(state, state.activation.targetRelease.releaseId);
        await writeControllerState(channel, state);
      }
    }

    if (!state.activation && state.approvedRelease) {
      const otherLiveClientCount = countSameChannelWindowClients(
        await getAllWindowClientUrls(),
        channelBasePath,
      );
      if (shouldStartActivation(state, { isReloadOfControlledClient, otherLiveClientCount })) {
        const deadlineAt = new Date(Date.now() + BOOT_CONFIRMATION_TIMEOUT_MS).toISOString();
        state = startActivation(state, state.approvedRelease, now, deadlineAt);
        await writeControllerState(channel, state);
      }
    }

    return state.activation?.targetRelease ?? state.activeRelease;
  });

  if (!target) return UNAVAILABLE_RESPONSE();
  return serveRelease(channel, channelBasePath, target, request, true);
}
