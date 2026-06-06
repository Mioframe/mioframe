# Diagnostics

This document describes when to emit diagnostic events, how to use the project diagnostic layer, and the privacy rules that apply.

---

## Observability backend

Sentry is the observability backend. The project builds a thin privacy wrapper over it — never a parallel framework.

There is one shared diagnostics/Sentry runtime: `src/shared/lib/setupSentry.ts`. Both main thread and worker initialize Sentry through this same module. The worker has a thin entry-point adapter that registers static config; all SDK state (facade, reporting state, session identity, beforeSend) is shared.

Product code must never import `@sentry/vue` directly. Use project wrappers instead.

---

## Project wrappers

| Wrapper                                      | Purpose                                               |
| -------------------------------------------- | ----------------------------------------------------- |
| `reportDiagnosticEvent(event)`               | Structured state observations without an Error object |
| `captureDiagnosticException(error, context)` | Caught Error with useful stack trace                  |
| `reportHandledError(error, options)`         | Unexpected handled exceptions                         |

`reportDiagnosticEvent` uses `captureMessage`. `captureDiagnosticException` uses `captureException`. `reportHandledError` uses `captureException`.

Use `captureException` when a real Error object and stack are useful for diagnosis. Use `captureMessage` (via `reportDiagnosticEvent`) for structured state observations without an Error.

---

## Main thread and worker initialization

Both runtimes call `registerSentryConfig` on the shared `setupSentry` module. Only dynamic runtime state is passed from main to worker.

### Static config (imported directly in both runtimes — never passed through proxy)

- `SENTRY_DSN`
- `APP_BUILD_ID` / `APP_VERSION`

### Main thread

```ts
// src/app/setupApp.ts
app.use(sentryPlugin, { dsn: SENTRY_DSN, enabled: import.meta.env.PROD, release: ... });
```

### Worker entry point

```ts
// src/shared/service/serviceWorker.ts
registerSentryConfig({ dsn: SENTRY_DSN, enabled: import.meta.env.PROD, release: ..., defaultIntegrations: false });
```

`defaultIntegrations: false` is the only allowed runtime difference — it suppresses DOM integrations that would throw in a worker context.

### Dynamic state (synced from main to worker)

Only these two values are synced:

- Session-scoped user ID
- Reporting state: `unknown` | `enabled` | `disabled`

The main thread syncs state via the `sentryWorkerSync` proxyService channel, which calls `setDiagnosticsRuntimeState` on the worker's shared runtime module. Worker Sentry starts with reporting state `unknown` and queues events until the first sync.

---

## Session-scoped user identity

A privacy-safe session ID is generated once per page load:

- Generated with `crypto.randomUUID()` via `getOrCreateSentrySessionId()` in `src/shared/lib/sentry/sentrySession.ts`
- Format: `session:<uuid>` (so `beforeSend` can verify the origin)
- Stored in memory only — resets on page reload
- Shared between main and worker via the runtime state sync

`beforeSend` keeps only `user.id` with a valid `session:` prefix. All other user fields are stripped.

Forbidden user data:

- email, username, IP address
- installation ID, account ID, device ID
- any long-term stable identifier

---

## Two-layer diagnostics model

The diagnostics system uses two layers.

### 1. Generic diagnostics core

`src/shared/lib/diagnostics` provides reusable infrastructure:

- `reportDiagnosticEvent` and the async queue/flush mechanism
- `captureDiagnosticException` — for real caught errors with useful stacks
- `sanitizeDiagnosticError`
- in-memory test sink (`setDiagnosticEventSink`)
- generic event model (`DiagnosticEvent`)
- generic enums (`DiagnosticSeverity`, `DiagnosticResult`, `DiagnosticClassification`)
- safe tag and counter types

The core must not know about specific flows.

### 2. Flow-specific diagnostic wrappers

Each instrumented flow defines its own local wrapper module near the flow:

- `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.ts` — browser write-access recovery flow
- `src/shared/service/repositories/repositoriesDiagnostics.ts` — repository save/remove/cleanup flow

A wrapper:

- defines project-controlled event names (e.g. `'repositoryStorage.deleteFailed'`)
- maps flow outcomes to the generic `result` and `classification` enums
- attaches flow-specific `safeTags` such as `provider` and `operation`
- exposes short named functions so call sites stay short

**Rule: do not add flow-specific values to the shared core. Create a local `*Diagnostics.ts` module near the flow instead.**

---

## Concepts

### Four distinct categories

| Concept                    | Purpose                                          | API                                  |
| -------------------------- | ------------------------------------------------ | ------------------------------------ |
| **User-facing error**      | Tells the user what failed and what to do        | `DomainError.message` rendered in UI |
| **Domain result**          | Typed, structured outcome of an operation        | Return value from service/entity     |
| **Handled exception**      | Unexpected internal failure reported to Sentry   | `reportHandledError`                 |
| **Diagnostic event**       | Structured async/status/recovery observation     | `reportDiagnosticEvent`              |
| **Exception with context** | Real Error with stack — storage/provider failure | `captureDiagnosticException`         |

