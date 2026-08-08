/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

/**
 * Managed pinned-update controller worker for the stable and develop
 * channels (see the managed pinned application updates feature).
 *
 * This worker owns application-release pinning only: persisted update
 * state, release discovery, immutable release preparation, selected-release
 * navigation, clean-launch activation, boot commit, rollback, and local
 * release-cache cleanup. It never manages its own code's lifecycle —
 * install/waiting/activate for this worker script itself is the browser's
 * ordinary Service Worker lifecycle, untouched here (no `skipWaiting()`, no
 * `clients.claim()`). It must never identify itself as, or embed, a
 * particular application release — only its own channel (derived at runtime
 * from its registration scope, not build-embedded).
 *
 * Stage 3 bootstrap and active-release serving, Stage 4 reconciliation and
 * preparation, and Stage 5 activation and rollback are wired.
 */

// Named imports only — never `import * as`. A namespace import forces rollup
// to keep every `@sentry/browser` export reachable (tracing, replay,
// profiling, feedback, and every other integration this worker never uses),
// defeating tree-shaking for the whole package.
import {
  addBreadcrumb as sentryAddBreadcrumb,
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  flush as sentryFlush,
  init as sentryInit,
  setUser as sentrySetUser,
} from '@sentry/browser';
import { SENTRY_DSN, APP_BUILD_ID, APP_VERSION, IS_VERBOSE_DIAGNOSTICS } from './shared/config';
import {
  applyDiagnosticsRuntimeState,
  captureDiagnosticException,
  drainDiagnostics,
  getOrCreateSentrySessionId,
  registerSentryBackend,
  registerSentryConfig,
  zodDiagnosticsPolicySyncMessage,
} from './shared/lib/diagnostics';
import {
  isSameChannelPath,
  isSameChannelWindowClient,
} from './shared/service/appUpdate/cleanLaunch';
import { isControllerStateWriteError } from './shared/service/appUpdate/controllerState';
import { createOperationQueue } from './shared/service/appUpdate/operationQueue';
import { readPersistedDiagnosticsPolicy } from './shared/service/diagnostics/readPersistedDiagnosticsPolicy';
import { createPreparationCoordinator } from './shared/service/appUpdate/preparationCoordinator';
import {
  withProtocolVersion,
  zodAppUpdateWorkerRequest,
  zodManagedControllerProbeRequest,
} from './shared/service/appUpdate/protocol';
import { isReleasePreparationError } from './shared/service/appUpdate/releasePreparation';
import {
  buildManagedChannelBasePath,
  deriveManagedChannel,
  deriveManagedChannelOrigin,
} from './shared/service/appUpdate/workerChannel';
import { cleanupReleaseCache } from './shared/service/appUpdate/workerBroadcast';
import { handleAssetFetch, handleNavigationFetch } from './shared/service/appUpdate/workerFetch';
import { runInstall } from './shared/service/appUpdate/workerInstall';
import { handleWorkerMessage } from './shared/service/appUpdate/workerMessages';
import {
  runReconciliationEffects,
  runUpdateReconciliationPass,
} from './shared/service/appUpdate/updateDiscovery';
import {
  createUpdateReconciler,
  ReconciliationFailure,
} from './shared/service/appUpdate/updateReconciliation';

// Diagnostics bootstrap: independent of Vue application boot and of the
// update-controller state below. Registers the same static Sentry
// configuration the main thread uses, backed by a statically bundled
// `@sentry/browser` module (never `@sentry/vue`'s lazy dynamic import, which
// this classic-script build must never contain). Reporting starts `unknown`
// (diagnostic events/exceptions queue in memory — see reportDiagnosticEvent.ts
// and captureDiagnosticException.ts) until the persisted local-settings
// consent record is read and applied; a read failure, missing record, or
// invalid record all resolve to `unknown` and never enable reporting. This
// worker uses its own in-memory, session-scoped Sentry id — never persisted.
registerSentryBackend(() =>
  Promise.resolve({
    init: sentryInit,
    captureException: sentryCaptureException,
    captureMessage: sentryCaptureMessage,
    setUser: sentrySetUser,
    addBreadcrumb: sentryAddBreadcrumb,
    flush: sentryFlush,
  }),
);
registerSentryConfig({
  ...(SENTRY_DSN !== undefined && { dsn: SENTRY_DSN }),
  isVerbose: IS_VERBOSE_DIAGNOSTICS,
  enabled: import.meta.env.PROD,
  release: APP_BUILD_ID || APP_VERSION,
});
/**
 * Small bounded opportunity {@link waitForDiagnosticsBootstrap} gives the
 * startup persisted-policy read to finish before a diagnostics drain. Short
 * enough that a stuck/slow read can never meaningfully delay `install`
 * beyond this fixed bound, matching {@link DIAGNOSTICS_DRAIN_TIMEOUT_MS}'s
 * order of magnitude for a different bounded operation (an IndexedDB read,
 * not an HTTP flush).
 */
