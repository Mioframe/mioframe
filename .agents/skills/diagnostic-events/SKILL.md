---
name: diagnostic-events
description: 'Use this skill when adding or reviewing project diagnostics.'
---

# Diagnostic Events Skill

Use this skill when adding or reviewing diagnostics in the application.

Diagnostics must help explain technical failures without exposing user data.

## Design principles

Keep the diagnostics layer **thin**:

- Do not build custom error classification models for Sentry. Pass the real `Error` object so native stack, mechanism, type, source maps, and Sentry grouping work correctly.
- Do not introduce allowlists that must be expanded for every new operation, provider, or diagnostic field.
- Do not add a parallel telemetry framework on top of Sentry.
- Do not let UI or feature layers know about main/worker runtime details.

Worker sync and session ID management are infrastructure. Feature code calls `applyDiagnosticsPolicy` and the service layer handles the rest.

## Goal

Use one of three diagnostics primitives:

- technical breadcrumb: record an important system step before a later failure;
- diagnostic event: report a compact terminal outcome or important failure state;
- diagnostic exception: report an undesirable or unexpected error branch where a stack trace is useful.

Do not use diagnostics as general logging, analytics, tracing, or product telemetry.

## Choose the right primitive

| Need                                                                     | Use                    |
| ------------------------------------------------------------------------ | ---------------------- |
| Show what technical steps happened before a failure                      | technical breadcrumb   |
| Report a terminal failure or important blocked state                     | diagnostic event       |
| Report an unexpected or undesirable caught error where stack trace helps | diagnostic exception   |
| Normal user cancellation or expected domain state                        | no exception           |
| User behavior analytics                                                  | do not add diagnostics |

## Technical breadcrumbs

Use breadcrumbs for important system steps that explain a later failure.

Good breadcrumb examples:

- permission prompt started;
- permission prompt resolved;
- repository save started;
- pending save replay started;
- file lookup started/succeeded/missing/failed;
- file handle create started/succeeded/failed;
- writable open started/succeeded/failed;
- file write failed;
- cleanup started/succeeded/failed;
- worker diagnostics state applied.

Breadcrumbs should be technical, compact, and state-oriented.

Breadcrumbs must not contain user text, file contents, raw paths, raw filenames, document ids, storage keys, URLs, emails, tokens, handles, raw browser messages, or stack traces.

Use project wrappers only. Do not call Sentry SDK directly from product code.

### Breadcrumb categories

Use dot-separated camelCase categories such as `repository.storage`, `webFileSystem.write`, `writeAccess.recovery`. At least one dot is required — the sanitizer rejects flat single-segment categories, overlong strings, and empty categories.

### Breadcrumb data sanitization

The breadcrumb sanitizer enforces privacy through a **case-insensitive key denylist** plus a **value sanitizer**:

- The key denylist blocks keys containing: `path`, `file`, `filename`, `name`, `document`, `doc`, `storagekey`, `key`, `url`, `uri`, `href`, `email`, `user`, `username`, `account`, `token`, `secret`, `credential`, `cookie`, `content`, `body`, `bytes`, `handle`, `message`, `cause`, `stack`, or `target`.
- The value sanitizer rejects path-like strings, URL-like strings, email-like strings, storage-key-like identifiers, and strings exceeding the length limit.
- Objects, arrays, Error, DOMException, handles, and all non-scalar types are rejected.

Safe primitive values on allowed keys pass automatically — do not add new explicit allowlist entries for breadcrumb data keys.

Good safe keys: `operation`, `provider`, `result`, `step`, `failureClassification`, `runtime`, `permission`, `pendingCount`.

## Diagnostic events

Use diagnostic events for compact terminal or important states.

Good event examples:

- save queued because write access is missing;
- replay failed after permission grant;
- repository save failed;
- pending save flush failed;
- cleanup failed in a way that can affect data consistency;
- unexpected provider/service boundary failure.

Do not emit diagnostic events for every step. Use breadcrumbs for step history.

A diagnostic event should include stable enums and counters, not raw details.

