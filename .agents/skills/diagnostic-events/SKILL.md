---
name: diagnostic-events
description: 'Use this skill when adding, reviewing, or testing observability code: Sentry breadcrumbs, diagnostic events, captured exceptions, optional logs, sanitization, consent-aware delivery, or diagnostic wrapper modules.'
---

# Diagnostic events skill

Use this skill before adding, reviewing, or testing any observability code: `addTechnicalBreadcrumb`, `reportDiagnosticEvent`, `captureDiagnosticException`, `reportHandledError`, optional Sentry Logs wrappers, diagnostic sanitizer changes, Sentry runtime changes, or diagnostic wrapper modules.

## Core principle

Sentry is the observability backend. The project keeps only a thin privacy and consent wrapper over Sentry primitives. Do not build a parallel telemetry framework.

Observability must be:

- optional: safe when Sentry is not configured or not loaded;
- consent-aware: no delivery when reporting is disabled;
- fire-and-forget: never changes product behavior or recovery behavior;
- privacy-safe: no paths, names, document ids, storage keys, URLs, raw messages, handles, bytes, or user text;
- thin: no flow-specific diagnostic state machines, large summary interfaces, or growing lists of domain-specific flags.

If diagnosing a flow requires many new fields in shared diagnostic interfaces, use technical breadcrumbs or a compact terminal event instead.

## Sentry primitives in this project

| Need | Preferred primitive | Project wrapper |
| --- | --- | --- |
| Technical history before a later failure | Breadcrumb | `addTechnicalBreadcrumb` |
| Terminal structured state without stack | Message event | `reportDiagnosticEvent` |
| Caught `Error` where stack helps | Exception event | `captureDiagnosticException` |
| Unexpected handled exception | Exception event | `reportHandledError` |
| Searchable diagnostic journal in diagnostic mode | Sentry Logs | a small local wrapper only if explicitly introduced |

Never import `@sentry/vue` directly in product code. Product code uses project wrappers only.

## Breadcrumbs first for behavior history

Use breadcrumbs for project-controlled technical milestones that explain a later terminal event.

Good breadcrumb cases:

- repository save started;
- save queued;
- pending-save replay started or completed;
- write-access recovery started;
- browser permission prompt started and resolved;
- file write step such as handle lookup, file create, writable open, cleanup attempt;
- worker diagnostics state applied;
- Sentry runtime initialized.

Do not use breadcrumbs for:

- user clicks, input, navigation, or behavior tracking;
- arbitrary metadata dumps;
- raw errors or raw browser messages;
- paths, file names, document names, document ids, Automerge storage keys, URLs, bytes, handles, or user-entered text;
- terminal failure details that are already captured by the terminal diagnostic event or exception.

Breadcrumb data must be narrow and allowlisted. Prefer short scalar values such as `operation`, `provider`, `result`, `step`, `failureClassification`, `errorClass`, `domExceptionName`, `vfsErrorCode`, `pendingCount`, `flushedCount`, and `runtime`.

Breadcrumbs are accepted only while reporting state is `enabled`. `unknown` and `disabled` states must not accumulate breadcrumbs for future delivery.

## Terminal events stay compact

Emit diagnostic events at terminal or abnormal states, not for every progress step.

Good event cases:

- stale or missing access request when recovery is attempted;
- permission denied after a write-access prompt when writes remain blocked;
- still-blocked state after recovery flush;
- storage failure after a grant;
- save-replay failure after a grant;
- failed flush with non-zero pending count;
- unexpected provider or service boundary errors;
- repository storage remove or cleanup failures;
- consistency risks such as orphaned pending saves or rollback failures.

Do not emit diagnostic events for:

- cancelled file picker;
- cancelled permission prompt where the app remains valid;
- ordinary validation errors handled by UX;
- expected transient states represented in service/entity state;
- progress steps that are already represented as breadcrumbs.

A diagnostic event should answer only:

- what operation failed;
- where it failed at a coarse level;
- whether it was access, storage, provider, consistency, or unexpected;
- whether recovery succeeded, failed, was blocked, denied, stale, or unknown;
- safe counters such as pending/flushed/failed counts;
- sanitized error class/code if a boundary error exists.

Do not encode the whole operation history as event fields.

## Logs are optional and controlled

Sentry Logs are not a replacement for breadcrumbs or compact terminal events. Introduce a logs wrapper only when a task explicitly needs searchable diagnostic logs.

If logs are enabled:

- keep them behind runtime/build diagnostics configuration;
- prefer one wide log at operation failure over many scattered logs;
- use the same privacy sanitizer and scalar data rules as breadcrumbs;
- never log paths, names, ids, keys, URLs, raw messages, handles, bytes, or user text;
- do not make product behavior depend on log delivery.

## Consent and runtime lifecycle

The diagnostics layer must behave correctly when Sentry is not configured, not loaded, or reporting is not yet allowed.