const DIAGNOSTICS_BOOTSTRAP_TIMEOUT_MS = 1000;

// Set once a live `DIAGNOSTICS_POLICY_SYNC` message has been applied, so the
// startup bootstrap read below — which can still be in flight when that
// happens — never overwrites it with its own now-stale result.
let liveDiagnosticsSyncApplied = false;

const diagnosticsBootstrap: Promise<void> = readPersistedDiagnosticsPolicy()
  .then((reportingState) => {
    if (liveDiagnosticsSyncApplied) return;
    return applyDiagnosticsRuntimeState({
      sessionId: getOrCreateSentrySessionId(),
      reportingState,
    });
  })
  .catch(() => {
    // Diagnostics bootstrap must never affect managed-update worker startup.
  });

/**
 * Gives {@link diagnosticsBootstrap} a small bounded opportunity to finish
 * before a diagnostics drain, so diagnostics queued before consent resolves
 * (e.g. from `install`, this worker's largest diagnostics source — see
 * below) can still be delivered once it does. Never rejects, and never holds
 * an event lifetime beyond {@link DIAGNOSTICS_BOOTSTRAP_TIMEOUT_MS} even if
 * the persisted-policy read hangs.
 * @returns A promise that always resolves, once the bootstrap settles or the bound elapses.
 */
function waitForDiagnosticsBootstrap(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, DIAGNOSTICS_BOOTSTRAP_TIMEOUT_MS);
    diagnosticsBootstrap.then(finish, finish);
  });
}

const channel = deriveManagedChannel(self.registration.scope);
const channelBasePath = buildManagedChannelBasePath(channel);
const channelOrigin = deriveManagedChannelOrigin(self.registration.scope);
const enqueue = createOperationQueue();
const preparationCoordinator = createPreparationCoordinator();
const updateReconciler = createUpdateReconciler({
  runPass: () =>
    runUpdateReconciliationPass({
      channel,
      channelBasePath,
      channelOrigin,
      enqueue,
      coordinator: preparationCoordinator,
    }),
  runEffects: (effects) =>
    runReconciliationEffects(
      { channel, channelBasePath, channelOrigin, enqueue, coordinator: preparationCoordinator },
      effects,
    ),
});

self.addEventListener('install', (event) => {
  // Deliberately outside `enqueue`/`OperationQueue`: predecessor probing,
  // the `latest.json`/descriptor fetch, file downloads, hashing, and cache
  // preparation are long-running network/cache work, never a short
  // serialized state transition. `self.registration.active` is read
  // synchronously here, at the moment this listener runs, so it reflects
  // this exact install attempt's own predecessor.
  // `runInstall` is where release preparation — this worker's largest
  // diagnostics source — happens on first install; neither the bounded
  // bootstrap wait nor the drain below ever changes install's own outcome
  // (`finally` preserves it) or blocks it beyond their own small bounded
  // timeouts. The bootstrap wait runs first so consent — read at worker
  // startup, concurrently with `runInstall` itself — has a real chance to
  // resolve before the drain below decides whether anything queued during
  // install can actually be flushed.
  event.waitUntil(
    runInstall(channel, channelBasePath, self.registration.active, preparationCoordinator)
      .finally(() => waitForDiagnosticsBootstrap())
      .finally(() => drainDiagnostics()),
  );
});

