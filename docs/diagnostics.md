# Diagnostics

This document describes when to emit diagnostic events, how to use the project diagnostic layer, and the privacy rules that apply.

---

## Two-layer model

The diagnostics system uses two layers.

### 1. Generic diagnostics core

`src/shared/lib/diagnostics` provides reusable infrastructure only:

- `reportDiagnosticEvent` and the async queue/flush mechanism;
- `sanitizeDiagnosticError`;
- in-memory test sink (`setDiagnosticEventSink`);
- generic event model (`DiagnosticEvent`);
- generic enums (`DiagnosticSeverity`, `DiagnosticResult`, `DiagnosticClassification`);
- safe tag and counter types.

The core must not know about specific flows (write-access recovery, pending saves, provider kinds, repository replay, etc.).

### 2. Flow-specific diagnostic wrappers

Each instrumented flow defines its own local wrapper module near the flow:

- `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.ts` — browser write-access recovery flow.

A wrapper:

- defines project-controlled event names (e.g. `'writeAccessRecovery.permissionDenied'`);
- maps flow outcomes to the generic `result` and `classification` enums;
- attaches flow-specific `safeTags` such as `provider` and `operation`;
- exposes short named functions so call sites do not manually assemble the full event.

**Rule: do not add flow-specific feature/operation/stage/provider values to the shared core. Create a local `*Diagnostics.ts` module near the flow instead.**

---

## Concepts

### Four distinct categories

| Concept               | Purpose                                        | API                                  |
| --------------------- | ---------------------------------------------- | ------------------------------------ |
| **User-facing error** | Tells the user what failed and what to do      | `DomainError.message` rendered in UI |
| **Domain result**     | Typed, structured outcome of an operation      | Return value from service/entity     |
| **Handled exception** | Unexpected internal failure reported to Sentry | `reportHandledError`                 |
| **Diagnostic event**  | Structured async/status/recovery observation   | `reportDiagnosticEvent`              |

Use `reportDiagnosticEvent` for structured async, status, or recovery flows where a typed observation is needed without an exception. Use `reportHandledError` for ordinary unexpected exceptions only. Do not pass structured recovery metadata to `reportHandledError`; use `reportDiagnosticEvent` through a wrapper instead.

`reportHandledError` accepts only `{ feature, action }` — there is no generic `metadata` field. This is intentional.

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
- Progress steps or intermediate states within a single operation — only emit at the terminal outcome.

---

## API

All generic diagnostics infrastructure is in `src/shared/lib/diagnostics`.

### `reportDiagnosticEvent(event: DiagnosticEvent)`

The only project-level API for structured diagnostic events. Call only from wrapper modules or service boundaries — never directly from features, entities, widgets, pages, or low-level providers.

- Fire-and-forget, never throws into product code.
- Respects Sentry consent state (`unknown`, `enabled`, `disabled`).
- Writes to an optional in-memory test sink set via `setDiagnosticEventSink`. The memory sink receives every event regardless of dedupe or consent state.
- Uses Sentry as the transport backend. Feature, service, provider, and UI code must not call Sentry directly.
- Sets the Sentry event level from `DiagnosticSeverity` so events appear at the correct severity in Sentry.
- Forwards `safeTags` entries as individual Sentry tags.
- **Dedupe/rate-limit:** repeated identical events (same `name`, `severity`, `result`, `classification`, `safeTags`, and error summary) are sent to Sentry at most once per 30 seconds. The `attemptId` field is excluded from the dedupe key so that loop failures with different attempt IDs are still deduplicated. The memory sink is never affected by dedupe.

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

### `setDiagnosticEventForwarder(forwarder)`

**Worker/service bootstrap only.** Registers a fire-and-forget forwarder that intercepts every `reportDiagnosticEvent` call and relays it to the main-thread diagnostics reporter (e.g. via the proxyService diagnostics channel). When a forwarder is set, the local Sentry delivery path is bypassed entirely.

Must be called **once** at the worker entry point before any diagnostic calls are made. See `setupWorkerDiagnosticsForwarder` in `src/shared/service/diagnosticsService.ts` for the canonical usage.

Must **not** be called from:

- main-thread product code;
- UI layers (`pages`, `widgets`, `features`, `entities`);
- low-level adapters or VFS providers;
- flow-specific `*Diagnostics.ts` wrapper functions — call `reportDiagnosticEvent` instead.

Pass `undefined` to remove the forwarder and restore local Sentry delivery.

### `flushQueuedDiagnosticEvents()`

Exported for use by `useDiagnosticsReporting` when consent is granted. Do not call from product code.

### `clearQueuedDiagnosticEvents()`

Exported for use by `useDiagnosticsReporting` when consent is revoked or Sentry is unconfigured. Do not call from product code.

---

## Generic event contract fields

All fields are project-controlled. No open-ended string or record metadata.

| Field            | Type                       | Required | Description                                                                                |
| ---------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `name`           | `string`                   | Yes      | Project-controlled dot-separated event name, e.g. `'writeAccessRecovery.permissionDenied'` |
| `severity`       | `DiagnosticSeverity`       | Yes      | `Info`, `Warning`, `Error`, or `Fatal`                                                     |
| `result`         | `DiagnosticResult`         | Yes      | `Success`, `Failed`, `Blocked`, `Denied`, `Stale`, or `Unknown`                            |
| `classification` | `DiagnosticClassification` | Yes      | `Access`, `Storage`, `Provider`, `Consistency`, `Unexpected`, or `Unknown`                 |
| `attemptId`      | `string`                   | No       | Project-generated UUID only — never derived from user data, paths, or ids                  |
| `counters`       | `DiagnosticCounters`       | No       | Safe numeric counters (`pendingCount`, `failedCount`, `flushedCount`)                      |
| `error`          | `SanitizedDiagnosticError` | No       | Output of `sanitizeDiagnosticError`                                                        |
| `safeTags`       | `DiagnosticSafeTags`       | No       | Project-controlled primitive string tags for flow context; no user data                    |

