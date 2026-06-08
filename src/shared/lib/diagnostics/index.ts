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
  setDiagnosticEventSink,
} from './reportDiagnosticEvent';
export { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
export { captureDiagnosticException } from './captureDiagnosticException';
export type { DiagnosticExceptionContext } from './captureDiagnosticException';
export { addTechnicalBreadcrumb } from './addTechnicalBreadcrumb';
export type { AddTechnicalBreadcrumbParams } from './addTechnicalBreadcrumb';

// Diagnostics runtime setup — used by app bootstrap, features, and worker service only.
export {
  ensureSentry,
  getSentryReportingState,
  isSentryConfigured,
  isSentryReportingEnabled,
  registerSentryConfig,
  sentryFacade,
  sentryPlugin,
  setDiagnosticsRuntimeState,
  useSentry,
} from './sentryRuntime';
export type { SentryConfig, SentryFacade } from './sentryRuntime';
export type { SentryReportingState, SentryRuntimeState } from './sentryRuntimeState';
export { getOrCreateSentrySessionId, isSessionSentryUserId } from './sentrySession';
