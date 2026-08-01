import type { ManagedChannel, ReleaseSummary } from './contracts';
import { readControllerState } from './controllerState';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  buildReleaseCacheName,
  checkReleaseAvailability,
  isReleaseFilePath,
  readReleaseDescriptorMarker,
  readReleaseIndexMarker,
} from './releaseCache';

const UNAVAILABLE_RESPONSE = () => new Response('Release unavailable', { status: 503 });
const NOT_FOUND_RESPONSE = () => new Response('Not found', { status: 404 });

/**
 * Attempts to restore a release from its immutable server archive, through
 * the shared {@link PreparationCoordinator} so this never duplicates a
 * concurrent preparation of the same release number. Never substitutes a
 * different release: the coordinator rejects a fetched descriptor whose
 * complete identity does not exactly match `release`.
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
 * server archive first if its local cache is missing, incomplete, or its
 * commit marker's complete release identity does not exactly match
 * `release` (see {@link checkReleaseAvailability}). Never falls through to a
 * different release or to the live current deployment: every unavailable
 * outcome fails closed with a controlled `503` or `404`.
 *
 * Stage 3 owns only `release` (always the persisted `activeRelease` —
 * candidate phases are never selected here); Stage 5 will extend selection
 * to an in-progress activation's target.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param release - The release to serve.
 * @param request - The incoming request.
 * @param isNavigation - Whether this is a top-level navigation request.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The response to serve: the archived index for navigation, the
 * cached asset or a controlled `404` for an owned asset request, or a
 * controlled `503` when `release` cannot be made available.
 */
export async function serveRelease(
  channel: ManagedChannel,
  channelBasePath: string,
  release: ReleaseSummary,
  request: Request,
  isNavigation: boolean,
  coordinator: PreparationCoordinator,
): Promise<Response> {
  const cacheName = buildReleaseCacheName(channel, release.releaseNumber);
  let cache = await caches.open(cacheName);
  let available = await checkReleaseAvailability(cache, release, channelBasePath);

  if (!available) {
    if (!(await restoreRelease(channel, channelBasePath, release, coordinator))) {
      return UNAVAILABLE_RESPONSE();
    }
    cache = await caches.open(cacheName);
    available = await checkReleaseAvailability(cache, release, channelBasePath);
    if (!available) return UNAVAILABLE_RESPONSE();
  }

  if (isNavigation) {
    const indexResponse = await readReleaseIndexMarker(cache);
    return indexResponse ?? UNAVAILABLE_RESPONSE();
  }

  const relativePath = new URL(request.url).pathname.slice(channelBasePath.length);
  const descriptor = await readReleaseDescriptorMarker(cache);
  if (!descriptor || !isReleaseFilePath(descriptor, relativePath)) return NOT_FOUND_RESPONSE();

  const cached = await cache.match(request);
  return cached ?? NOT_FOUND_RESPONSE();
}

/**
 * Handles an owned same-channel `<channelBasePath>assets/**` request (the
 * caller, `src/sw.ts`, has already decided ownership purely from the
 * request's URL — this never inspects the path itself to decide whether to
 * fall through to the network, since Stage 3 owns every request it is
 * called for). Serves the currently active release only: absent or invalid
 * persisted state, or an unavailable exact release, returns a controlled
 * `503`; a path not listed by the active release's own descriptor returns a
 * controlled `404`. Never falls through to a live network fetch.
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
  if (read.status !== 'valid') return UNAVAILABLE_RESPONSE();
  return serveRelease(
    channel,
    channelBasePath,
    read.state.activeRelease,
    request,
    false,
    coordinator,
  );
}

/**
 * Handles an owned same-channel top-level navigation request (ownership
 * already decided by the caller). Serves the currently active release's
 * archived index only: absent or invalid persisted state, or an unavailable
 * exact release, returns a controlled `503`. Never falls through to a live
 * network fetch.
 *
 * Stage 3 performs no clean-launch, activation, rollback, or discovery work
 * here: it neither reads nor mutates the candidate, and triggers no
 * background reconciliation. Those are later-stage responsibilities.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param request - The incoming navigation request.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The response to serve.
 */
export async function handleNavigationFetch(
  channel: ManagedChannel,
  channelBasePath: string,
  request: Request,
  coordinator: PreparationCoordinator,
): Promise<Response> {
  const read = await readControllerState(channel);
  if (read.status !== 'valid') return UNAVAILABLE_RESPONSE();
  return serveRelease(
    channel,
    channelBasePath,
    read.state.activeRelease,
    request,
    true,
    coordinator,
  );
}
