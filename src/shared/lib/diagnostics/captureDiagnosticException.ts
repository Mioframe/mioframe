import type { CaptureContext } from '@sentry/browser';
import { ensureSentry, getSentryReportingState, isSentryConfigured } from './sentryRuntime';
import { registerDiagnosticsRuntimeEffects } from './runtimeEffects';

/**
 * Safe technical context for a captured diagnostic exception.
 * All fields must be project-controlled strings — no paths, ids, names, URLs, or user data.
 *
 * Keep this minimal: Sentry's native exception info (type, stack, mechanism, source maps)
 * already provides rich classification. Only add context that Sentry cannot derive itself.
 */
export interface DiagnosticExceptionContext {
  /** The operation or flow that produced the exception. */
  operation?: string;
  /** Safe classification of how the failure was handled or recovered. */
  failureClassification?: string;
  /** Safe Sentry feature tag. */
  feature?: string;
  /** Safe Sentry action tag. */
  action?: string;
}

const NON_ERROR_MESSAGE = 'Captured non-error value';

const resolveError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error(NON_ERROR_MESSAGE);
};

const buildCaptureContext = (
  context: DiagnosticExceptionContext | undefined,
  scopeTags: Record<string, string> | undefined,
): CaptureContext => {
  const { operation, failureClassification, feature, action } = context ?? {};

  const diagnosticCtx: Record<string, unknown> = {};
  if (operation !== undefined) diagnosticCtx.operation = operation;
  if (failureClassification !== undefined)
    diagnosticCtx.failureClassification = failureClassification;

  const tags: Record<string, string> = {
    eventKind: 'handledException',
    ...scopeTags,
  };
  if (feature !== undefined) tags.feature = feature;
  if (action !== undefined) tags.action = action;

  return {
    tags,
    ...(Object.keys(diagnosticCtx).length > 0 ? { contexts: { diagnostic: diagnosticCtx } } : {}),
  };
};

/** One queued exception awaiting delivery once reporting is allowed. */
type QueuedDiagnosticException = {
  error: Error;
  captureContext: CaptureContext;
};

const EXCEPTION_QUEUE_LIMIT = 50;
const exceptionQueue: QueuedDiagnosticException[] = [];

// Prevents a second concurrent flush from starting while one is in flight.
let flushPromise: Promise<void> | undefined;

/**
 * Clears queued diagnostic exceptions without sending them.
 */
export const clearQueuedDiagnosticExceptions = (): void => {
  exceptionQueue.length = 0;
};

const trimQueue = () => {
  if (exceptionQueue.length > EXCEPTION_QUEUE_LIMIT) {
    exceptionQueue.splice(0, exceptionQueue.length - EXCEPTION_QUEUE_LIMIT);
  }
};

const sendEntry = (
  entry: QueuedDiagnosticException,
  sentry: Awaited<ReturnType<typeof ensureSentry>>,
): boolean => {
  try {
    const eventId = sentry.captureException(entry.error, entry.captureContext);
    return eventId !== undefined;
  } catch {
    return false;
  }
};

const flushOnce = async (): Promise<void> => {
  if (exceptionQueue.length === 0) return;

  if (!isSentryConfigured()) {
    clearQueuedDiagnosticExceptions();
    return;
  }

  if (getSentryReportingState() !== 'enabled') return;

  const sentry = await ensureSentry();

  while (exceptionQueue.length > 0) {
    const entry = exceptionQueue.shift();
    if (!entry) return;

    const sent = sendEntry(entry, sentry);

    if (!sent) {
      exceptionQueue.unshift(entry);
      trimQueue();
      return;
    }
  }
};

const doFlush = (): Promise<void> => {
  flushPromise ??= flushOnce()
    .catch(() => {
      // Fire-and-forget: swallow errors to prevent unhandled rejections.
    })
    .finally(() => {
      flushPromise = undefined;
    });
  return flushPromise;
};

/**
 * Flushes queued diagnostic exceptions when reporting is currently allowed.
 * Fire-and-forget: never throws into product code and never creates unhandled promise rejections.
 * A concurrent flush cycle is a no-op; call again after the in-flight flush finishes.
 */
export const flushQueuedDiagnosticExceptions = (): void => {
  void doFlush();
};

/**
 * Awaitable counterpart to {@link flushQueuedDiagnosticExceptions}: starts a flush cycle if
 * none is running, or joins the one already in flight, resolving only once every entry that
 * flush cycle owns has been passed to the Sentry facade. Never rejects.
 * @returns A promise that resolves once the current or a newly started flush cycle settles.
 */
export const drainQueuedDiagnosticExceptions = (): Promise<void> => doFlush();

registerDiagnosticsRuntimeEffects('diagnosticExceptions', {
  flush: flushQueuedDiagnosticExceptions,
  clear: clearQueuedDiagnosticExceptions,
});

/**
 * Reports a caught error to Sentry as a real exception (with stack trace and native grouping).
 * Use this for user-handled errors that are already shown to the user, and for any caught
 * Error where the stack is useful for diagnosis.
 *
 * For structured state observations without an Error, use `reportDiagnosticEvent` instead.
 *
 * The context is attached via Sentry capture context and sanitized by `beforeSend`.
 * Never pass paths, document ids, file names, storage keys, raw error messages,
 * or user-controlled values.
 *
 * Respects diagnostics consent/Sentry reporting state, exactly like `reportDiagnosticEvent`:
 * queued in a small bounded in-memory queue while state is `unknown` (so an exception caught
 * before consent resolves is never lost), flushed once state becomes `enabled`, and dropped
 * when state is `disabled`. The original `Error` object is always preserved — never replaced
 * by a synthetic error — so native stack trace and grouping survive delivery.
 *
 * Product code must not import a Sentry SDK directly. Use this wrapper instead.
 * @param error - The caught value to report. Non-Error values are wrapped in a synthetic Error.
 * @param context - Safe technical context attached as a `diagnostic` Sentry context entry.
 * @param scopeTags - Optional additional safe project-controlled tags.
 */
export const captureDiagnosticException = (
  error: unknown,
  context?: DiagnosticExceptionContext,
  scopeTags?: Record<string, string>,
): void => {
  try {
    if (!isSentryConfigured()) {
      clearQueuedDiagnosticExceptions();
      return;
    }

    const state = getSentryReportingState();
    if (state === 'disabled') return;

    exceptionQueue.push({
      error: resolveError(error),
      captureContext: buildCaptureContext(context, scopeTags),
    });
    trimQueue();

    if (state === 'enabled') {
      flushQueuedDiagnosticExceptions();
    }
  } catch {
    // Fire-and-forget: must not propagate into product call stacks.
  }
};