---

## When to emit a diagnostic event

You **must** emit for:

- Any user-visible persistent error that cannot be dismissed by normal UX.
- A failed save, open, delete, or rename when recovery was attempted and failed.
- A failed access-recovery flow (stale request, permission denied, still blocked after grant).
- A failed save-replay after a successful access grant.
- A storage failure after permission was recovered.
- A worker, service-worker, or background operation failure.
- Any data-consistency risk (e.g. pending saves that could not be flushed).
- Repository storage remove or cleanup failures.

Do **not** emit for:

- Cancelled file picker.
- Permission denial where the app remains functional.
- Ordinary validation errors caught and shown by form or input UI.
- Expected transient states already tracked in entity/service state.
- Progress steps within a single operation.

---

## `captureDiagnosticException` usage

Use when a real `Error` is available and the stack trace helps diagnosis:

```ts
import { captureDiagnosticException, sanitizeDiagnosticError } from '@shared/lib/diagnostics';

try {
  await vfs.delete(path);
} catch (error) {
  const sanitized = sanitizeDiagnosticError(error);
  reportDiagnosticEvent({ ..., error: sanitized });

  if (error instanceof Error) {
    captureDiagnosticException(error, {
      operation: 'repositoryDeleteCleanup',
      errorClass: sanitized.errorClass,
      errorClassification: sanitized.errorClassification,
    });
  }

  throw error;
}
```

The `context` parameter maps to the `diagnostic` Sentry context and is sanitized by `beforeSend`. Never pass paths, document ids, file names, storage keys, or raw error messages.

---

## API

All generic diagnostics infrastructure is in `src/shared/lib/diagnostics`.

### `reportDiagnosticEvent(event: DiagnosticEvent)`

The only project-level API for structured diagnostic events. Call only from wrapper modules or service boundaries — never directly from features, entities, widgets, pages, or low-level providers.

- Fire-and-forget, never throws into product code.
- Respects Sentry consent state (`unknown`, `enabled`, `disabled`).
- Writes to an optional in-memory test sink set via `setDiagnosticEventSink`.
- Uses Sentry `captureMessage` as the transport; callers must not import Sentry directly.
- **Dedupe/rate-limit:** repeated identical events are sent at most once per 30 seconds.

### `captureDiagnosticException(error, context, scopeTags?)`

Reports a real caught Error to Sentry as an exception with stack trace.

- Fire-and-forget, never throws into product code.
- Context is set as the `diagnostic` Sentry context key and sanitized by `beforeSend`.
- Use only for real `Error` objects where the stack trace helps diagnosis.
- Do not use instead of `reportDiagnosticEvent` for structured state observations.

### `sanitizeDiagnosticError(error: unknown): SanitizedDiagnosticError`

Converts an unknown boundary error into safe structured data. Never copies raw `error.message`.

### `setDiagnosticEventSink(sink: DiagnosticEvent[] | undefined)`

Sets an in-memory array for test capture. Use only in unit tests.

---

## beforeSend privacy boundary

The `createBeforeSend` function in `src/shared/lib/sentry/sanitizeSentryEvent.ts` is the client-side privacy boundary shared by main thread and worker.

### What `beforeSend` drops

- `request` — always stripped entirely
- `breadcrumbs` — stripped entirely (explicit technical breadcrumbs can be re-enabled in a later pass)
- Unknown `contexts` names — only `diagnostic`, `operation`, and `storage` are kept
- Unknown fields within kept contexts — only whitelisted fields survive
- `user` fields other than a valid `session:`-prefixed `id`
- Unknown `tags` — only the project `SAFE_EVENT_TAG_KEYS` survive
- Unknown `extra` fields — only the project allowlists survive

### Allowed context names

`diagnostic`, `operation`, `storage`

### Allowed context fields

`attemptId`, `flow`, `operation`, `storageOperation`, `provider`, `result`, `classification`, `failureClassification`, `errorClass`, `domExceptionName`, `vfsErrorCode`, `domainErrorCode`, `errorClassification`, `runtime`, `pendingCount`, `flushedCount`, `failedCount`

Forbidden in all contexts: paths, file names, document ids, document names, storage keys, URLs, raw error messages, raw causes, bytes, document contents, user-entered text.

---

## Generic event contract fields

| Field            | Type                       | Required | Description                                                                |
| ---------------- | -------------------------- | -------- | -------------------------------------------------------------------------- |
| `name`           | `string`                   | Yes      | Dot-separated project-controlled constant                                  |
| `severity`       | `DiagnosticSeverity`       | Yes      | `Info`, `Warning`, `Error`, or `Fatal`                                     |
| `result`         | `DiagnosticResult`         | Yes      | `Success`, `Failed`, `Blocked`, `Denied`, `Stale`, or `Unknown`            |
| `classification` | `DiagnosticClassification` | Yes      | `Access`, `Storage`, `Provider`, `Consistency`, `Unexpected`, or `Unknown` |
| `attemptId`      | `string`                   | No       | `crypto.randomUUID()` only — never user data                               |
| `counters`       | `DiagnosticCounters`       | No       | Safe numeric counters only                                                 |
| `error`          | `SanitizedDiagnosticError` | No       | Output of `sanitizeDiagnosticError`                                        |
| `safeTags`       | `DiagnosticSafeTags`       | No       | Project-controlled primitive string tags                                   |

