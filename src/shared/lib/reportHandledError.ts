import { DomainError } from '@shared/lib/error';
import { useSentry } from './setupSentry';

type ReportHandledErrorOptions = {
  feature: string;
  action: string;
  path?: string | undefined;
};

const HANDLED_NON_ERROR_MESSAGE = 'Handled non-error exception';

/**
 * Reports a user-handled error to Sentry without rethrowing it. Domain errors with an `Error`
 * cause report the underlying cause while keeping the user-facing message as extra context.
 * @param error - The handled error or thrown value.
 * @param options - Feature metadata attached to the Sentry scope.
 */
export const reportHandledError = (error: unknown, options: ReportHandledErrorOptions) => {
  const sentry = useSentry();
  const { action, feature, path } = options;

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

  if (path !== undefined) {
    extras.path = path;
  }

  sentry.withScope((scope) => {
    scope.setTag('handled', 'true');
    scope.setTag('feature', feature);
    scope.setTag('action', action);

    if (Object.keys(extras).length > 0) {
      scope.setExtras(extras);
    }

    sentry.captureException(reportedError);
  });
};
