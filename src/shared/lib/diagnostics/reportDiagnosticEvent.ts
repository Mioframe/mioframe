import { ensureSentry, getSentryReportingState, isSentryConfigured } from '@shared/lib/setupSentry';
import type { DiagnosticEvent } from './DiagnosticEvent';
import { DiagnosticSeverity } from './diagnosticEnums';

const DIAGNOSTIC_QUEUE_LIMIT = 50;
const diagnosticQueue: DiagnosticEvent[] = [];
let flushPromise: Promise<void> | undefined;
let memorySink: DiagnosticEvent[] | undefined;

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
 * Clears queued diagnostic events without sending them.
 */
export const clearQueuedDiagnosticEvents = (): void => {
  diagnosticQueue.length = 0;
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
      scope.setTag('feature', entry.feature);
      scope.setTag('operation', entry.operation);
      scope.setTag('stage', entry.stage);
      scope.setTag('result', entry.result);
      scope.setTag('classification', entry.classification);

      if (entry.providerKind !== undefined) {
        scope.setTag('providerKind', entry.providerKind);
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

      return sentry.captureMessage(
        `[diagnostic] ${entry.feature}/${entry.operation}/${entry.stage}`,
      );
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

/**
 * Flushes queued diagnostic events when reporting is currently allowed.
 * Fire-and-forget: never throws into product code and never creates unhandled promise rejections.
 * Parallel flush cycles are collapsed into the active in-flight run. If a new event is added
 * while a flush is running, `pendingRetry` is set so one follow-up flush runs after completion.
 */
export const flushQueuedDiagnosticEvents = (): void => {
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
      if (pendingRetry && isSentryConfigured() && getSentryReportingState() === 'enabled') {
        flushQueuedDiagnosticEvents();
      }
    });
};

/**
 * Reports a structured diagnostic event.
 *
 * - Respects diagnostics consent/Sentry reporting state.
 * - Fire-and-forget: does not throw into product code.
 * - Writes to an optional in-memory test sink set by `setDiagnosticEventSink`.
 * - Uses Sentry as the transport backend; callers must not import Sentry directly.
 *
 * Must only be called from service, repository-service, or service-client layers.
 * Do not call from VFS providers or low-level storage adapters.
 * @param event - The structured diagnostic event to report.
 */
export const reportDiagnosticEvent = (event: DiagnosticEvent): void => {
  memorySink?.push(event);

  try {
    if (!isSentryConfigured()) {
      clearQueuedDiagnosticEvents();
      return;
    }

    const state = getSentryReportingState();

    if (state === 'disabled') return;

    diagnosticQueue.push(event);
    trimQueue();

    if (state === 'enabled') {
      flushQueuedDiagnosticEvents();
    }
  } catch {
    // Fire-and-forget: must not propagate into product call stacks.
  }
};
