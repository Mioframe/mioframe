import type { SafeDiagnosticDetails } from './safeDiagnosticDetails';
import { useSentry } from './sentryRuntime';

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
  /**
   * Optional safe structured details collected from the error (e.g. a provider boundary's
   * operation/phase/status). Merged as visible top-level fields into the Sentry `diagnostic`
   * context so they stay legible even when Sentry collapses nested cause messages.
   */
  safeDetails?: SafeDiagnosticDetails;
}

const NON_ERROR_MESSAGE = 'Captured non-error value';

const resolveError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error(NON_ERROR_MESSAGE);
};

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
 * Product code must not import `@sentry/vue` directly. Use this wrapper instead.
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
    const resolvedError = resolveError(error);
    const { operation, failureClassification, feature, action, safeDetails } = context ?? {};

    const diagnosticCtx: Record<string, unknown> = {};
    if (operation !== undefined) diagnosticCtx.operation = operation;
    if (failureClassification !== undefined)
      diagnosticCtx.failureClassification = failureClassification;
    if (safeDetails !== undefined) Object.assign(diagnosticCtx, safeDetails);

    const tags: Record<string, string> = {
      eventKind: 'handledException',
      ...scopeTags,
    };
    if (feature !== undefined) tags.feature = feature;
    if (action !== undefined) tags.action = action;

    useSentry().captureException(resolvedError, {
      tags,
      ...(Object.keys(diagnosticCtx).length > 0 ? { contexts: { diagnostic: diagnosticCtx } } : {}),
    });
  } catch {
    // Fire-and-forget: must not propagate into product call stacks.
  }
};