self.addEventListener('activate', (event) => {
  // Best-effort managed-cache housekeeping only: never selects, initializes,
  // or verifies an application release. `cleanupReleaseCache` already
  // reports its own failure (single diagnostic owner) and never rejects, so
  // this worker's activation and the bounded diagnostics drain are both
  // unaffected by a failed cleanup.
  event.waitUntil(
    cleanupReleaseCache(channel, preparationCoordinator).finally(() => drainDiagnostics()),
  );
});

self.addEventListener('fetch', (event) => {
  // For the stable channel (`channelBasePath` is `/`), a bare `startsWith`
  // check would match every path on the origin, including `/branch/**` and
  // `/pr/**` — this worker's own scope is wide enough to otherwise
  // intercept those foreign deployments' requests (including a develop
  // controller's own install-time fetches), which must stay this worker's
  // non-concern exactly like the legacy Workbox config's denylist. The
  // origin check additionally rejects any cross-origin request the browser
  // still dispatches to this handler (scope only limits which pages this
  // worker controls, not which of their requests reach `fetch`).
  if (!isSameChannelPath(event.request.url, channelBasePath, channelOrigin)) return;

  const pathname = new URL(event.request.url).pathname;

  // `updates/**` (the `latest.json` pointer, release descriptors, and
  // archived indexes) is metadata this worker fetches for its own
  // bookkeeping — never one of a release's cached asset files — and must
  // never be routed back through this same fetch handler. Once this worker
  // is active and controlling, its own internal `fetch()` calls for these
  // URLs are otherwise self-intercepted here too, and treating it as an
  // owned asset path would incorrectly serve a synthetic 404 for it (it is
  // never part of `descriptor.files`), breaking every re-check after the
  // first install.
  if (pathname.startsWith(`${channelBasePath}updates/`)) return;

  if (event.request.mode === 'navigate' && event.request.destination === 'document') {
    const resultPromise = handleNavigationFetch(
      channel,
      channelBasePath,
      event.request,
      preparationCoordinator,
      { clientId: event.clientId, resultingClientId: event.resultingClientId },
      {
        channelOrigin,
        enqueue,
        matchWindowClients: () =>
          self.clients.matchAll({ type: 'window', includeUncontrolled: true }),
      },
    );
    const responsePromise = resultPromise.then((result) => result.response);
    // Both of this navigation's own follow-up work items — its own
    // `runLifetimeWork` and joining/starting reconciliation — are chained
    // directly off `responsePromise`, never started until the response has
    // already resolved: reconciliation must never delay this navigation's
    // own response, and starting or releasing it any earlier would let it
    // race ahead of the response it belongs after.
    const navigationLifetimeWork = responsePromise.then(async () => {
      const result = await resultPromise;
      await result.runLifetimeWork?.();
    });
    const reconciliation = responsePromise.then(() => updateReconciler.reconcileNavigation());
    event.respondWith(responsePromise);
    // The bounded diagnostics drain runs only after both follow-up items
    // settle — reconciliation and recovery are where this navigation's own
    // diagnostics are generated — and never before `responsePromise` has
    // already resolved, matching every other follow-up item's ordering here.
    event.waitUntil(
      Promise.all([navigationLifetimeWork.catch(() => {}), reconciliation.catch(() => {})])
        .then(() => drainDiagnostics())
        .then(() => undefined),
    );
    return;
  }

  // This worker owns only same-channel `<channelBasePath>assets/**`. Every
  // other same-origin, same-channel request (manifest, PWA icons outside
  // `assets/**`, API routes, fonts, or anything else) is not this worker's
  // concern at all: returning without calling `respondWith()` leaves it to
  // ordinary browser network behavior, never a synthetic release-cache
  // response.
  const relativePath = pathname.slice(channelBasePath.length);
  if (!relativePath.startsWith('assets/')) return;

  event.respondWith(
    handleAssetFetch(channel, channelBasePath, event.request, preparationCoordinator),
  );
});

