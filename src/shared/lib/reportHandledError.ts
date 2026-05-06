import { DomainError } from '@shared/lib/error';
import { ensureSentry, isSentryReportingConfigured } from './setupSentry';

type ReportHandledErrorOptions = {
  feature: string;
  action: string;
  path?: string | undefined;
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
let queuedDuringFlush = false;

const trimHandledReportQueue = () => {
  if (handledReportQueue.length > HANDLED_REPORT_QUEUE_LIMIT) {
    handledReportQueue.splice(0, handledReportQueue.length - HANDLED_REPORT_QUEUE_LIMIT);
  }
};

const enqueueHandledReport = (entry: HandledReportEntry) => {
  handledReportQueue.push(entry);
  trimHandledReportQueue();

  if (flushPromise) {
    queuedDuringFlush = true;
  }
};

const dropHandledReportQueue = () => {
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

const flushHandledReports = async () => {
  if (handledReportQueue.length === 0) {
    return;
  }

  if (!isSentryReportingConfigured()) {
    dropHandledReportQueue();
    return;
  }

  const sentry = await ensureSentry();
  const queuedEntries = handledReportQueue.splice(0);
  const failedEntries: HandledReportEntry[] = [];

  for (const entry of queuedEntries) {
    const wasSent = sendHandledReport(entry, sentry);

    if (!wasSent) {
      failedEntries.push(entry);
    }
  }

  if (failedEntries.length > 0) {
    handledReportQueue.unshift(...failedEntries);
    trimHandledReportQueue();
  }
};

const kickoffHandledReportFlush = () => {
  if (flushPromise) {
    return;
  }

  flushPromise = flushHandledReports()
    .catch(() => undefined)
    .finally(() => {
      const shouldFlushQueuedReports = queuedDuringFlush;

      flushPromise = undefined;
      queuedDuringFlush = false;

      if (shouldFlushQueuedReports && handledReportQueue.length > 0) {
        kickoffHandledReportFlush();
      }
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
  } else if (error instanceof Error) {
    reportedError = error;
  } else {
    reportedError = new Error(HANDLED_NON_ERROR_MESSAGE);
    extras.originalError = error;
  }

  if (options.path !== undefined) {
    extras.path = options.path;
  }

  try {
    if (!isSentryReportingConfigured()) {
      dropHandledReportQueue();
      return;
    }

    enqueueHandledReport({
      error: reportedError,
      extras,
      options,
    });
    kickoffHandledReportFlush();
  } catch {
    // Reporting must remain fire-and-forget for UI handlers.
  }
};
