export type {
  DiagnosticCounters,
  DiagnosticEvent,
  DiagnosticSafeTags,
  SanitizedDiagnosticError,
} from './DiagnosticEvent';
export { DiagnosticClassification, DiagnosticResult, DiagnosticSeverity } from './diagnosticEnums';
export {
  clearQueuedDiagnosticEvents,
  flushQueuedDiagnosticEvents,
  reportDiagnosticEvent,
} from './reportDiagnosticEvent';
export { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
export { captureDiagnosticException } from './captureDiagnosticException';
export type { DiagnosticExceptionContext } from './captureDiagnosticException';
export { addTechnicalBreadcrumb } from './addTechnicalBreadcrumb';
export type { AddTechnicalBreadcrumbParams } from './addTechnicalBreadcrumb';

// Diagnostics runtime public API — app and worker bootstrap only.
// `sentryFacade`, `useSentry`, `ensureSentry`, `isSentryConfigured`, and runtime
// introspection helpers are internal and must not be imported by product, feature,
// or service code.
export {
  applyDiagnosticsRuntimeState,
  registerSentryConfig,
  sentryPlugin,
  setDiagnosticsRuntimeState,
} from './sentryRuntime';
export type { SentryConfig } from './sentryRuntime';
export type { SentryReportingState, SentryRuntimeState } from './sentryRuntimeState';
export { getOrCreateSentrySessionId, isSessionSentryUserId } from './sentrySession';