Expected behavior:

| Runtime state | Breadcrumbs | Diagnostic events / exceptions | Logs |
| --- | --- | --- | --- |
| `enabled` | send through Sentry facade | send through Sentry facade | send only if logs are configured |
| `unknown` | drop | bounded queue for terminal events only | drop |
| `disabled` | drop | clear/drop | drop |
| Sentry unconfigured | no-op except test sink | no-op except test sink | no-op |

Call sites must not branch on Sentry state or consent. The wrapper owns this behavior.

## Architecture boundaries

Allowed to call `reportDiagnosticEvent` or `captureDiagnosticException`:

- `src/shared/service/**` at service boundaries after recovery/flush outcomes are known;
- `src/shared/serviceClient/**` at main-thread broker boundaries through local wrappers.

Allowed to add technical breadcrumbs through a narrow callback or wrapper:

- service and service-client boundaries;
- low-level adapters/providers only when passed an optional technical breadcrumb callback by their owner.

Must not call Sentry, `reportDiagnosticEvent`, or `captureDiagnosticException` directly:

- `src/shared/lib/**` adapters/providers;
- `src/entities/**`;
- `src/features/**`;
- `src/widgets/**`;
- `src/pages/**`.

Providers may return structured results or call an injected `onDiagnosticStep` callback for breadcrumbs. They must not know Sentry event shape, issue grouping, tags, queues, or consent state.

## Shared vs flow-specific wrappers

The shared diagnostics core may contain only generic Sentry facade helpers, sanitizers, queue/flush behavior, test sinks, and generic enums.

Flow-specific wrapper modules may expose short named functions near the owning flow. They should map flow results to generic event fields and add only a small set of safe tags.

Do not add flow-specific stages, retry modes, handle sources, stream states, or other domain-specific state-machine values to shared diagnostic types. Put step-level details in breadcrumbs or logs instead.

## Privacy rules

Forbidden everywhere in diagnostics:

- absolute or relative paths;
- file names;
- document names;
- document ids;
- Automerge storage keys;
- URLs;
- raw external/browser error messages;
- raw causes;
- file contents or bytes;
- handles, provider objects, callbacks, capabilities, credentials, clients;
- user-entered text;
- long-term user/device/account identifiers.

Allowed values are project-controlled short strings, booleans, small integers, known error class names, DOMException names, VFS error codes, domain error codes, and generated attempt IDs.

`attemptId` must be generated with `crypto.randomUUID()` and must never be derived from user data.

## Sanitized errors

Always sanitize unknown boundary errors before attaching them:

```ts
reportDiagnosticEvent({
  ...,
  error: sanitizeDiagnosticError(caughtError),
});
```

`sanitizeDiagnosticError` must not copy raw `error.message` from browser APIs, storage, network, Automerge, VFS, or other external sources.

Use `captureDiagnosticException` only when the original value is an `Error` and stack trace is useful. Its context must remain compact and sanitized.

## Testing

Diagnostic tests must verify behavior and privacy, not Sentry internals.

For `reportDiagnosticEvent`, use `setDiagnosticEventSink`:

- assert stable event name, result, classification, and small safe tags;
- assert counters are safe integers;
- assert `attemptId` is a UUID when present;
- assert no path, name, document id, storage key, URL, raw message, handle, or user text appears.

For breadcrumbs, test the wrapper or sanitizer when new categories or data keys are introduced:

- accepted technical breadcrumbs survive in `enabled` state;
- breadcrumbs are dropped in `unknown` and `disabled` states;
- unknown categories and data keys are dropped;
- private-looking values are removed or the breadcrumb is dropped.

For `captureDiagnosticException`, mock the Sentry facade boundary and assert:

- `captureException` receives the original `Error`;
- `contexts.diagnostic` contains only allowed fields;
- tags are allowlisted;
- no private data appears.

For optional logs, test the local wrapper only if logs are introduced or changed.

## Anti-patterns

Do not introduce:

- a custom timeline object when breadcrumbs or logs are sufficient;
- flow-specific diagnostic summary protocols with many fields;
- broad union types of every internal step in shared diagnostics;
- direct Sentry imports in product code;
- domain logic that branches on reporting state;
- diagnostics that affect retry, rollback, permission prompts, or user-visible behavior;
- long-lived local telemetry buffers;
- breadcrumbs/logs that track user behavior.

## Reference files

- Generic core: `src/shared/lib/diagnostics/`
- Sentry shared foundation: `src/shared/lib/sentry/`
- Shared diagnostics runtime: `src/shared/lib/setupSentry.ts`
- Runtime effects registry: `src/shared/lib/diagnosticsRuntimeEffects.ts`
- Worker state sync: `src/shared/service/sentryWorkerSync.ts`
- Consent lifecycle: `src/features/diagnosticsReporting/useDiagnosticsReporting.ts`
- Policy doc: `docs/diagnostics.md`
