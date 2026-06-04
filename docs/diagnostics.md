# Diagnostics

This document describes when to emit diagnostic events, how to use the project diagnostic layer, and the privacy rules that apply.

---

## Concepts

### Four distinct categories

| Concept               | Purpose                                        | API                                  |
| --------------------- | ---------------------------------------------- | ------------------------------------ |
| **User-facing error** | Tells the user what failed and what to do      | `DomainError.message` rendered in UI |
| **Domain result**     | Typed, structured outcome of an operation      | Return value from service/entity     |
| **Handled exception** | Unexpected internal failure reported to Sentry | `reportHandledError`                 |
| **Diagnostic event**  | Structured async/status/recovery observation   | `reportDiagnosticEvent`              |

Use `reportDiagnosticEvent` for structured async, status, or recovery flows where a typed observation is needed without an exception. Use `reportHandledError` for ordinary unexpected exceptions.

---

## When to emit a diagnostic event

You **must** emit a diagnostic event for:

- Any user-visible persistent error that cannot be dismissed by normal UX (e.g. save failure that blocks a space).
- A failed save, open, delete, or rename when recovery was attempted and failed.
- A failed access-recovery flow (stale request, permission denied, still blocked after grant).
- A failed save-replay after a successful access grant.
- A storage failure after permission was recovered.
- A worker, service-worker, or background operation failure.
- Any data-consistency risk (e.g. pending saves that could not be flushed).

### When NOT to emit a diagnostic event

Do **not** emit a diagnostic event for:

- Cancelled file picker.
- Permission denial where the app remains in a fully functional state and normal UX handles it.
- Ordinary validation errors caught and shown by form or input UI.
- Unsupported user input handled by standard UX copy.
- Expected transient states that are already tracked in entity/service state.

---

## API

All diagnostics are in `src/shared/lib/diagnostics`.

### `reportDiagnosticEvent(event: DiagnosticEvent)`

The only project-level API for structured diagnostic events.

- Fire-and-forget, never throws into product code.
- Respects Sentry consent state (`unknown`, `enabled`, `disabled`).
- Writes to an optional in-memory test sink set via `setDiagnosticEventSink`.
- Uses Sentry as the transport backend. Feature, service, provider, and UI code must not call Sentry directly.

```ts
import {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticStage,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';

reportDiagnosticEvent({
  severity: DiagnosticSeverity.error,
  feature: DiagnosticFeature.writeAccessRecovery,
  operation: DiagnosticOperation.requestAccess,
  stage: DiagnosticStage.accessRequestPrepare,
  result: DiagnosticResult.staleRequest,
  classification: DiagnosticClassification.staleRequest,
});
```

### `sanitizeDiagnosticError(error: unknown): SanitizedDiagnosticError`

Converts an unknown boundary error into safe structured data. Never copies raw `error.message`.

```ts
import { sanitizeDiagnosticError } from '@shared/lib/diagnostics';

reportDiagnosticEvent({
  ...,
  error: sanitizeDiagnosticError(caughtError),
});
```

### `setDiagnosticEventSink(sink: DiagnosticEvent[] | undefined)`

Sets an in-memory array that receives every `reportDiagnosticEvent` call. Use only in unit tests.

```ts
// In a test beforeEach:
const sink: DiagnosticEvent[] = [];
setDiagnosticEventSink(sink);

// In afterEach:
setDiagnosticEventSink(undefined);
```

---

## Event contract fields

All fields are project-controlled enum values. No open-ended string or record metadata.

| Field            | Type                       | Required | Description                                                           |
| ---------------- | -------------------------- | -------- | --------------------------------------------------------------------- |
| `severity`       | `DiagnosticSeverity`       | Yes      | `info`, `warning`, `error`, or `fatal`                                |
| `feature`        | `DiagnosticFeature`        | Yes      | Feature area (e.g. `writeAccessRecovery`)                             |
| `operation`      | `DiagnosticOperation`      | Yes      | Named operation within the feature                                    |
| `stage`          | `DiagnosticStage`          | Yes      | Stage within the operation                                            |
| `result`         | `DiagnosticResult`         | Yes      | Observed outcome                                                      |
| `classification` | `DiagnosticClassification` | Yes      | Root-cause classification                                             |
| `counters`       | `DiagnosticCounters`       | No       | Safe numeric counters (`pendingCount`, `failedCount`, `flushedCount`) |
| `error`          | `SanitizedDiagnosticError` | No       | Output of `sanitizeDiagnosticError`                                   |
| `providerKind`   | `string`                   | No       | Provider kind when useful (no user data)                              |
| `attemptId`      | `string`                   | No       | Project-generated id only                                             |

### Allowed counters

- `pendingCount` — number of pending saves or items.
- `failedCount` — number of items that failed.
- `flushedCount` — number of items successfully flushed.

### Forbidden counter values

Do not include storage keys, document ids, file sizes, byte counts, paths, names, or any value derived from user data.

---

## Privacy rules

### Sanitized error summary

Use `sanitizeDiagnosticError` for every error that comes from a browser API, storage, network, VFS, Automerge, Google API, Zod, or any external library before attaching it to a diagnostic event.

The sanitizer extracts:

- Safe error class (`DOMException`, `VfsError`, `DomainError`, `Error`, `unknown`).
- `DOMException.name` (browser-controlled, safe).
- `VfsError.code` (project enum, safe).
- `DomainError.code` (project-controlled string, safe).
- Safe error classification.

It never copies `error.message` from external boundary errors.

### What must never appear in a diagnostic event

- Paths, virtual paths, file names, folder names.
- Document names, document ids.
- Storage keys, cache keys.
- Raw external error messages or stack traces.
- File contents, document contents, or bytes.
- User-entered values, URLs, or query parameters.
- Google Drive file ids, IndexedDB keys, Automerge peer ids.

---

## Reporting layer policy

| Layer                                      | May call `reportDiagnosticEvent`?           |
| ------------------------------------------ | ------------------------------------------- |
| `src/shared/service/**`                    | Yes                                         |
| `src/shared/serviceClient/**`              | Yes (main-thread boundary only)             |
| `src/entities/**`                          | No — expose results to upper layers instead |
| `src/features/**`                          | No — use service client results             |
| `src/widgets/**`                           | No                                          |
| `src/pages/**`                             | No                                          |
| `src/shared/lib/**` adapters and providers | No — return structured results instead      |
| Sentry directly                            | Forbidden in all product code               |

---

## Adding new enums

When a new feature, operation, stage, result, or classification is needed:

1. Add the value to the relevant enum in `src/shared/lib/diagnostics/diagnosticEnums.ts`.
2. Re-export from `src/shared/lib/diagnostics/index.ts`.
3. Add a focused test that covers the new diagnostic event emission.
4. Update this document's event contract table.
5. Update the `diagnostic-events` skill if the new enum changes agent guidance.

---

## Tests

Every diagnostic event emission must be covered by a focused unit test that:

- Uses `setDiagnosticEventSink` to capture events without mocking Sentry.
- Asserts that the event has the expected `feature`, `operation`, `stage`, `result`, and `classification`.
- Asserts that no path, id, file name, key, or raw external message appears in the event or its counters.

See `src/shared/lib/diagnostics/reportDiagnosticEvent.test.ts` and `src/shared/lib/diagnostics/sanitizeDiagnosticError.test.ts` for the reference patterns.
