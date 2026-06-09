import type { CaptureContext } from '@sentry/vue';
import { ensureSentry, getSentryReportingState, isSentryConfigured } from './sentryRuntime';
import { registerDiagnosticsRuntimeEffects } from './runtimeEffects';
import type { DiagnosticEvent } from './DiagnosticEvent';
import { DiagnosticSeverity } from './diagnosticEnums';

const DIAGNOSTIC_QUEUE_LIMIT = 50;
const diagnosticQueue: DiagnosticEvent[] = [];

// Prevents a second concurrent flush from starting while one is in flight.
let flushPromise: Promise<void> | undefined;
let memorySink: DiagnosticEvent[] | undefined;

/**
 * Sets an in-memory sink that receives every `reportDiagnosticEvent` call.
 * Pass `undefined` to remove the sink.
 * Intended for integration tests only — exposed through diagnosticsTestUtils, not the
 * production barrel. The sink bypasses Sentry consent so it works without initializing the
 * full reporting stack.
 * @internal
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

/**
 * Builds a Sentry capture context from a structured diagnostic event.
 * Owns tag projection, extra field projection, and safe error field normalization.
 * @param entry - Structured diagnostic event.
 * @returns Sentry-compatible capture context.
 */
export const toSentryDiagnosticCaptureContext = (entry: DiagnosticEvent): CaptureContext => {
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

  return {
    level: severityToSentryLevel(entry.severity),
    tags: {
      eventKind: 'diagnostic',
      severity: entry.severity,
      result: entry.result,
      classification: entry.classification,
      ...entry.safeTags,
    },
    ...(Object.keys(extras).length > 0 ? { extra: extras } : {}),
  };
};

const sendEntry = (
  entry: DiagnosticEvent,
  sentry: Awaited<ReturnType<typeof ensureSentry>>,
): boolean => {
  try {
    const eventId = sentry.captureMessage(
      `[diagnostic] ${entry.name}`,
      toSentryDiagnosticCaptureContext(entry),
    );
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

const doFlush = (): void => {
  if (flushPromise) return;

  flushPromise = flushOnce()
    .catch(() => {
      // Fire-and-forget: swallow errors to prevent unhandled rejections.
    })
    .finally(() => {
      flushPromise = undefined;
    });
};

/**
 * Flushes queued diagnostic events when reporting is currently allowed.
 * Fire-and-forget: never throws into product code and never creates unhandled promise rejections.
 * A concurrent flush cycle is a no-op; call again after the in-flight flush finishes.
 */
export const flushQueuedDiagnosticEvents = (): void => {
  doFlush();
};

registerDiagnosticsRuntimeEffects('diagnosticEvents', {
  flush: flushQueuedDiagnosticEvents,
  clear: clearQueuedDiagnosticEvents,
});

/**
 * Reports a structured diagnostic event.
 *
 * - Respects diagnostics consent/Sentry reporting state.
 * - Fire-and-forget: does not throw into product code.
 * - Uses Sentry as the transport backend; callers must not import Sentry directly.
 * - In the worker runtime, the worker's own Sentry instance delivers events directly.
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