---

## Source maps and release

Source maps are uploaded for `production` and `isPreview` builds via the Sentry Vite plugin in `config/plugins/sentry.ts`.

The `release` string is derived from `VITE_BUILD_ID` (GitHub SHA for CI builds) and passed to both:

- The Sentry Vite plugin (`release.name`) so uploaded artifacts are tagged
- The runtime Sentry `init` call (`release` option) so events reference the same release

When `VITE_BUILD_ID` is empty (local dev), the plugin falls back to auto-detection (git SHA) and the runtime uses `APP_VERSION` as the release string.

**Rule:** Never hardcode a release string. Always derive it from `APP_BUILD_ID` / `APP_VERSION` at runtime and from `buildId` / git SHA at build time.

Source maps are generated in the build only when the Sentry plugin is active. Worker bundle source maps are included in the upload.

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
| `@sentry/vue` directly                     | Forbidden in all product code — use project wrappers                  |

---

## Consent lifecycle

`useDiagnosticsReporting` (in `src/features/diagnosticsReporting`) manages both the handled-error queue and the diagnostic event queue, and syncs state to the worker:

- When reporting becomes **enabled**: calls `setDiagnosticsRuntimeState({ sessionId, reportingState: 'enabled' })`, syncs state + session ID to worker, then flushes both queues.
- When reporting becomes **disabled** or Sentry is **unconfigured**: calls `setDiagnosticsRuntimeState({ ..., reportingState: 'disabled' })`, syncs to worker, clears both queues.
- State `unknown`: `setDiagnosticsRuntimeState({ ..., reportingState: 'unknown' })` synced to worker so the worker also holds events.

The worker's `sentryWorkerSync` service receives the state and also flushes/clears the worker's diagnostic event queue via `flushQueuedDiagnosticEvents` / `clearQueuedDiagnosticEvents` after calling `setDiagnosticsRuntimeState`.

---

## Tests

Every diagnostic wrapper and every new `reportDiagnosticEvent` call must be covered by a focused unit test that:

- Uses `setDiagnosticEventSink` to capture events without mocking Sentry.
- Asserts `name`, `result`, and `classification`.
- Asserts `safeTags` contains only project-controlled values.
- Asserts `attemptId` is a UUID string and never contains user data.
- Asserts that no path, id, file name, key, or raw external message appears in the event.

For `captureDiagnosticException`, mock Sentry at the wrapper boundary and assert:

- `captureException` is called with the correct Error.
- The `diagnostic` context contains only safe fields.
- No path/id/name/storage key/raw message appears in the context.

---

## Required Sentry project settings

Configure these server-side settings in the Sentry project:

- **Do not enable "Store default PII"** — client-side `beforeSend` already prevents PII, but server-side setting is a defense in depth.
- **Scrub common sensitive fields** via Sentry's Data Scrubbing settings: email, username, IP, session cookies, auth tokens.
- **IP collection**: ensure "Store IP Addresses" is disabled.
- **Do not rely solely on server-side scrubbing** — `beforeSend` is the primary boundary.

---

## Reference files

- Generic core: `src/shared/lib/diagnostics/`
- Core implementation: `src/shared/lib/diagnostics/reportDiagnosticEvent.ts`
- Exception wrapper: `src/shared/lib/diagnostics/captureDiagnosticException.ts`
- Sentry shared foundation: `src/shared/lib/sentry/`
  - `sanitizeSentryEvent.ts` — shared `beforeSend` sanitizer
  - `createSentryOptions.ts` — shared init options builder
  - `sentrySession.ts` — session-scoped user ID
  - `sentryRuntimeState.ts` — shared state types
- Shared diagnostics runtime (main + worker): `src/shared/lib/setupSentry.ts`
  - `registerSentryConfig` — registers static config (both runtimes)
  - `setDiagnosticsRuntimeState` — applies dynamic session ID + reporting state
  - `useSentry` / `ensureSentry` — stable facade (both runtimes)
  - `sentryPlugin` — Vue plugin for main thread
- Worker state sync: `src/shared/service/sentryWorkerSync.ts`
- Worker entry point: `src/shared/service/serviceWorker.ts`
- Write-access recovery wrapper: `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.ts`
- Repository save/remove wrapper: `src/shared/service/repositories/repositoriesDiagnostics.ts`
- Consent lifecycle: `src/features/diagnosticsReporting/useDiagnosticsReporting.ts`
- Build-time Sentry plugin: `config/plugins/sentry.ts`