self.addEventListener('message', (event) => {
  // The same-path bootstrap compatibility probe (Stage 3): its sender is
  // another service worker instance installing on top of this one
  // (`registration.active.postMessage()`), never a window client, so it
  // must be answered before the same-channel *window* client check below
  // would otherwise silently reject it. Reads no state, mutates no state,
  // touches no cache — a fixed, unconditional reply naming only this
  // worker's own channel.
  const probeRequest = zodManagedControllerProbeRequest.safeParse(event.data);
  if (probeRequest.success) {
    event.ports[0]?.postMessage(
      withProtocolVersion({ kind: 'managed-update-controller' as const, channel }),
    );
    return;
  }

  // Only a same-channel window may issue a private protocol request: a
  // foreign-channel same-origin page that obtained this worker's
  // registration through `getRegistrations()` rather than its own
  // `controller` must never be able to read or mutate this channel's
  // controller state, and must never learn anything about it — including
  // through an error response, which is why this case is silently ignored
  // rather than answered.
  if (!isSameChannelWindowClient(event.source, channelBasePath, channelOrigin)) return;

  // The diagnostics-policy live-sync message: independent diagnostics
  // infrastructure, not part of the private update protocol above. Applies
  // the pushed runtime state to this worker's own diagnostics runtime so an
  // already-running worker reacts immediately to a consent change, and never
  // responds — no port reply, no updater snapshot, no state mutation beyond
  // the diagnostics runtime itself.
  const diagnosticsSync = zodDiagnosticsPolicySyncMessage.safeParse(event.data);
  if (diagnosticsSync.success) {
    const { reportingState, sessionId } = diagnosticsSync.data;
    // Marked before applying: a still-in-flight startup bootstrap read must
    // see this and skip overwriting the live value it is about to apply.
    liveDiagnosticsSyncApplied = true;
    event.waitUntil(
      applyDiagnosticsRuntimeState({ reportingState, sessionId })
        .catch(() => {})
        .then(() => drainDiagnostics()),
    );
    return;
  }

  // A malformed payload or an unsupported/missing protocol version is
  // ignored exactly like a foreign-channel request above: no state
  // mutation, no response, and never a thrown error out of this handler.
  const parsedRequest = zodAppUpdateWorkerRequest.safeParse(event.data);
  if (!parsedRequest.success) return;
  const request = parsedRequest.data;

  const respond = (result: unknown) => {
    if (event.ports[0]) event.ports[0].postMessage(result);
  };

  // The response is posted as soon as `handleWorkerMessage` resolves; only
  // afterwards is `runLifetimeWork` (cache cleanup, a same-channel
  // invalidation broadcast, or a rollback broadcast) invoked and awaited,
  // still inside this same `message` event's `waitUntil()` — this ordering
  // is what guarantees the underlying follow-up work never starts before the
  // response has already been posted.
  event.waitUntil(
    (async () => {
      let result;
      try {
        result = await handleWorkerMessage(
          channel,
          channelBasePath,
          channelOrigin,
          request,
          enqueue,
          preparationCoordinator,
          updateReconciler,
        );
      } catch (error) {
        // Never a raw exception message: this private protocol only ever
        // sends the stable, versioned failure envelope across the boundary.
        respond(withProtocolVersion({ error: 'unavailable' as const }));
        // A CHECK_FOR_UPDATES whose reconciliation attempt it created failed
        // still owns that attempt's own effects (broadcast/cleanup from an
        // earlier successful pass this same attempt ran) — run them here,
        // exactly once, strictly after the fallback response above has
        // already been posted.
        if (error instanceof ReconciliationFailure) await error.runLifetimeWork().catch(() => {});
        // A release-preparation failure was already reported once at its own
        // classified boundary (`PreparationCoordinator.prepare`), and a
        // controller-state write failure at its own storage boundary
        // (`writeControllerState`) — this is the remaining unexpected-failure
        // safety net for command handling itself.
        const cause = error instanceof ReconciliationFailure ? error.cause : error;
        if (!isReleasePreparationError(cause) && !isControllerStateWriteError(cause)) {
          captureDiagnosticException(cause, { operation: 'workerMessageHandling' });
        }
        await drainDiagnostics();
        return;
      }
      respond(result.response);
      // `runLifetimeWork` is documented as best effort and every current
      // producer already swallows its own failures; this catch is a defense
      // in depth so a future producer's mistake can never throw out of this
      // handler or surface as an unhandled rejection.
      if (result.runLifetimeWork) await result.runLifetimeWork().catch(() => {});
      await drainDiagnostics();
    })(),
  );
});
