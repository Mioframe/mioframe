import {
  ensureSentry,
  getSentryReportingState,
  isSentryConfigured,
  useSentry,
} from '@shared/lib/setupSentry';
import type { DiagnosticEvent } from './DiagnosticEvent';
import type { DiagnosticBreadcrumb } from './DiagnosticBreadcrumb';
import { DiagnosticSeverity } from './diagnosticEnums';

const DIAGNOSTIC_QUEUE_LIMIT = 50;
const diagnosticQueue: DiagnosticEvent[] = [];

const DEDUPE_TTL_MS = 30_000;
const DEDUPE_MAP_MAX_SIZE = 200;
const dedupeMap = new Map<string, number>();

const buildDedupeKey = (event: DiagnosticEvent): string => {
  const tagsKey = event.safeTags
    ? JSON.stringify(Object.entries(event.safeTags).sort(([a], [b]) => a.localeCompare(b)))
    : '';
  const errKey = event.error
    ? `${event.error.errorClass}|${event.error.errorClassification}|${event.error.domExceptionName ?? ''}|${event.error.vfsErrorCode ?? ''}|${event.error.domainErrorCode ?? ''}`
    : '';
  return `${event.name}|${event.severity}|${event.result}|${event.classification}|${tagsKey}|${errKey}`;
};

const isRecentDuplicate = (key: string): boolean => {
  const now = Date.now();

  // Always remove expired entries so fresh events can take their place.
  for (const [k, ts] of dedupeMap) {
    if (now - ts > DEDUPE_TTL_MS) {
      dedupeMap.delete(k);
    }
  }

  const lastSeen = dedupeMap.get(key);
  if (lastSeen !== undefined && now - lastSeen < DEDUPE_TTL_MS) {
    return true;
  }

  // Evict the oldest entry when the map is at capacity so the size stays bounded.
  if (dedupeMap.size >= DEDUPE_MAP_MAX_SIZE) {
    const oldestKey = dedupeMap.keys().next().value;
    if (oldestKey !== undefined) dedupeMap.delete(oldestKey);
  }

  dedupeMap.set(key, now);
  return false;
};
let flushPromise: Promise<void> | undefined;
let memorySink: DiagnosticEvent[] | undefined;
let eventForwarder: ((event: DiagnosticEvent) => void) | undefined;
let breadcrumbForwarder: ((breadcrumb: DiagnosticBreadcrumb) => void) | undefined;

/**
 * Sets an in-memory sink that receives every `reportDiagnosticEvent` call.
 * Pass `undefined` to remove the sink.
 * Intended for unit tests only — the sink bypasses Sentry consent so it works without
 * initializing the full reporting stack.
 * @param sink - The array to write events to, or `undefined` to clear the sink.
 */
export const setDiagnosticEventSink = (sink: DiagnosticEvent[] | undefined): void => {
  memorySink = sink;
};

/**
 * Registers a fire-and-forget forwarder for diagnostic events.
 *
 * When set, `reportDiagnosticEvent` forwards every event to the forwarder and skips the
 * local Sentry delivery path. This is the mechanism worker contexts use to relay events
 * to the main-thread diagnostics reporter, which owns Sentry delivery.
 *
 * Pass `undefined` to remove the forwarder and restore local Sentry delivery.
 * Must not be called from main-thread product code — use only at worker entry points.
 * @param forwarder - The function to receive forwarded events, or `undefined` to clear it.
 */
export const setDiagnosticEventForwarder = (
  forwarder: ((event: DiagnosticEvent) => void) | undefined,
): void => {
  eventForwarder = forwarder;
};

/**
 * Registers a fire-and-forget forwarder for diagnostic breadcrumbs.
 *
 * When set, `addDiagnosticBreadcrumb` forwards every breadcrumb to the forwarder and skips
 * local Sentry delivery. Used in worker contexts to relay breadcrumbs to the main-thread
 * diagnostics service.
 *
 * Pass `undefined` to remove the forwarder and restore local Sentry delivery.
 * Must not be called from main-thread product code — use only at worker entry points.
 * @param forwarder - The function to receive forwarded breadcrumbs, or `undefined` to clear it.
 */
