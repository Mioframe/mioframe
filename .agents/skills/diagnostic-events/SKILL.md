---
name: diagnostic-events
description: 'Use this skill when adding or reviewing project diagnostics.'
---

# Diagnostic Events Skill

Use this skill when adding or reviewing diagnostics in the application.

Diagnostics must help explain technical failures without exposing user data.

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

Use diagnostic exceptions only for undesirable or unexpected branches where stack trace helps.

Allowed examples:

- unexpected caught error;
- cleanup failure that may affect data consistency;
- provider/service failure that should not happen;
- uncaught global errors and unhandled rejections through diagnostics runtime.

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

Breadcrumb data uses:

- case-insensitive denylist by key;
- value sanitizer;
- bounded scalar values only;
- sanitized error projection only.

Do not pass objects, arrays, Error instances, DOMException instances, or raw unknown values directly as breadcrumb data.

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

Never send raw error messages to diagnostics.

Use the shared diagnostic error sanitizer.

Allowed sanitized error fields:

- errorClass;
- domExceptionName;
- domainErrorCode;
- classification;
- causeClass if safe and stable.

Forbidden error fields:

- message;
- stack;
- cause message;
- serialized error object;
- browser-specific raw message;
- path-like details.

## Placement rules

Application code should use the public diagnostics API only.

Allowed application-facing wrappers:

- add technical breadcrumb;
- report diagnostic event;
- capture diagnostic exception;
- sanitize diagnostic error;
- diagnostics setup/runtime functions used by app or worker bootstrap.

Do not import or use raw Sentry internals from feature, entity, widget, page, service, provider, or adapter code.

Forbidden application-facing imports:

- raw Sentry SDK;
- Sentry facade;
- useSentry;
- ensureSentry;
- internal queues;
- internal runtime effects registry.

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
- worker-local runtime setup.

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
