import { releaseSummariesMatch, type ManagedChannel, type ReleaseSummary } from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import { BOOT_CONFIRMATION_TIMEOUT_MS } from './bootConfirmation';
import { countSameChannelWindowClients, type WindowClientIdentity } from './cleanLaunch';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import {
  buildReleaseCacheName,
  checkReleaseAvailability,
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
 * Attempts to serve an owned asset request from `cache` using only a marker
 * read and a direct `cache.match()` — never a full-cache enumeration (see
 * {@link readMatchingDescriptorMarker}). Returns `undefined` when the exact
 * release's descriptor marker is missing or mismatched, so the caller can
 * restore and retry once. Returns a controlled `404` directly, without a
 * restore attempt, for an owned asset path the exact descriptor does not
 * list.
 * @param cache - The release's Cache Storage cache.
 * @param release - The exact release identity to serve.
 * @param request - The incoming asset request.
 * @param channelBasePath - This worker's channel base path.
 * @returns The response to serve, or `undefined` when restoration is required.
 */
async function tryServeAsset(
  cache: Cache,
  release: ReleaseSummary,
  request: Request,
  channelBasePath: string,
): Promise<Response | undefined> {
  const descriptor = await readMatchingDescriptorMarker(cache, release);
  if (!descriptor) return undefined;

  const relativePath = new URL(request.url).pathname.slice(channelBasePath.length);
  if (!isReleaseFilePath(descriptor, relativePath)) return NOT_FOUND_RESPONSE();

  return cache.match(request);
}

/**
 * Attempts to serve a document navigation from `cache`, requiring the
 * exhaustive {@link checkReleaseAvailability} — descriptor marker, archived
 * index, and every descriptor-listed file present — rather than the asset
 * path's marker-only check. Cache Storage entries may be evicted
 * individually, so a marker and index surviving alone never proves the
 * release is complete enough to activate; only this exhaustive check may
 * gate serving the archived index for navigation. Returns `undefined` when
 * the exact release is not completely available, so the caller can restore
 * and retry once.
 * @param cache - The release's Cache Storage cache.
 * @param release - The exact release identity to serve.
 * @param channelBasePath - This worker's channel base path.
 * @returns The archived index response, or `undefined` when restoration is required.
 */
async function tryServeNavigation(
  cache: Cache,
  release: ReleaseSummary,
  channelBasePath: string,
): Promise<Response | undefined> {
  const available = await checkReleaseAvailability(cache, release, channelBasePath);
  if (!available) return undefined;

  return readReleaseIndexMarker(cache);
}

/**
 * Serves `request` from `release`'s cache, restoring it from the immutable
 * server archive and retrying exactly once if its local cache is missing,
 * incomplete, or its commit marker's complete release identity does not
 * exactly match `release`. Never falls through to a different release or to
 * the live current deployment: every unavailable outcome fails closed with a
 * controlled `503` or `404`.
 *
 * Asset requests use the fast exact-match path ({@link tryServeAsset}): a
 * matching descriptor marker plus a direct `cache.match()`, never enumerating
 * the release cache's complete key set. Document navigation instead requires
 * the exhaustive {@link tryServeNavigation} check, because Cache Storage
 * entries may be evicted individually — a descriptor marker and archived
 * index surviving alone never proves every descriptor-listed asset is still
 * present, and navigation must never activate an incomplete release.
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
 * descriptor, or a controlled `503` when `release` cannot be made completely
 * available.
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

  const tryServe = (cache: Cache): Promise<Response | undefined> =>
    isNavigation
      ? tryServeNavigation(cache, release, channelBasePath)
      : tryServeAsset(cache, release, request, channelBasePath);

  let cache = await caches.open(cacheName);
  const initial = await tryServe(cache);
  if (initial) return initial;

  if (!(await restoreRelease(channel, channelBasePath, release, coordinator))) {
    return UNAVAILABLE_RESPONSE();
  }
  cache = await caches.open(cacheName);
  const revalidated = await tryServe(cache);
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

/** One resolved navigation-serving decision, prior to serving the release. */
type NavigationSelection = {
  /** The release to serve for this navigation. */
  release: ReleaseSummary;
  /** Deferred broadcast work already decided by this selection step. */
  runLifetimeWork?: (() => Promise<void>) | undefined;
  /**
   * Whether `release` is being served as the current `activating` candidate's
   * own target (freshly started this navigation, or already in progress),
   * rather than as `activeRelease`. Only these selections are eligible for
   * {@link tryRollbackActivatingFailure} below — the already-persisted
   * expired-activation rollback branch always resolves to `activeRelease`
   * and must never re-enter that fallback.
   */
  isActivatingTarget?: boolean;
};

/**
 * Handles an `activating` candidate that could not be served for this
 * navigation (see `serveRelease`'s controlled `503`). Re-reads fresh
 * persisted state through the existing {@link OperationQueue}, since the
 * restoration attempt already spent inside `serveRelease` is long-running:
 * rolls back only when fresh state still has an `activating` candidate whose
 * complete identity exactly matches `failedRelease` (see
 * {@link releaseSummariesMatch}) — a concurrent commit, prior rollback,
 * controller-state replacement, or same-number/different-metadata state is a
 * no-op here, never serving the stale previously active release. Once the
 * rollback itself is durably persisted, the rollback-broadcast work is
 * already decided and always returned, whether or not the previous
 * `activeRelease` can actually be served for this same navigation: a Cache
 * Storage or marker-read exception from that serving attempt falls back to
 * the existing controlled `503`, excluding this navigation's own client
 * identities (it already received the active response, or attempted to,
 * directly). Returns `undefined` when no rollback applies, or when
 * persisting the rollback itself fails, so the caller keeps the candidate's
 * original controlled `503` untouched.
 * @param channel - Managed channel.
 * @param channelBasePath - This worker's channel base path.
 * @param request - The incoming navigation request.
 * @param failedRelease - The exact activating-candidate release that could not be served.
 * @param coordinator - The channel's preparation coordinator.
 * @param context - Standard client identities for the current navigation.
 * @param dependencies - Worker origin, queue, and controlled+uncontrolled client enumeration.
 * @returns The rollback fallback result, or `undefined` when no rollback applies.
 */
async function tryRollbackActivatingFailure(
  channel: ManagedChannel,
  channelBasePath: string,
  request: Request,
  failedRelease: ReleaseSummary,
  coordinator: PreparationCoordinator,
  context: NavigationFetchContext,
  dependencies: NavigationFetchDependencies,
): Promise<NavigationFetchResult | undefined> {
  const previousActiveRelease = await withState(channel, dependencies.enqueue, async (state) => {
    if (
      state.candidate?.phase !== 'activating' ||
      !releaseSummariesMatch(state.candidate.release, failedRelease)
    ) {
      return undefined;
    }
    const rolledBack = rollbackActivation(state, failedRelease.releaseNumber);
    await writeControllerState(channel, rolledBack);
    return rolledBack.activeRelease;
  }).catch(() => undefined);

  if (!previousActiveRelease) return undefined;

  const excludedClientIds = new Set(
    [context.clientId, context.resultingClientId].filter((id) => id.length > 0),
  );
  const runLifetimeWork = () =>
    broadcastRollback(
      channelBasePath,
      dependencies.channelOrigin,
      failedRelease.releaseNumber,
      excludedClientIds,
    ).catch(() => {});

  const response = await serveRelease(
    channel,
    channelBasePath,
    previousActiveRelease,
    request,
    true,
    coordinator,
  ).catch(() => UNAVAILABLE_RESPONSE());

  return { response, runLifetimeWork };
}

/**
 * Handles an owned same-channel top-level navigation request (ownership
 * already decided by the caller). Navigation may start a clean-launch
 * activation or recover an expired activation before serving its archived
 * index. Navigation and assets use the activating candidate's target while
 * activation is in progress; all other candidate phases use `activeRelease`.
 * Absent or invalid persisted state, or an unavailable exact release,
 * returns a controlled `503`. Never falls through to a live network fetch.
 *
 * When the current `activating` candidate's own target cannot be served —
 * whether already in progress or just started by this same navigation — a
 * single durable rollback attempt (see {@link tryRollbackActivatingFailure})
 * serves the previous `activeRelease` in this same navigation instead,
 * discarding any "activation started" broadcast this navigation may have
 * just queued: only the final durable rollback broadcast is relevant once
 * that candidate's own serving has failed.
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

    const selection = await withState<NavigationSelection>(
      channel,
      dependencies.enqueue,
      async (state) => {
        const now = new Date().toISOString();
        if (state.candidate?.phase === 'activating') {
          if (!isActivationExpired(state, now)) {
            return { release: state.candidate.release, isActivatingTarget: true };
          }

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
            isActivatingTarget: true,
          };
        }

        return { release: state.activeRelease };
      },
    );

    // A thrown Cache Storage error while serving the activating candidate's
    // own target must enter the same durable rollback path as a controlled
    // 503: `response` stays undefined for that case rather than letting the
    // throw escape to this function's own outer catch, which would silently
    // skip rollback and return an uncorrelated unavailable response instead.
    let response: Response | undefined;
    try {
      response = await serveRelease(
        channel,
        channelBasePath,
        selection.release,
        request,
        true,
        coordinator,
      );
    } catch {
      // Swallowed here; handled uniformly below via `response === undefined`.
    }

    if (selection.isActivatingTarget && (response === undefined || response.status === 503)) {
      const fallback = await tryRollbackActivatingFailure(
        channel,
        channelBasePath,
        request,
        selection.release,
        coordinator,
        context,
        dependencies,
      );
      if (fallback) return fallback;
      return { response: response ?? UNAVAILABLE_RESPONSE() };
    }

    if (response === undefined) return { response: UNAVAILABLE_RESPONSE() };

    return { response, runLifetimeWork: selection.runLifetimeWork };
  } catch {
    return { response: UNAVAILABLE_RESPONSE() };
  }
}
