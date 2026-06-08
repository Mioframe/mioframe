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
  toSentryDiagnosticCaptureContext,
} from './reportDiagnosticEvent';
export { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
export { captureDiagnosticException } from './captureDiagnosticException';
export type { DiagnosticExceptionContext } from './captureDiagnosticException';
export { addTechnicalBreadcrumb } from './addTechnicalBreadcrumb';
export type { AddTechnicalBreadcrumbParams } from './addTechnicalBreadcrumb';

// Diagnostics runtime public API — app and worker bootstrap only.
// `sentryFacade`, `useSentry`, and `ensureSentry` are internal; import them
// directly from `./sentryRuntime` when bootstrap code needs them.
export {
  getSentryReportingState,
  isSentryConfigured,
  isSentryReportingEnabled,
  registerSentryConfig,
  sentryPlugin,
  setDiagnosticsRuntimeState,
} from './sentryRuntime';
export type { SentryConfig, SentryFacade } from './sentryRuntime';
export type { SentryReportingState, SentryRuntimeState } from './sentryRuntimeState';
export { getOrCreateSentrySessionId, isSessionSentryUserId } from './sentrySession';
