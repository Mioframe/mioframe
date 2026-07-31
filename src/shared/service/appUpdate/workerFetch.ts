/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import type { ManagedChannel, ReleaseSummary } from './contracts';
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
} from './releaseCache';
import {
  isActivationExpired,
  rollbackActivation,
  shouldStartActivation,
  startActivation,
} from './stateTransitions';
import { broadcastRollback } from './workerBroadcast';

const UNAVAILABLE_RESPONSE = () => new Response('Release unavailable', { status: 503 });

/**
 * Returns whether `request` falls under this worker's owned release-asset
 * namespace, `<channelBasePath>assets/**`, purely from its URL path.
 *
 * Ownership must be decidable without ever reading a release descriptor: an
 * `invalid` persisted controller state has no trustworthy release identity
 * to look one up from, yet an owned asset path must still fail closed
 * (never fall through to the live deployment) while every other same-origin
 * path (manifest, PWA icons, APIs, fonts, `updates/**`) remains an ordinary
 * network concern.
 * @param request - The incoming request.
 * @param channelBasePath - This worker's channel base path.
 * @returns Whether `request` is one of this worker's owned release assets.
 */
function isManagedAssetRequest(request: Request, channelBasePath: string): boolean {
  const relativePath = new URL(request.url).pathname.slice(channelBasePath.length);
  return relativePath.startsWith('assets/');
}

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
 * concurrent Automatic or Manual preparation of the same release number.
 * Never substitutes a different release.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param release - The exact release to restore.
 * @param coordinator - The channel's preparation coordinator.
 * @returns Whether restoration succeeded.
 */
