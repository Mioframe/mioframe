export type {
  DiagnosticCounters,
  DiagnosticEvent,
  SanitizedDiagnosticError,
} from './DiagnosticEvent';
// Value exports carry both the runtime object and the type alias for callers that use
// `import type { DiagnosticSeverity }` — TypeScript re-exports the merged declaration.
export {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticStage,
} from './diagnosticEnums';
export {
  clearQueuedDiagnosticEvents,
  reportDiagnosticEvent,
  setDiagnosticEventSink,
} from './reportDiagnosticEvent';
export { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
