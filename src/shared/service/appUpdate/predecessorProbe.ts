/// <reference lib="webworker" />

import type { ManagedChannel } from './contracts';
import {
  APP_UPDATE_PROTOCOL_VERSION,
  zodManagedControllerProbeResponse,
  type ManagedControllerProbeRequest,
} from './protocol';

/**
 * Shared deadline for both concurrent predecessor probes (see the managed
 * pinned application updates architecture, "Same-path Workbox bootstrap").
 * One deadline for both probes together, never two sequential waits.
 */
const PREDECESSOR_PROBE_DEADLINE_MS = 5000;

/**
 * The standard generated-Workbox `CACHE_URLS` message. `urlsToCache` is
 * deliberately empty: compatibility is proven by a compatible reply, never
 * by actually asking the predecessor to cache anything.
 */
const WORKBOX_CACHE_URLS_PROBE = { type: 'CACHE_URLS', payload: { urlsToCache: [] } };

/** One probe's raw transport outcome, before classification. */
type RawProbeResult = { status: 'silent' } | { status: 'received'; data: unknown };

/**
 * The minimal structural shape {@link probePredecessor} needs from a
 * predecessor worker: a real `ServiceWorker` (e.g. `registration.active`)
 * already satisfies this without any cast, and a test fake needs to
 * implement only this one method.
 */
export type PredecessorLike = Pick<ServiceWorker, 'postMessage'>;

/**
 * Sends `message` to `active` through a fresh, owned `MessageChannel`,
 * resolving with whatever it replies before `deadlineMs`, or `'silent'` on
 * timeout, no listener, or a synchronous transport failure. Never retries or
 * polls. Always closes its own port once settled, whether by reply or
 * timeout.
 * @param active - The predecessor worker to probe.
 * @param message - The probe message to send.
 * @param deadlineMs - Maximum time to wait for a reply.
 * @returns The raw probe result.
 */
function sendProbe(
  active: PredecessorLike,
  message: unknown,
  deadlineMs: number,
): Promise<RawProbeResult> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    let settled = false;

    const finish = (result: RawProbeResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.port1.close();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ status: 'silent' });
    }, deadlineMs);
    channel.port1.onmessage = (event: MessageEvent): void => {
      finish({ status: 'received', data: event.data });
    };

    try {
      active.postMessage(message, [channel.port2]);
    } catch {
      finish({ status: 'silent' });
    }
  });
}

/** One probe's classified outcome: a well-formed compatible reply, no reply at all, or a reply that fails validation. */
type ProbeState = 'valid' | 'silent' | 'malformed';

/**
 * Classifies the managed probe's raw result. A reply is `'valid'` only when
 * it parses as {@link zodManagedControllerProbeResponse} and its `channel`
 * matches the installing worker's own expected channel — a schema-valid
 * reply for the *other* channel is `'malformed'`, not a valid predecessor of
 * a different kind, per the architecture's "a wrong channel is not another
 * valid predecessor" rule.
 * @param raw - The managed probe's raw transport result.
 * @param channel - The installing worker's own expected channel.
 * @returns The classified probe state.
 */
function classifyManagedProbe(raw: RawProbeResult, channel: ManagedChannel): ProbeState {
  if (raw.status === 'silent') return 'silent';
  const parsed = zodManagedControllerProbeResponse.safeParse(raw.data);
  if (!parsed.success) return 'malformed';
  return parsed.data.channel === channel ? 'valid' : 'malformed';
}

/**
 * Classifies the Workbox probe's raw result. Only the exact literal `true`
 * is `'valid'`; any other received value is `'malformed'`, never treated the
 * same as no reply at all.
 * @param raw - The Workbox probe's raw transport result.
 * @returns The classified probe state.
 */
function classifyWorkboxProbe(raw: RawProbeResult): ProbeState {
  if (raw.status === 'silent') return 'silent';
  return raw.data === true ? 'valid' : 'malformed';
}

/** This installing worker's classification of `registration.active`, from the concurrent predecessor probe matrix. */
export type PredecessorOutcome = 'managed' | 'workbox' | 'reject';

/**
 * The pure, table-driven predecessor classification matrix (see the managed
 * pinned application updates architecture, "Same-path Workbox bootstrap").
 * A malformed reply from either probe rejects unconditionally, regardless of
 * the other probe's outcome; a valid reply from both probes at once is a
 * conflict, not a preference for one predecessor kind over the other.
 * @param managed - The classified managed-probe state.
 * @param workbox - The classified Workbox-probe state.
 * @returns The resulting predecessor outcome.
 */
function classifyPredecessorOutcome(managed: ProbeState, workbox: ProbeState): PredecessorOutcome {
  if (managed === 'malformed' || workbox === 'malformed') return 'reject';
  if (managed === 'valid' && workbox === 'valid') return 'reject';
  if (managed === 'valid') return 'managed';
  if (workbox === 'valid') return 'workbox';
  return 'reject';
}

/**
 * Sends the exact concurrent managed and Workbox predecessor probes to
 * `active` and classifies the result. Both probes are dispatched before
 * either is awaited, and share one {@link PREDECESSOR_PROBE_DEADLINE_MS}
 * deadline rather than two sequential waits.
 * @param active - `registration.active`, the predecessor to probe.
 * @param channel - The installing worker's own expected channel.
 * @returns The classified predecessor outcome.
 */
export async function probePredecessor(
  active: PredecessorLike,
  channel: ManagedChannel,
): Promise<PredecessorOutcome> {
  const managedProbeRequest: ManagedControllerProbeRequest = {
    protocolVersion: APP_UPDATE_PROTOCOL_VERSION,
    type: 'PROBE_MANAGED_UPDATE_CONTROLLER',
  };
  const managedRawPromise = sendProbe(active, managedProbeRequest, PREDECESSOR_PROBE_DEADLINE_MS);
  const workboxRawPromise = sendProbe(
    active,
    WORKBOX_CACHE_URLS_PROBE,
    PREDECESSOR_PROBE_DEADLINE_MS,
  );

  const [managedRaw, workboxRaw] = await Promise.all([managedRawPromise, workboxRawPromise]);
  return classifyPredecessorOutcome(
    classifyManagedProbe(managedRaw, channel),
    classifyWorkboxProbe(workboxRaw),
  );
}
