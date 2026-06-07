# Diagnostics

This document defines the Mioframe observability policy: what the app records about failures, how it uses Sentry, and what must never be reported.

---

## Goal

Diagnostics exist to answer operational questions after a real failure:

- what failed;
- where it failed at a coarse technical boundary;
- what technical milestones happened immediately before the failure;
- whether recovery was attempted and what the final outcome was;
- how often the same class of failure happens.

Diagnostics must not become application state, recovery logic, analytics, or a parallel telemetry framework.

---

## Observability backend

Sentry is the observability backend. The project keeps a thin privacy and consent wrapper over Sentry primitives. Product code must never import `@sentry/vue` directly.

The wrapper may use these Sentry primitives:

| Sentry primitive | Project use |
| --- | --- |
| Breadcrumbs | Technical history before a later terminal event |
| Message events | Compact structured diagnostic events without an `Error` stack |
| Exception events | Caught `Error` objects where stack trace helps diagnosis |
| Tags | Short searchable filters only |
| Contexts / extra | Compact sanitized details for the terminal event |
| Logs | Optional searchable diagnostic journal in diagnostic/preview mode only |

Do not introduce a custom timeline object, custom tracing layer, or flow-specific diagnostic state machine when breadcrumbs, compact events, or logs are sufficient.

---

## Shared runtime and consent

There is one shared diagnostics/Sentry runtime: `src/shared/lib/setupSentry.ts`. Both main thread and worker initialize Sentry through this module. Static configuration is imported in both runtimes. Dynamic reporting state and the session-scoped user id are synced from main to worker through `sentryWorkerSync`.

Sentry may be unconfigured, not loaded, disabled by user consent, or still waiting for the consent state. Product code must not care. Wrapper calls are fire-and-forget and must never throw into product code.

Expected behavior:

| Runtime state | Breadcrumbs | Diagnostic events / exceptions | Logs |
| --- | --- | --- | --- |
| `enabled` | delivered through Sentry facade | delivered through Sentry facade | delivered only when logs are configured |
| `unknown` | dropped | bounded queue for terminal events only | dropped |
| `disabled` | dropped | clear/drop | dropped |
| Sentry unconfigured | no-op except test sink | no-op except test sink | no-op |

Breadcrumbs must not be accumulated before consent. They are short-lived context attached to an event, not a hidden pre-consent activity log.

---

## Project wrappers

Generic diagnostics infrastructure lives in `src/shared/lib/diagnostics` and the Sentry facade lives under `src/shared/lib/sentry` / `src/shared/lib/setupSentry.ts`.

Use these project APIs instead of direct Sentry SDK calls:

| Wrapper | Purpose |
| --- | --- |
| `addTechnicalBreadcrumb(breadcrumb)` | Adds a safe technical breadcrumb when reporting is enabled |
| `reportDiagnosticEvent(event)` | Sends a compact structured terminal/status event through `captureMessage` |
| `captureDiagnosticException(error, context)` | Sends a caught `Error` with a sanitized diagnostic context through `captureException` |
| `reportHandledError(error, options)` | Reports unexpected handled exceptions |

If Sentry Logs are introduced, they must be wrapped by a small project helper with the same consent and privacy rules. Do not import or call `Sentry.logger` outside that wrapper.

---

## Breadcrumbs

Breadcrumbs are the preferred way to record technical behavior history before a later failure.

Good breadcrumb examples:

- repository save started;
- repository save queued;
- pending-save replay started or completed;
- write-access recovery started;
- browser permission prompt started and resolved;
- file write milestone such as handle lookup, file create, writable open, cleanup attempt;
- worker diagnostics state applied;
- Sentry runtime initialized.

Breadcrumbs are not terminal reports. They should explain a later diagnostic event or exception.

Do not use breadcrumbs for:

- user clicks, typing, navigation, or behavior tracking;
- arbitrary payload dumps;
- raw errors or raw browser messages;
- terminal failure details already represented by a terminal diagnostic event or exception;
- private data listed in the privacy section.

