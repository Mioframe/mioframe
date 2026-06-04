export type {
  DiagnosticCounters,
  DiagnosticEvent,
  SanitizedDiagnosticError,
} from './DiagnosticEvent';
export {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticProviderKind,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticStage,
} from './diagnosticEnums';
export {
  clearQueuedDiagnosticEvents,
  flushQueuedDiagnosticEvents,
  reportDiagnosticEvent,
  setDiagnosticEventSink,
} from './reportDiagnosticEvent';
export { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