Good fields:

- operation;
- provider;
- result;
- classification;
- failureClassification;
- severity;
- pendingCount;
- flushedCount;
- attemptId.

Bad fields:

- path;
- fileName;
- documentId;
- storageKey;
- raw error message;
- stack;
- user text;
- file content;
- URL;
- email;
- token.

## Diagnostic exceptions

Use `captureDiagnosticException` for unexpected or undesirable branches where a stack trace helps.

Allowed examples:

- unexpected caught error at service or provider boundaries;
- user-handled errors already shown to the user;
- cleanup failure that may affect data consistency;
- provider/service failure that should not happen;
- uncaught global errors and unhandled rejections through diagnostics runtime.

Pass the **real error object** to preserve native Sentry stack, mechanism, type, source maps, and grouping. Do not rewrite or classify the error into a custom diagnostic format.

Context fields are minimal — only what Sentry cannot derive from the error itself:

```ts
captureDiagnosticException(error, {
  operation: 'repositorySave',
  failureClassification: 'accessRequired',
  feature: 'entryRemove', // for user-handled errors
  action: 'removeEntry', // for user-handled errors
});
```

`eventKind: 'handledException'` is added automatically. Do not add `handled: 'true'` manually.

Do not pass derived fields: `errorClass`, `domExceptionName`, `vfsErrorCode`, `domainErrorCode`, `errorClassification`, or `runtime`. Sentry derives equivalent information from the native exception.

Do not manually capture exceptions for expected states:

- cancelled picker;
- cancelled permission prompt;
- expected FileNotFound during optional cleanup;
- validation failure;
- normal DomainError UX state;
- user cancellation.

If the error is expected and useful for context, record a breadcrumb or diagnostic event with sanitized classification instead.

## Privacy rules

Diagnostics must never include:

- full paths;
- directory names;
- raw filenames;
- document ids;
- storage keys;
- file handles;
- raw browser messages;
- stack traces in breadcrumbs/events;
- document titles;
- user text;
- file contents;
- account identifiers;
- emails;
- usernames;
- tokens;
- secrets;
- cookies;
- credentials.

Allowed breadcrumb values are short scalar technical markers:

- enum-like strings;
- booleans;
- small numbers;
- null.

Examples of safe values:

- operation: repositorySave;
- provider: webFileSystem;
- result: failed;
- step: writableOpen;
- permissionState: granted;
- pendingCount: 1;
- flushedCount: 0;
- createdFile: true.

## Error handling

Do not attach error objects or raw error fields to `reportDiagnosticEvent`. Diagnostic events describe scenario milestones — use safe tags and counters only.

When an actual error with a stack trace is useful, report it separately:

```ts
captureDiagnosticException(caughtError, {
  operation: 'repositorySave',
  failureClassification: 'browserFileStateChanged',
});
```

Pass the **real error object** to `captureDiagnosticException`. The Sentry `beforeSend` sanitizer scrubs exception messages, linked cause messages, tags, extras, contexts, breadcrumbs, and user fields at the outgoing event boundary — feature code does not need to pre-sanitize cause messages.

**Forbidden in feature, entity, widget, and page code:**

- `createSafeErrorCause` — do not create synthetic safe-cause objects; pass the raw caught error as `DomainError.cause` instead.
- `buildSafeCause`, `buildReportedError`, `toReportedError`, or similar wrappers that replace the raw cause with a synthetic plain Error.
- `classify*Error`, `map*ErrorToCause`, `toSafe*Error`, or any local helper that inspects the caught error and produces a new synthetic error for the sole purpose of safe reporting. The Sentry sanitizer owns that responsibility.
- Feature-local VFS-to-feature error mappings or error classifiers added only to control what Sentry receives.

A local helper is acceptable only when it centralizes a user-facing message, a stable enum code, and the raw cause — without inspecting or transforming the caught error's contents.

For flow-specific decisions (e.g. whether to skip reporting user cancellation, or whether a `DOMException` means a specific browser condition), a local boolean helper near the boundary is acceptable. It must control flow, not build synthetic diagnostic errors.

