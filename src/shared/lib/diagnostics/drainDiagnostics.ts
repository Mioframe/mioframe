import { getSentryReportingState, useSentry } from './sentryRuntime';
import { drainQueuedDiagnosticEvents } from './reportDiagnosticEvent';
import { drainQueuedDiagnosticExceptions } from './captureDiagnosticException';

/**
 * Bounded best-effort delivery timeout for {@link drainDiagnostics}. Short enough that
 * a Service Worker event handler waiting on it never meaningfully delays install,
 * activation, navigation, or a message response; long enough to usually let one small
 * pending HTTP delivery to Sentry finish on an ordinary connection.
 */
export const DIAGNOSTICS_DRAIN_TIMEOUT_MS = 2_000;

/**
 * Best-effort diagnostics drain for Service Worker event lifetimes, which can be
 * terminated once their `event.waitUntil(...)` promise settles. Awaits this
 * runtime's own bounded in-memory queues (`reportDiagnosticEvent`,
 * `captureDiagnosticException`) actually handing their entries to the Sentry
 * facade — joining an already-running flush cycle rather than starting a
 * second one — before waiting — bounded by {@link DIAGNOSTICS_DRAIN_TIMEOUT_MS}
 * — for the SDK's transport to finish delivering them. This ordering is what
 * guarantees a queued entry has reached the SDK before this function's own
 * `flush()` call can resolve.
 *
 * A no-op when reporting is `unknown` or `disabled`, and effectively a no-op when
 * nothing is pending (the SDK's own `flush` resolves immediately in that case).
 * Never rejects, never throws, and never affects updater state, HTTP response
 * selection, or install/activate success — callers attach this only inside
 * `event.waitUntil(...)`, never inside `event.respondWith(...)`.
 */
export const drainDiagnostics = async (): Promise<void> => {
  try {
    if (getSentryReportingState() !== 'enabled') return;

    await drainQueuedDiagnosticEvents();
    await drainQueuedDiagnosticExceptions();

    await useSentry().flush(DIAGNOSTICS_DRAIN_TIMEOUT_MS);
  } catch {
    // Best-effort only: must never reject into a caller's event lifetime.
  }
};
