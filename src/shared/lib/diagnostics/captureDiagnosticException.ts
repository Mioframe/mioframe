import { useSentry } from '@shared/lib/setupSentry';
import type { SanitizedDiagnosticError } from './DiagnosticEvent';

/**
 * Safe technical context attached to a diagnostic exception.
 * All fields must be project-controlled — no paths, ids, names, URLs, or user data.
 */
export interface DiagnosticExceptionContext {
  /** The operation or flow that produced the exception. */
  operation?: string;
  /** Safe error class derived from `sanitizeDiagnosticError`. */
  errorClass?: SanitizedDiagnosticError['errorClass'];
  /** `DOMException.name` when the error is a `DOMException`. */
  domExceptionName?: string;
  /** `VfsError.code` when the error is a `VfsError`. */
  vfsErrorCode?: string;
  /** `DomainError.code` when the error is a `DomainError`. */
  domainErrorCode?: string;
  /** Safe error classification. */
  errorClassification?: SanitizedDiagnosticError['errorClassification'];
  /** Runtime context: `'main'` or `'worker'`. */
  runtime?: 'main' | 'worker';
}

/**
 * Reports a caught Error to Sentry as a real exception (with stack trace).
 * Use this when a real `Error` object is available and the stack is useful for diagnosis.
 * For structured state observations without an Error, use `reportDiagnosticEvent` instead.
 *
 * The context is set via Sentry scope and sanitized by `beforeSend`. Never pass paths,
 * document ids, file names, storage keys, raw error messages, or user-controlled values.
 *
 * Product code must not import `@sentry/vue` directly. Use this wrapper instead.
 * @param error - The caught Error to report. Must be a real Error with a useful stack.
 * @param context - Safe technical context for the `diagnostic` Sentry context key.
 * @param scopeTags - Optional additional safe tags to attach.
 */
export const captureDiagnosticException = (
  error: Error,
  context: DiagnosticExceptionContext,
  scopeTags?: Record<string, string>,
): void => {
  try {
    const sentry = useSentry();

    sentry.withScope((scope) => {
      scope.setTag('handled', 'true');

      if (scopeTags) {
        for (const [key, value] of Object.entries(scopeTags)) {
          scope.setTag(key, value);
        }
      }

      // Set as a `diagnostic` context — sanitized by `beforeSend` to keep only safe fields.
      const diagnosticCtx: Record<string, unknown> = {};
      if (context.operation !== undefined) diagnosticCtx.operation = context.operation;
      if (context.errorClass !== undefined) diagnosticCtx.errorClass = context.errorClass;
      if (context.domExceptionName !== undefined)
        diagnosticCtx.domExceptionName = context.domExceptionName;
      if (context.vfsErrorCode !== undefined) diagnosticCtx.vfsErrorCode = context.vfsErrorCode;
      if (context.domainErrorCode !== undefined)
        diagnosticCtx.domainErrorCode = context.domainErrorCode;
      if (context.errorClassification !== undefined)
        diagnosticCtx.errorClassification = context.errorClassification;
      if (context.runtime !== undefined) diagnosticCtx.runtime = context.runtime;

      if (Object.keys(diagnosticCtx).length > 0) {
        scope.setContext('diagnostic', diagnosticCtx);
      }

      sentry.captureException(error);
    });
  } catch {
    // Fire-and-forget: must not propagate into product call stacks.
  }
};