Breadcrumb data must be narrow and scalar. Use project-controlled strings, booleans, and small integers. Prefer keys such as `operation`, `provider`, `result`, `step`, `failureClassification`, `errorClass`, `domExceptionName`, `vfsErrorCode`, `pendingCount`, `flushedCount`, and `runtime`.

---

## Diagnostic events

Diagnostic events are compact terminal or abnormal state reports. Emit them when a real state transition matters for failure diagnosis or data safety.

Emit events for:

- stale or missing access request when recovery is attempted;
- permission denied after a write-access prompt while writes remain blocked;
- still-blocked state after a grant and replay attempt;
- storage failure after a grant;
- failed save replay after a grant;
- failed flush with non-zero pending count;
- unexpected provider or service boundary errors;
- repository storage remove or cleanup failures;
- consistency risks such as orphaned pending saves or failed rollback cleanup.

Do not emit events for:

- cancelled file picker;
- cancelled permission prompt where the app remains in a valid state;
- ordinary validation errors handled by UX;
- expected transient states represented in service/entity state;
- progress steps inside one operation.

A diagnostic event should answer only:

- operation;
- provider or coarse technical boundary;
- result;
- classification;
- failure classification when relevant;
- safe counters;
- sanitized error class/code if a boundary error exists.

Do not encode an entire operation history as event fields. Put history in breadcrumbs or, when explicitly enabled, logs.

---

## Exceptions with context

Use `captureDiagnosticException` only when a real `Error` object is available and stack trace helps diagnosis.

Pairing a compact diagnostic event with an exception is appropriate at storage or provider boundaries: the event describes the structured state, while the exception gives the stack.

The diagnostic context must remain compact. It may include safe fields such as `operation`, `provider`, `failureClassification`, `errorClass`, `domExceptionName`, `vfsErrorCode`, `domainErrorCode`, `errorClassification`, `runtime`, and safe counters. It must never include raw messages or private data.

---

## Logs

Sentry Logs are optional. They are not enabled by default policy and must not replace breadcrumbs or terminal events.

Introduce logs only when a task explicitly needs searchable diagnostic logs. If logs are used:

- keep them behind diagnostic/preview configuration;
- prefer one wide log at operation failure over many scattered logs;
- use the same sanitizer and privacy rules as breadcrumbs/events;
- never make application behavior depend on log delivery;
- never log paths, names, ids, keys, URLs, raw messages, handles, bytes, or user text.

---

## Layer ownership

| Layer | Observability responsibility |
| --- | --- |
| `src/shared/service/**` | May emit compact events/exceptions at service boundaries; use wrappers where available |
| `src/shared/serviceClient/**` | May emit through flow-specific wrappers at main-thread broker boundaries |
| `src/shared/lib/**` adapters/providers | Must not call Sentry/event APIs; may return structured results or call an injected breadcrumb callback |
| `src/entities/**` | Must not report; expose results to upper layers |
| `src/features/**` | Must not report; use service client results |
| `src/widgets/**` | Must not report |
| `src/pages/**` | Must not report |

Providers and adapters must not know Sentry event shape, issue grouping, tags, queues, consent state, or reporting runtime. They may expose typed failures or accept a narrow optional technical step callback supplied by their owner.

---

## Shared vs flow-specific code

The shared diagnostics core may contain only:

- Sentry facade helpers;
- consent-aware queue/flush behavior;
- sanitizers;
- test sinks;
- generic result/classification/severity types;
- small helper types for safe scalar data.

Flow-specific wrappers may live near the owning flow and expose short named functions. They map local outcomes to generic fields and safe tags.

Do not add flow-specific stages, retry modes, handle sources, stream lifecycle states, or other domain-specific state-machine values to shared diagnostics. Record step-level details as breadcrumbs or logs.

Adding a new diagnostic step should not require editing global interfaces.

---

## Privacy boundary

Forbidden everywhere in diagnostics, breadcrumbs, logs, tags, contexts, extras, and test sinks:

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

Allowed values:

- project-controlled short strings;
- booleans;
- small integers;
- known error class names;
- DOMException names;
- VFS error codes;
- domain error codes;
- generated attempt IDs.