export const setBreadcrumbForwarder = (
  forwarder: ((breadcrumb: DiagnosticBreadcrumb) => void) | undefined,
): void => {
  breadcrumbForwarder = forwarder;
};

/**
 * Adds a safe technical diagnostic breadcrumb.
 *
 * - In worker contexts, forwards to the main-thread diagnostics service via the forwarder
 *   set by `setBreadcrumbForwarder`.
 * - On the main thread, adds the breadcrumb to Sentry directly.
 * - Fire-and-forget: does not throw into product code.
 * - Breadcrumbs must use allowed categories and data keys only; sanitization is enforced
 *   at the Sentry layer via `beforeBreadcrumb`.
 * @param breadcrumb - The safe technical breadcrumb to add.
 */
export const addDiagnosticBreadcrumb = (breadcrumb: DiagnosticBreadcrumb): void => {
  if (breadcrumbForwarder) {
    try {
      breadcrumbForwarder(breadcrumb);
    } catch {
      // Fire-and-forget: forwarding failures must never propagate into product code.
    }
    return;
  }

  try {
    useSentry().addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level ?? 'info',
      ...(breadcrumb.data !== undefined ? { data: breadcrumb.data } : {}),
    });
  } catch {
    // Fire-and-forget: must not propagate into product call stacks.
  }
};

/**
 * Clears queued diagnostic events without sending them.
 */
export const clearQueuedDiagnosticEvents = (): void => {
  diagnosticQueue.length = 0;
  dedupeMap.clear();
};

const trimQueue = () => {
  if (diagnosticQueue.length > DIAGNOSTIC_QUEUE_LIMIT) {
    diagnosticQueue.splice(0, diagnosticQueue.length - DIAGNOSTIC_QUEUE_LIMIT);
  }
};

const severityToSentryLevel = (
  severity: DiagnosticSeverity,
): 'info' | 'warning' | 'error' | 'fatal' => {
  switch (severity) {
    case DiagnosticSeverity.Info:
      return 'info';
    case DiagnosticSeverity.Warning:
      return 'warning';
    case DiagnosticSeverity.Error:
      return 'error';
    case DiagnosticSeverity.Fatal:
      return 'fatal';
  }
};

const sendEntry = (
  entry: DiagnosticEvent,
  sentry: Awaited<ReturnType<typeof ensureSentry>>,
): boolean => {
  try {
    const eventId = sentry.withScope((scope) => {
      scope.setLevel(severityToSentryLevel(entry.severity));
      scope.setTag('eventKind', 'diagnostic');
      scope.setTag('severity', entry.severity);
      scope.setTag('result', entry.result);
      scope.setTag('classification', entry.classification);

      if (entry.safeTags) {
        for (const [key, value] of Object.entries(entry.safeTags)) {
          scope.setTag(key, value);
        }
      }

      const extras: Record<string, unknown> = {};

      if (entry.attemptId !== undefined) {
        extras.attemptId = entry.attemptId;
      }

      if (entry.counters) {
        const { pendingCount, failedCount, flushedCount } = entry.counters;
        if (pendingCount !== undefined) extras.pendingCount = pendingCount;
        if (failedCount !== undefined) extras.failedCount = failedCount;
        if (flushedCount !== undefined) extras.flushedCount = flushedCount;
      }

      if (entry.error) {
        extras.errorClass = entry.error.errorClass;
        if (entry.error.domExceptionName !== undefined)
          extras.domExceptionName = entry.error.domExceptionName;
        if (entry.error.vfsErrorCode !== undefined) extras.vfsErrorCode = entry.error.vfsErrorCode;
        if (entry.error.domainErrorCode !== undefined)
          extras.domainErrorCode = entry.error.domainErrorCode;
        extras.errorClassification = entry.error.errorClassification;
      }

      if (Object.keys(extras).length > 0) {
        scope.setExtras(extras);
      }

      return sentry.captureMessage(`[diagnostic] ${entry.name}`);
    });

    return eventId !== undefined;
  } catch {
    return false;
  }
};

