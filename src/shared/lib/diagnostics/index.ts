export type {
  DiagnosticCounters,
  DiagnosticEvent,
  DiagnosticSafeTags,
  SanitizedDiagnosticError,
} from './DiagnosticEvent';
export type {
  DiagnosticBreadcrumb,
  DiagnosticBreadcrumbCategory,
  DiagnosticBreadcrumbDataKey,
} from './DiagnosticBreadcrumb';
export { DiagnosticClassification, DiagnosticResult, DiagnosticSeverity } from './diagnosticEnums';
export {
  addDiagnosticBreadcrumb,
  clearQueuedDiagnosticEvents,
  flushQueuedDiagnosticEvents,
  reportDiagnosticEvent,
  setBreadcrumbForwarder,
  setDiagnosticEventForwarder,
  setDiagnosticEventSink,
} from './reportDiagnosticEvent';
export { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