### Generic enum values

```ts
enum DiagnosticSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Fatal = 'fatal',
}

enum DiagnosticResult {
  Success = 'success',
  Failed = 'failed',
  Blocked = 'blocked',
  Denied = 'denied',
  Stale = 'stale',
  Unknown = 'unknown',
}

enum DiagnosticClassification {
  Access = 'access',
  Storage = 'storage',
  Provider = 'provider',
  Consistency = 'consistency',
  Unexpected = 'unexpected',
  Unknown = 'unknown',
}
```

Use PascalCase members in product code: `DiagnosticSeverity.Error`, `DiagnosticResult.Stale`, etc.

### Safe tags

`safeTags` is a `Record<string, string>` for flow-specific context. All keys and values must be project-controlled stable strings — no paths, ids, names, URLs, or user data.

Example from write-access recovery wrapper:

```ts
safeTags: { provider: 'webFileSystem', operation: 'requestAccess' }
```

**Adding a new safe tag key:** the key must also be added to `SAFE_EVENT_TAG_KEYS` in `src/shared/lib/setupSentry.ts` and covered by a `beforeSend` test in `setupSentry.test.ts`. Tags not in the whitelist are dropped before the event reaches Sentry.

### Allowed counters

- `pendingCount` — number of pending saves or items.
- `failedCount` — number of items that failed.
- `flushedCount` — number of items successfully flushed.

### Forbidden counter values

Do not include storage keys, document ids, file sizes, byte counts, paths, names, or any value derived from user data.

### Attempt ID

Use `attemptId` to correlate related events from the same recovery attempt:

```ts
const attemptId = crypto.randomUUID();
// Pass the same attemptId to all events within one requestAccess/recovery call.
```

Rules:

- Must be project-generated (e.g. `crypto.randomUUID()`).
- Must never be derived from path, space name, document id, storage key, handle, or any user data.
- Scope it locally to one operation call; do not use a global trace ID.

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

| Layer                                      | May call `reportDiagnosticEvent`?                                     |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `src/shared/service/**`                    | Yes — at service boundary only; use wrapper functions where available |
| `src/shared/serviceClient/**`              | Yes — through flow-specific wrappers only                             |
| `src/entities/**`                          | No — expose results to upper layers instead                           |
| `src/features/**`                          | No — use service client results                                       |
| `src/widgets/**`                           | No                                                                    |
| `src/pages/**`                             | No                                                                    |
| `src/shared/lib/**` adapters and providers | No — return structured results instead                                |
| Sentry directly                            | Forbidden in all product code                                         |

---

## Adding a new instrumented flow

1. Create a `*Diagnostics.ts` module next to the flow (e.g. `src/shared/serviceClient/foo/fooFlowDiagnostics.ts`).
2. Define event names as project-controlled string constants using dot-separated namespacing.
3. Expose short named functions for each event so call sites stay short.
4. Map flow outcomes to generic `DiagnosticResult` and `DiagnosticClassification` values.
5. Attach flow-specific context via `safeTags` — no open-ended metadata.
6. Add a focused test file for the wrapper.
7. Update this document and the `diagnostic-events` skill.

**Do not add new values to `DiagnosticResult`, `DiagnosticClassification`, or `DiagnosticSeverity` for flow-specific outcomes.** The generic enums are intentionally small. Flow-specific context belongs in `name` and `safeTags`.

---

## Consent lifecycle integration

`useDiagnosticsReporting` (in `src/features/diagnosticsReporting`) manages both the handled-error queue and the diagnostic event queue:

- When reporting becomes **enabled**: flushes both queues via `flushQueuedHandledReports()` and `flushQueuedDiagnosticEvents()`.
- When reporting becomes **disabled** or Sentry is **unconfigured**: clears both queues via `clearQueuedHandledReports()` and `clearQueuedDiagnosticEvents()`.

The diagnostic queue is safe: it never produces unhandled promise rejections even if Sentry initialization fails.

---

## Tests

Every diagnostic wrapper and every new `reportDiagnosticEvent` call must be covered by a focused unit test that:

- Uses `setDiagnosticEventSink` to capture events without mocking Sentry.
- Asserts the event `name`, `result`, and `classification`.
- Asserts `safeTags` contains only project-controlled values.
- Asserts `attemptId` is a UUID string for correlated events, and never contains user data.
- Asserts that no path, id, file name, key, or raw external message appears in the event or its fields.

See the reference files below for patterns.

---

## Reference files

- Generic core: `src/shared/lib/diagnostics/`
- Core implementation: `src/shared/lib/diagnostics/reportDiagnosticEvent.ts`
- Generic core tests: `src/shared/lib/diagnostics/reportDiagnosticEvent.test.ts`, `sanitizeDiagnosticError.test.ts`
- Worker-to-main-thread forwarder: `src/shared/service/diagnosticsService.ts`
- Forwarder tests: `src/shared/service/diagnosticsService.test.ts`
- Write-access recovery wrapper: `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.ts`
- Wrapper tests: `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.test.ts`
- Broker call sites: `src/shared/serviceClient/fileSystem/useFileSystemAccessPermissionBroker.ts`
- Service boundary calls: `src/shared/service/repositories/repositoriesService.ts`, `src/shared/service/repositories/repositoriesDiagnostics.ts`
- Sentry privacy boundary: `src/shared/lib/setupSentry.ts`