async function restoreRelease(
  channel: ManagedChannel,
  channelBasePath: string,
  release: ReleaseSummary,
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
  release: ReleaseSummary,
  request: Request,
  isNavigation: boolean,
  coordinator: PreparationCoordinator,
): Promise<Response | undefined> {
  const cacheName = buildReleaseCacheName(channel, release.releaseNumber);
  let cache = await caches.open(cacheName);
  let descriptor = await readReleaseDescriptorMarker(cache);

  if (!isNavigation && descriptor) {
    const relativePath = new URL(request.url).pathname.slice(channelBasePath.length);
    if (!isReleaseFilePath(descriptor, relativePath)) return undefined;
  }

  let available = await checkReleaseAvailability(cache, release.releaseNumber, channelBasePath);

  if (!available) {
    if (!(await restoreRelease(channel, channelBasePath, release, coordinator))) {
      return UNAVAILABLE_RESPONSE();
    }
    cache = await caches.open(cacheName);
    descriptor = await readReleaseDescriptorMarker(cache);
    available = await checkReleaseAvailability(cache, release.releaseNumber, channelBasePath);
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
 * Resolves the release currently selected to serve: the in-progress
 * activation's target only while the candidate is `activating`, otherwise
 * the active release.
 * @param state - Current controller state.
 * @returns The selected release.
 */
function resolveSelectedRelease(state: {
  activeRelease: ReleaseSummary;
  candidate?: { phase: string; release: ReleaseSummary } | undefined;
}): ReleaseSummary {
  return state.candidate?.phase === 'activating' ? state.candidate.release : state.activeRelease;
}

/**
 * Handles a same-channel asset request (any non-navigation request): serves
 * it from whichever release is currently selected (the in-progress
 * activation's target, if any, else the active release) when the path is
 * one of that release's own files; otherwise falls through to an ordinary
 * network fetch, never a synthetic release-cache response.
 *
 * Preserves the distinction {@link readControllerState} returns: `absent`
 * (no managed state yet, e.g. before the first install completes) always
 * allows the ordinary network bootstrap path, while `invalid` (a corrupted
 * persisted record) must never substitute the live deployment for one of
 * this worker's owned release assets — it fails closed with the controlled
 * unavailable response instead, decided by {@link isManagedAssetRequest}
 * rather than by reading a release descriptor that an invalid state cannot
 * trustworthily provide. A non-asset path (manifest, PWA icon, API route,
 * font, or anything else outside `assets/**`) remains an ordinary network
 * concern even when state is invalid.
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
  if (read.status === 'absent') return fetch(request);
  if (read.status === 'invalid') {
    return isManagedAssetRequest(request, channelBasePath)
      ? UNAVAILABLE_RESPONSE()
      : fetch(request);
  }
  const target = resolveSelectedRelease(read.state);
  const served = await serveRelease(channel, channelBasePath, target, request, false, coordinator);
  return served ?? fetch(request);
}

/** Result of the locked navigation decision in {@link handleNavigationFetch}. */
type NavigationDecision = {
  /** The release to serve, or `undefined` when there is no managed state yet (`absent`). */
  target: ReleaseSummary | undefined;
  /** Whether persisted controller state was `invalid`: must fail closed, never fall through to network. */
  invalid: boolean;
  /** The release number rolled back to `failed` by this navigation's expired-activation recovery, if any. */
  rolledBackReleaseNumber: number | undefined;
};

/**
 * Handles a same-channel top-level navigation request.
 *
 * Serialized through `enqueue` (the sole clean-launch/activation
 * concurrency primitive): rolls back an expired activation once no
 * same-channel window remains, then starts a new activation when this
 * navigation qualifies as a clean launch, before resolving which release to
 * serve.
 *
 * Preserves the distinction {@link readControllerState} returns: `absent`
 * always allows the ordinary network bootstrap path (first install has not
 * completed yet, so there is no release identity to protect), while
 * `invalid` fails closed with the controlled unavailable response — a
 * corrupted persisted record must never substitute the live deployment for
 * a pinned release.
 *
 * An expired-activation rollback never reloads this navigation itself: it
 * already receives the unchanged active release directly as its own
 * response. The rollback broadcast (to every *other* same-channel window)
 * is returned as `runLifetimeWork`, never started as untracked background
 * work — the caller (`src/sw.ts`) tracks it under this fetch event's own
 * `waitUntil()`. No cache cleanup is required for this transition
 * (`activating` → `failed` does not shrink cache ownership).
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param channelOrigin - This worker's own origin.
 * @param request - The incoming navigation request.
 * @param excludedClientIds - This navigation's own client ids, never counted as another live window and never reached by its own rollback broadcast.
 * @param enqueue - The channel's serialized operation queue.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The response to serve, plus optional rollback-broadcast follow-up work.
 */
export async function handleNavigationFetch(
  channel: ManagedChannel,
  channelBasePath: string,
  channelOrigin: string,
  request: Request,
  excludedClientIds: ReadonlySet<string>,
  enqueue: OperationQueue,
  coordinator: PreparationCoordinator,
): Promise<{ response: Response; runLifetimeWork?: (() => Promise<void>) | undefined }> {
  const { target, invalid, rolledBackReleaseNumber } = await enqueue(
    async (): Promise<NavigationDecision> => {
      const read = await readControllerState(channel);
      if (read.status === 'absent') {
        return { target: undefined, invalid: false, rolledBackReleaseNumber: undefined };
      }
      if (read.status === 'invalid') {
        return { target: undefined, invalid: true, rolledBackReleaseNumber: undefined };
      }

      let state = read.state;
      const now = new Date().toISOString();
      let rolledBack: number | undefined;

      if (state.candidate?.phase === 'activating' && isActivationExpired(state, now)) {
        const otherLiveClientCount = countSameChannelWindowClients(
          await getAllWindowClients(),
          excludedClientIds,
          channelBasePath,
          channelOrigin,
        );
        if (otherLiveClientCount === 0) {
          const failedReleaseNumber = state.candidate.release.releaseNumber;
          state = rollbackActivation(state, failedReleaseNumber);
          await writeControllerState(channel, state);
          rolledBack = failedReleaseNumber;
        }
      }

      if (state.candidate?.phase === 'ready') {
        const otherLiveClientCount = countSameChannelWindowClients(
          await getAllWindowClients(),
          excludedClientIds,
          channelBasePath,
          channelOrigin,
        );
        if (shouldStartActivation(state, { otherLiveClientCount })) {
          const deadlineAt = new Date(Date.now() + BOOT_CONFIRMATION_TIMEOUT_MS).toISOString();
          state = startActivation(state, deadlineAt);
          await writeControllerState(channel, state);
        }
      }

      return {
        target: resolveSelectedRelease(state),
        invalid: false,
        rolledBackReleaseNumber: rolledBack,
      };
    },
  );

  const runLifetimeWork =
    rolledBackReleaseNumber !== undefined
      ? () =>
          broadcastRollback(
            channelBasePath,
            channelOrigin,
            rolledBackReleaseNumber,
            excludedClientIds,
          )
      : undefined;

  // A corrupted persisted record: unlike `absent`, a release identity was
  // once known here and cannot be trusted anymore. Never substitutes the
  // live deployment for it — fails closed instead, without even calling
  // `fetch`.
  if (invalid) return { response: UNAVAILABLE_RESPONSE(), runLifetimeWork };

  // No managed state at all (e.g. an install that has not finished, or
  // failed, preparing the first managed release): there is no release
  // identity to protect yet, so fall back to an ordinary network fetch
  // instead of a hard failure — this is the one case where that is safe,
  // since no pinning guarantee is being bypassed. Once a release identity
  // is known (`target` resolved), every other unavailable path below still
  // fails closed rather than silently substituting a different release.
  if (!target) return { response: await fetch(request), runLifetimeWork };
  // Navigation always resolves to a Response: `serveRelease` only ever
  // returns `undefined` for a non-owned, non-navigation asset path.
  const served = await serveRelease(channel, channelBasePath, target, request, true, coordinator);
  return { response: served ?? UNAVAILABLE_RESPONSE(), runLifetimeWork };
}
