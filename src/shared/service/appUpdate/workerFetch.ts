import type { ManagedChannel, ReleaseSummary } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import { BOOT_CONFIRMATION_TIMEOUT_MS } from './bootConfirmation';
import { countSameChannelWindowClients, type WindowClientIdentity } from './cleanLaunch';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  buildReleaseCacheName,
  isReleaseFilePath,
  readMatchingDescriptorMarker,
  readReleaseIndexMarker,
} from './releaseCache';
import { withState } from './stateLock';
import {
  isActivationExpired,
  rollbackActivation,
  shouldStartActivation,
  startActivation,
} from './stateTransitions';
import { broadcastRollback, broadcastStateChanged } from './workerBroadcast';

const UNAVAILABLE_RESPONSE = () => new Response('Release unavailable', { status: 503 });
const NOT_FOUND_RESPONSE = () => new Response('Not found', { status: 404 });

/** Standard client identities belonging to the navigation being evaluated. */
export type NavigationFetchContext = {
  /** The FetchEvent's current client identity, when present. */
  clientId: string;
  /** The FetchEvent's resulting client identity, when present. */
  resultingClientId: string;
};

/** Worker-owned dependencies needed to decide a navigation activation. */
export type NavigationFetchDependencies = {
  /** This worker's channel origin. */
  channelOrigin: string;
  /** The shared short-operation queue. */
  enqueue: OperationQueue;
  /** Enumerates controlled and uncontrolled window clients. */
  matchWindowClients: () => Promise<readonly WindowClientIdentity[]>;
};

/** Navigation response plus optional event-lifetime follow-up work. */
export type NavigationFetchResult = {
  /** The response delivered to the navigation. */
  response: Response;
  /** Deferred broadcast work, invoked only after response resolution. */
  runLifetimeWork?: (() => Promise<void>) | undefined;
};

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
 * Attempts to serve `request` from `cache` using only marker reads and a
 * direct `cache.match()` — never a full-cache enumeration (see
 * {@link readMatchingDescriptorMarker}). Returns `undefined` when the exact
 * release is not currently available from `cache` (missing or mismatched
 * descriptor marker, missing archived index for navigation, or a listed
 * asset missing from cache), so the caller can restore and retry once.
 * Returns a controlled `404` directly, without a restore attempt, for an
 * owned asset path the exact descriptor does not list.
 * @param cache - The release's Cache Storage cache.
 * @param release - The exact release identity to serve.
 * @param request - The incoming request.
 * @param channelBasePath - This worker's channel base path.
 * @param isNavigation - Whether this is a top-level navigation request.
 * @returns The response to serve, or `undefined` when restoration is required.
 */
async function tryServeFromCache(
  cache: Cache,
  release: ReleaseSummary,
  request: Request,
  channelBasePath: string,
  isNavigation: boolean,
): Promise<Response | undefined> {
  const descriptor = await readMatchingDescriptorMarker(cache, release);
  if (!descriptor) return undefined;

  if (isNavigation) {
    return readReleaseIndexMarker(cache);
  }

  const relativePath = new URL(request.url).pathname.slice(channelBasePath.length);
  if (!isReleaseFilePath(descriptor, relativePath)) return NOT_FOUND_RESPONSE();

  return cache.match(request);
}

