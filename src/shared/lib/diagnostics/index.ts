export type { DiagnosticCounters, DiagnosticEvent, DiagnosticSafeTags } from './DiagnosticEvent';
export { DiagnosticClassification, DiagnosticResult, DiagnosticSeverity } from './diagnosticEnums';
export {
  clearQueuedDiagnosticEvents,
  flushQueuedDiagnosticEvents,
  reportDiagnosticEvent,
} from './reportDiagnosticEvent';
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
  registerSentryBackend,
  registerSentryConfig,
  sentryPlugin,
  setDiagnosticsRuntimeState,
} from './sentryRuntime';
export type { SentryBackendLoader, SentryBackendModule, SentryConfig } from './sentryRuntime';
// `registerLazyVueSentryBackend` (sentryVueBackend.ts) is deliberately NOT re-exported
// here: it contains the lazy `import('@sentry/vue')` call, and this barrel is imported
// by the managed Service Worker, whose bundle must never contain that dynamic import.
// Main-thread and DedicatedWorker bootstraps import it directly from
// `@shared/lib/diagnostics/sentryVueBackend` instead.
export type { SentryReportingState } from './sentryRuntimeState';
export { getOrCreateSentrySessionId, isSessionSentryUserId } from './sentrySession';

// Local-settings diagnostics-consent storage contract — shared by `useLocalSettings.ts`
// and the managed Service Worker's own persisted-policy reader so both read/derive
// consent identically without duplicating field names, defaults, or policy mapping.
export {
  deriveDiagnosticsPolicy,
  LOCAL_SETTINGS_STORAGE_KEY,
  localSettingsDiagnosticsFieldsShape,
  zodLocalSettingsDiagnosticsFields,
} from './localSettingsDiagnosticsContract';
export type { LocalSettingsDiagnosticsFields } from './localSettingsDiagnosticsContract';
export { readPersistedDiagnosticsPolicy } from './readPersistedDiagnosticsPolicy';
export {
  DIAGNOSTICS_POLICY_SYNC_MESSAGE_TYPE,
  zodDiagnosticsPolicySyncMessage,
} from './diagnosticsPolicySyncMessage';
export type { DiagnosticsPolicySyncMessage } from './diagnosticsPolicySyncMessage';
export { DIAGNOSTICS_DRAIN_TIMEOUT_MS, drainDiagnostics } from './drainDiagnostics';