Forbidden error fields in any diagnostic event or breadcrumb data:

- message;
- stack;
- cause message;
- serialized error object;
- browser-specific raw message;
- path-like details.

## Placement rules

Application code should use the public diagnostics API only.

Allowed application-facing wrappers:

- `addTechnicalBreadcrumb` — technical breadcrumb;
- `reportDiagnosticEvent` — compact terminal/status event;
- `captureDiagnosticException` — caught error as Sentry exception;
- `applyDiagnosticsPolicy` — consent policy from service layer (feature code only);
- diagnostics setup/runtime functions used by app or worker bootstrap only.

Do not import or use raw Sentry internals from feature, entity, widget, page, service, provider, or adapter code.

Forbidden application-facing imports:

- raw Sentry SDK;
- Sentry facade;
- useSentry;
- ensureSentry;
- internal queues;
- internal runtime effects registry;
- `syncSentryStateToWorker` from feature code (use `applyDiagnosticsPolicy` instead).

Providers and low-level adapters should not report Sentry events directly.

If a low-level provider needs step diagnostics, inject a narrow breadcrumb callback from the owning service or factory.

Service and service-client layers may emit terminal diagnostic events when they own the operation and can classify the outcome.

Features, widgets, pages, and entities should not add low-level diagnostics unless they own a technical boundary being diagnosed.

## Runtime behavior

Call sites must not branch on Sentry state.

Use project wrappers. The diagnostics runtime owns:

- user consent;
- enabled/disabled state;
- Sentry availability;
- sanitization;
- queue/flush behavior;
- worker-local runtime setup;
- worker state synchronization.

Feature code uses `applyDiagnosticsPolicy('enabled' | 'disabled' | 'unknown')`. It does not manage session IDs or worker sync directly.

Public setup functions are allowed for app and worker bootstrap.

Raw Sentry facade/runtime internals are implementation details.

## Breadcrumb policy

Breadcrumbs should be useful enough to reconstruct the technical path to a failure.

Do not remove important breadcrumbs just because they are not terminal failures.

Do not add noisy breadcrumbs for every small operation.

Prefer milestones at boundaries:

- before prompting;
- after prompt result;
- before replay;
- after replay failure;
- before write;
- after write/open failure;
- before cleanup;
- after cleanup failure.

## Event policy

Diagnostic events should be sparse.

Emit an event when the system reaches an important state that should be visible even without an exception.

Examples:

- save queued;
- save failed;
- replay failed;
- write access recovery failed;
- cleanup failed with data consistency risk.

Do not emit events for ordinary successful steps when a breadcrumb is enough.

## Testing

When adding diagnostics, test behavior at the wrapper boundary.

Tests should verify:

- useful technical fields survive sanitization;
- forbidden keys are removed case-insensitively;
- unsafe values are removed or sanitized;
- errors are projected without raw messages or stacks;
- expected user/domain states do not capture exceptions;
- unexpected branches capture exceptions only through project wrappers.

For captured exceptions:

- mock the Sentry facade boundary;
- assert the original `Error` is passed (not a rewritten format);
- assert `eventKind: 'handledException'` tag is present;
- assert `contexts.diagnostic` contains only `operation` and `failureClassification`;
- assert no private data appears.

Do not add brittle tests that assert exact Sentry SDK internals unless testing diagnostics infrastructure itself.

## Review checklist

Before accepting diagnostic changes, check:

- Does the diagnostic answer a concrete debugging question?
- Is the primitive correct: breadcrumb, event, or exception?
- Is the data technical and compact?
- Are paths, filenames, ids, storage keys, user text, raw messages, and stacks excluded?
- Is the call site using the public diagnostics API?
- Is Sentry kept as an implementation detail?
- Are expected user/domain states not reported as exceptions?
- Are tests focused on behavior and privacy?
- Is the layer thin? No derived classification models, no allowlists, no parallel frameworks?
- Does feature code use `applyDiagnosticsPolicy` rather than calling `syncSentryStateToWorker` directly?