Session identity is memory-only and session-scoped. `beforeSend` must keep only a valid `session:<uuid>` user id and strip all other user fields.

---

## Sanitized errors

Always sanitize boundary errors before attaching them to events or contexts.

```ts
reportDiagnosticEvent({
  ...,
  error: sanitizeDiagnosticError(caughtError),
});
```

`sanitizeDiagnosticError` must not copy raw `error.message` from browser APIs, storage, network, Automerge, VFS, or other external sources.

---

## Sentry privacy hooks

The shared runtime uses `beforeBreadcrumb` and `beforeSend` as the final client-side privacy boundary.

`beforeBreadcrumb` must:

- keep only project-controlled technical breadcrumbs;
- drop breadcrumbs while reporting state is `unknown` or `disabled`;
- drop automatic UI, click, navigation, fetch, and network breadcrumbs;
- drop unknown categories and unknown data keys;
- drop private-looking values.

`beforeSend` must:

- strip `request` entirely;
- sanitize breadcrumbs again;
- keep only allowlisted contexts, tags, extras, and user fields;
- drop unknown fields;
- enforce the same privacy rules in production and preview modes.

Preview mode may keep more safe technical breadcrumbs. It must never relax privacy rules.

---

## Tests

Diagnostic tests must verify wrapper behavior and privacy, not Sentry internals.

For diagnostic events:

- use `setDiagnosticEventSink` instead of mocking Sentry;
- assert stable event name, result, classification, and small safe tags;
- assert counters are safe integers;
- assert `attemptId` is a UUID when present;
- assert no path, name, document id, storage key, URL, raw message, handle, or user text appears.

For breadcrumbs:

- test the wrapper/sanitizer when adding categories or data keys;
- assert technical breadcrumbs survive only in `enabled` state;
- assert breadcrumbs are dropped in `unknown` and `disabled` states;
- assert unknown categories, unknown data keys, and private-looking values are dropped.

For captured exceptions:

- mock the Sentry facade boundary;
- assert the original `Error` is passed;
- assert `contexts.diagnostic` contains only allowed fields;
- assert no private data appears.

For logs:

- add tests only if logs are introduced or changed;
- assert logs are gated by configuration and use the same sanitizer.

---

## Anti-patterns

Do not introduce:

- a custom timeline object when breadcrumbs/logs are enough;
- flow-specific diagnostic summary protocols with many fields;
- broad union types for every internal step in shared diagnostics;
- direct Sentry imports in product code;
- domain logic that branches on reporting state;
- diagnostics that affect retry, rollback, permission prompts, or user-visible behavior;
- long-lived local telemetry buffers;
- breadcrumbs or logs that track user behavior;
- event fields that duplicate a breadcrumb history.

---

## Source maps and release

Source maps are uploaded for production and preview builds via the Sentry Vite plugin in `config/plugins/sentry.ts`.

The release string is derived from `VITE_BUILD_ID` / `APP_BUILD_ID` for CI builds and from `APP_VERSION` where appropriate. Never hardcode release strings.

Worker bundle source maps are included when the Sentry plugin is active.

---

## Required Sentry project settings

Configure these server-side settings in the Sentry project:

- Do not enable Store default PII.
- Scrub common sensitive fields such as email, username, IP, session cookies, and auth tokens.
- Ensure IP address storage is disabled.
- Do not rely solely on server-side scrubbing; client-side `beforeSend` is the primary boundary.

---

## Reference files

- Generic diagnostics core: `src/shared/lib/diagnostics/`
- Sentry shared foundation: `src/shared/lib/sentry/`
- Shared runtime: `src/shared/lib/setupSentry.ts`
- Runtime-effects registry: `src/shared/lib/diagnosticsRuntimeEffects.ts`
- Worker state sync: `src/shared/service/sentryWorkerSync.ts`
- Consent lifecycle: `src/features/diagnosticsReporting/useDiagnosticsReporting.ts`
- Diagnostic-events skill: `.agents/skills/diagnostic-events/SKILL.md`
