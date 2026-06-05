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
  setDiagnosticEventForwarder,
  setDiagnosticEventSink,
} from './reportDiagnosticEvent';
export { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
