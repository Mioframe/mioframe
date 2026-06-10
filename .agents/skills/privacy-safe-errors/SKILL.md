---
name: privacy-safe-errors
description: 'Use this skill when adding or reviewing error handling that can show user-facing messages, create DomainError instances, preserve error causes, call captureDiagnosticException, send diagnostics, or handle browser, storage, network, File API, Google API, Automerge, Zod, VFS, or other external errors.'
---

# Privacy-safe errors

Use this skill to keep diagnostics useful without leaking paths, file names, document names, document ids, file ids, record values, raw external messages, or document contents.

This skill does not require masking every unexpected error. Sentry must still receive actionable internal programmer failures so real bugs can be fixed.

## Activation check

Use this skill when code does any of the following:

- calls `captureDiagnosticException`;
- creates or rethrows `DomainError` in a flow that may later be reported;
- preserves an unknown, boundary, or external `error` as `cause`;
- handles browser APIs, File API, File System API, Google API, network, IndexedDB, VFS, Automerge/repo internals, Zod, or other external libraries;
- builds user-facing error messages, snackbar text, details panels, or copyable diagnostic text.

## Two concerns — keep them distinct

**Trusted in-app runtime and proxy transfer**

`DomainError.cause` may hold the original raw runtime error inside the app and across trusted proxy boundaries. Preserving the raw cause is correct and intended for runtime debugging. Do not sanitize it at the error-creation site.

**External diagnostics export**

The Sentry `beforeSend` sanitizer scrubs outgoing events: exception value messages (including linked cause chains), tags, extras, contexts, breadcrumbs, and user fields. Sensitive data is removed before reaching Sentry.

## Error construction rules

Wrap boundary failures using this pattern:

```ts
throw new DomainError('Could not save changes.', {
  code: RepositoryErrorCode.SaveFailed,
  cause: error,
});
```

- `DomainError.message` — user-safe short string; no paths, names, ids, URLs, or raw external text.
- `DomainError.code` — stable string enum value defined close to the error's source. Do not create a global registry.
- `DomainError.cause` — raw runtime cause preserved for debugging; the sanitizer handles Sentry export.

## Error code rules

Define each string enum close to the boundary where the error originates:

```ts
export enum RepositoryErrorCode {
  SaveFailed = 'repository.saveFailed',
  ReplayFailed = 'repository.replayFailed',
}

export enum ExampleDocumentsCreateErrorCode {
  CreateFailed = 'exampleDocumentsCreate.createFailed',
  DirectoryLimitExceeded = 'exampleDocumentsCreate.directoryLimitExceeded',
}
```

Do not create a global error-code registry. Do not create feature-local classifiers or manual VFS-to-feature error mappings.

## Classify the error source

### External or user-data boundary errors

These must be wrapped before `captureDiagnosticException`:

- browser APIs, File API, File System Access API;
- IndexedDB, storage adapters, Automerge/repo internals;
- Google APIs, network responses;
- VFS, Zod parsing of user-controlled payloads;
- any library error that may include paths, names, ids, URLs, contents, or raw user data.

Wrap with a project-controlled `DomainError.message`, stable enum `code`, and preserve raw `cause`. Sentry sanitizes the cause chain on export.

### Internal programmer errors

Internal programmer errors and project-controlled invariant failures may be reported as raw `Error` objects when both conditions hold:

- the message is project-controlled and stable;
- the message does not include user-controlled paths, names, ids, URLs, contents, payloads, or raw external text.

Do not wrap these errors only to satisfy privacy wording. Losing the original message or stack makes Sentry less useful.

### Expected user outcomes

Expected user outcomes usually should not be reported:

- user cancelled a picker or permission prompt;
- user selected invalid JSON or an unsupported document format;
- validation rejected user-provided data as part of normal UX;
- user denied an optional permission and the UI can recover.

## Reporting pattern

```ts
try {
  await runAction();
} catch (error) {
  if (isExpectedUserOutcome(error)) {
    showExpectedMessage(error);
    return;
  }

  captureDiagnosticException(
    new DomainError('Safe user message.', {
      code: MyErrorCode.ActionFailed,
      cause: error,
    }),
    { feature: 'featureName', action: 'actionName' },
  );
}
```

Do not:

- create local classifiers or safe-cause builders for each error type;
- pass path, name, id, URL, or user-controlled values in context, tags, or extras.

## DomainError rules

- `DomainError.message` — user-facing; keep it safe.
- `DomainError.code` — stable enum value; define near the source.
- `DomainError.cause` — may hold the raw runtime cause; `beforeSend` sanitizes Sentry export.
- Do not create a synthetic safe cause via `createSafeErrorCause` in feature code. Use raw cause and rely on the sanitizer.
- `createSafeErrorCause` remains valid at shared lib adapter boundaries (e.g. `googleDriveFileSystemProvider`) where the cause goes into shared diagnostics infrastructure that does not yet benefit from the outgoing sanitizer.

## Review checklist

Before final handoff, check touched error flows:

- Can this error reach `captureDiagnosticException` now or through an existing helper?
- Is `DomainError.message` free of paths, names, ids, URLs, content, and raw external text?
- Is `DomainError.code` a stable string enum value defined near the source?
- Is `DomainError.cause` the raw runtime cause (not a synthetic safe wrapper)?
- Are expected user outcomes excluded from reporting?
- Are internal programmer errors kept raw when their message and stack are safe?
- Is `captureDiagnosticException` context limited to stable safe metadata (`feature`, `action`, `operation`)?
- Are tests covering raw cause preservation and the sanitizer scrubbing sensitive values from Sentry events?

## Final reporting

When this skill applies, include a short note in the final summary:

- which expected errors are not reported;
- how boundary errors are wrapped (message, code, raw cause);
- which internal errors remain raw and why their messages are safe;
- which focused tests or checks cover the flow.