const flushOnce = async (): Promise<void> => {
  if (diagnosticQueue.length === 0) return;

  if (!isSentryConfigured()) {
    clearQueuedDiagnosticEvents();
    return;
  }

  if (getSentryReportingState() !== 'enabled') return;

  const sentry = await ensureSentry();

  while (diagnosticQueue.length > 0) {
    const entry = diagnosticQueue.shift();
    if (!entry) return;

    const sent = sendEntry(entry, sentry);

    if (!sent) {
      diagnosticQueue.unshift(entry);
      trimQueue();
      return;
    }
  }
};

let pendingRetry = false;

const doFlush = (isAutoRetry: boolean): void => {
  if (flushPromise) {
    pendingRetry = true;
    return;
  }

  pendingRetry = false;

  flushPromise = flushOnce()
    .catch(() => {
      // Fire-and-forget: swallow errors to prevent unhandled rejections.
    })
    .finally(() => {
      flushPromise = undefined;
      if (!isSentryConfigured() || getSentryReportingState() !== 'enabled') return;
      if (pendingRetry) {
        // A new event arrived during this flush — start one more cycle.
        doFlush(true);
      } else if (!isAutoRetry && diagnosticQueue.length > 0) {
        // First retry after a failed flush with remaining items (e.g. ensureSentry rejection).
        // Prevents a tight infinite loop: a second auto-retry only runs if a new event
        // sets pendingRetry during this retry cycle.
        doFlush(true);
      }
    });
};

/**
 * Flushes queued diagnostic events when reporting is currently allowed.
 * Fire-and-forget: never throws into product code and never creates unhandled promise rejections.
 * Parallel flush cycles are collapsed into the active in-flight run. If a new event is added
 * while a flush is running, `pendingRetry` is set so one follow-up flush runs after completion.
 * After a failed flush attempt (e.g. Sentry init rejection), one automatic retry is scheduled
 * when the queue is non-empty; further retries require a new event or an explicit call.
 */
export const flushQueuedDiagnosticEvents = (): void => {
  doFlush(false);
};

/**
 * Reports a structured diagnostic event.
 *
 * - Respects diagnostics consent/Sentry reporting state.
 * - Fire-and-forget: does not throw into product code.
 * - Writes to an optional in-memory test sink set by `setDiagnosticEventSink`.
 * - Uses Sentry as the transport backend; callers must not import Sentry directly.
 * - In worker contexts, delegates to the forwarder set by `setDiagnosticEventForwarder`
 *   so the main-thread diagnostics reporter owns Sentry delivery.
 *
 * Must only be called from service, repository-service, or service-client layers.
 * Do not call from VFS providers or low-level storage adapters.
 * @param event - The structured diagnostic event to report.
 */
export const reportDiagnosticEvent = (event: DiagnosticEvent): void => {
  memorySink?.push(event);

  if (eventForwarder) {
    try {
      eventForwarder(event);
    } catch {
      // Fire-and-forget: forwarding failures must never propagate into product code.
    }
    return;
  }

  try {
    if (!isSentryConfigured()) {
      clearQueuedDiagnosticEvents();
      return;
    }

    const state = getSentryReportingState();

    if (state === 'disabled') return;

    if (isRecentDuplicate(buildDedupeKey(event))) return;

    diagnosticQueue.push(event);
    trimQueue();

    if (state === 'enabled') {
      flushQueuedDiagnosticEvents();
    }
  } catch {
    // Fire-and-forget: must not propagate into product call stacks.
  }
};
