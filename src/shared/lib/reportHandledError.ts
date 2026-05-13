import { DomainError } from '@shared/lib/error';
import { ensureSentry, getSentryReportingState, isSentryConfigured } from './setupSentry';

type ReportHandledErrorOptions = {
  feature: string;
  action: string;
};

const HANDLED_NON_ERROR_MESSAGE = 'Handled non-error exception';
const HANDLED_REPORT_QUEUE_LIMIT = 50;

type HandledReportEntry = {
  error: Error;
  extras: Record<string, unknown>;
  options: ReportHandledErrorOptions;
};

const handledReportQueue: HandledReportEntry[] = [];
let flushPromise: Promise<void> | undefined;

const trimHandledReportQueue = () => {
  if (handledReportQueue.length > HANDLED_REPORT_QUEUE_LIMIT) {
    handledReportQueue.splice(0, handledReportQueue.length - HANDLED_REPORT_QUEUE_LIMIT);
  }
};

const enqueueHandledReport = (entry: HandledReportEntry) => {
  handledReportQueue.push(entry);
  trimHandledReportQueue();
};

/**
 * Clears queued handled reports and prevents old entries from retrying later.
 */
export const clearQueuedHandledReports = () => {
  handledReportQueue.length = 0;
};

const sendHandledReport = (
  entry: HandledReportEntry,
  sentry: Awaited<ReturnType<typeof ensureSentry>>,
) => {
  try {
    const eventId = sentry.withScope((scope) => {
      scope.setTag('handled', 'true');
      scope.setTag('feature', entry.options.feature);
      scope.setTag('action', entry.options.action);

      if (Object.keys(entry.extras).length > 0) {
        scope.setExtras(entry.extras);
      }

      return sentry.captureException(entry.error);
    });

    return eventId !== undefined;
  } catch {
    return false;
  }
};

const flushQueuedHandledReportsOnce = async () => {
  if (handledReportQueue.length === 0) {
    return;
  }

  if (!isSentryConfigured()) {
    clearQueuedHandledReports();
    return;
  }

  if (getSentryReportingState() !== 'enabled') {
    return;
  }

  const sentry = await ensureSentry();

  while (handledReportQueue.length > 0) {
    const entry = handledReportQueue.shift();

    if (!entry) {
      return;
    }

    const wasSent = sendHandledReport(entry, sentry);

    if (!wasSent) {
      handledReportQueue.unshift(entry);
      trimHandledReportQueue();
      return;
    }
  }
};

/**
 * Flushes queued handled reports when reporting is currently allowed.
 * Parallel flush cycles are collapsed into the active in-flight run.
 */
export const flushQueuedHandledReports = () => {
  flushPromise ??= flushQueuedHandledReportsOnce().finally(() => {
    flushPromise = undefined;
  });
};

/**
 * Reports a user-handled error to Sentry without rethrowing it. Domain errors with an `Error`
 * cause report the underlying cause while keeping the user-facing message as extra context.
 * @param error - The handled error or thrown value.
 * @param options - Feature metadata attached to the Sentry scope.
 */
export const reportHandledError = (error: unknown, options: ReportHandledErrorOptions) => {
  let reportedError: Error;
  const extras: Record<string, unknown> = {};

  if (error instanceof DomainError && error.cause instanceof Error) {
    reportedError = error.cause;
    extras.userMessage = error.message;
    if (error.code !== undefined) {
      extras.domainErrorCode = error.code;
    }
  } else if (error instanceof DomainError) {
    reportedError = error;
    extras.userMessage = error.message;
    if (error.code !== undefined) {
      extras.domainErrorCode = error.code;
    }
  } else if (error instanceof Error) {
    reportedError = error;
  } else {
    reportedError = new Error(HANDLED_NON_ERROR_MESSAGE);
    extras.originalThrownType =
      error === null ? 'null' : Array.isArray(error) ? 'array' : typeof error;
  }

  try {
    if (!isSentryConfigured()) {
      clearQueuedHandledReports();
      return;
    }

    const reportingState = getSentryReportingState();

    if (reportingState === 'disabled') {
      return;
    }

    enqueueHandledReport({
      error: reportedError,
      extras,
      options,
    });

    if (reportingState === 'enabled') {
      flushQueuedHandledReports();
    }
  } catch {
    // Reporting must remain fire-and-forget for UI handlers.
  }
};