/**
 * Serves `request` from `release`'s cache, restoring it from the immutable
 * server archive and retrying exactly once if its local cache is missing,
 * incomplete, or its commit marker's complete release identity does not
 * exactly match `release` (see {@link tryServeFromCache}). Never falls
 * through to a different release or to the live current deployment: every
 * unavailable outcome fails closed with a controlled `503` or `404`.
 *
 * The healthy path — a matching descriptor marker already present, plus the
 * archived index or the specific requested asset already cached — never
 * enumerates the release cache's complete key set; only the deliberately
 * exhaustive validation in `prepareRelease()` does that.
 *
 * Navigation and asset fetch owners select an activating candidate's target
 * here. Every other candidate phase uses the persisted `activeRelease`.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param release - The release to serve.
 * @param request - The incoming request.
 * @param isNavigation - Whether this is a top-level navigation request.
 * @param coordinator - The channel's preparation coordinator.
 * @returns The response to serve: the archived index for navigation, the
 * cached asset, a controlled `404` when an owned asset is not listed by the
 * descriptor, or a controlled `503` when `release` cannot be made available.
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
  const initial = await tryServeFromCache(cache, release, request, channelBasePath, isNavigation);
  if (initial) return initial;

  if (!(await restoreRelease(channel, channelBasePath, release, coordinator))) {
    return UNAVAILABLE_RESPONSE();
  }
  cache = await caches.open(cacheName);
  const revalidated = await tryServeFromCache(
    cache,
    release,
    request,
    channelBasePath,
    isNavigation,
  );
  return revalidated ?? UNAVAILABLE_RESPONSE();
}

/**
 * Handles an owned same-channel `<channelBasePath>assets/**` request (the
 * caller, `src/sw.ts`, has already decided ownership purely from the
 * request's URL — this never inspects the path itself to decide whether to
 * fall through to the network. Navigation and assets serve the activating
 * candidate while it is activating; every other candidate phase serves the
 * current `activeRelease`. Absent or invalid persisted state, or an
 * unavailable exact release, returns a controlled `503`; a path not listed
 * by the selected release's descriptor returns a controlled `404`. Never
 * falls through to a live network fetch.
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
  try {
    const read = await readControllerState(channel);
    if (read.status !== 'valid') return UNAVAILABLE_RESPONSE();
    const release =
      read.state.candidate?.phase === 'activating'
        ? read.state.candidate.release
        : read.state.activeRelease;
    return await serveRelease(channel, channelBasePath, release, request, false, coordinator);
  } catch {
    return UNAVAILABLE_RESPONSE();
  }
}

/**
 * Handles an owned same-channel top-level navigation request (ownership
 * already decided by the caller). Navigation may start a clean-launch
 * activation or recover an expired activation before serving its archived
 * index. Navigation and assets use the activating candidate's target while
 * activation is in progress; all other candidate phases use `activeRelease`.
 * Absent or invalid persisted state, or an unavailable exact release,
 * returns a controlled `503`. Never falls through to a live network fetch.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param request - The incoming navigation request.
 * @param coordinator - The channel's preparation coordinator.
 * @param context - Standard client identities for the current navigation.
 * @param dependencies - Worker origin, queue, and controlled+uncontrolled client enumeration.
 * @returns The response to serve.
 */
export async function handleNavigationFetch(
  channel: ManagedChannel,
  channelBasePath: string,
  request: Request,
  coordinator: PreparationCoordinator,
  context: NavigationFetchContext,
  dependencies: NavigationFetchDependencies,
): Promise<NavigationFetchResult> {
  try {
    const initial = await readControllerState(channel);
    if (initial.status !== 'valid') return { response: UNAVAILABLE_RESPONSE() };

    let otherLiveClientCount: number | undefined;
    if (initial.state.candidate?.phase === 'ready') {
      const clients = await dependencies.matchWindowClients();
      const excludedClientIds = new Set(
        [context.clientId, context.resultingClientId].filter((id) => id.length > 0),
      );
      otherLiveClientCount = countSameChannelWindowClients(
        clients,
        excludedClientIds,
        channelBasePath,
        dependencies.channelOrigin,
      );
    }

    const selection = await withState(channel, dependencies.enqueue, async (state) => {
      const now = new Date().toISOString();
      if (state.candidate?.phase === 'activating') {
        if (!isActivationExpired(state, now)) return { release: state.candidate.release };

        const failedReleaseNumber = state.candidate.release.releaseNumber;
        const rolledBack = rollbackActivation(state, failedReleaseNumber);
        await writeControllerState(channel, rolledBack);
        const excludedClientIds = new Set(
          [context.clientId, context.resultingClientId].filter((id) => id.length > 0),
        );
        return {
          release: rolledBack.activeRelease,
          runLifetimeWork: () =>
            broadcastRollback(
              channelBasePath,
              dependencies.channelOrigin,
              failedReleaseNumber,
              excludedClientIds,
            ).catch(() => {}),
        };
      }

      if (
        otherLiveClientCount !== undefined &&
        shouldStartActivation(state, { otherLiveClientCount })
      ) {
        const deadlineAt = new Date(Date.now() + BOOT_CONFIRMATION_TIMEOUT_MS).toISOString();
        const activating = startActivation(state, deadlineAt);
        await writeControllerState(channel, activating);
        if (activating.candidate?.phase !== 'activating') return { release: state.activeRelease };
        return {
          release: activating.candidate.release,
          runLifetimeWork: () =>
            broadcastStateChanged(channelBasePath, dependencies.channelOrigin).catch(() => {}),
        };
      }

      return { release: state.activeRelease };
    });

    const response = await serveRelease(
      channel,
      channelBasePath,
      selection.release,
      request,
      true,
      coordinator,
    );
    return { response, runLifetimeWork: selection.runLifetimeWork };
  } catch {
    return { response: UNAVAILABLE_RESPONSE() };
  }
}
