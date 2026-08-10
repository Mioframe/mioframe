---
name: privacy-safe-errors
description: 'Use this skill when adding or reviewing error handling that can show user-facing messages, create DomainError instances, preserve error causes, call captureDiagnosticException, send diagnostics, or handle browser, storage, network, File API, Google API, Automerge, Zod, VFS, or other external errors.'
---

# Privacy-safe errors

Use this skill to keep diagnostics useful without leaking user-controlled or external sensitive values such as local paths, user file/document names, document or provider ids, record values, raw external messages, credentials, or document contents.

Stable project-controlled technical identifiers are not sensitive merely because they look like a name, id, path segment, or file name. Fixed protocol resource names, operation names, enum values, schema identifiers, and similar literals may appear in project-controlled messages or bounded diagnostic metadata when they cannot contain user data or secrets.

This skill does not require masking every unexpected error. Sentry must still receive actionable internal failures so real bugs can be fixed.

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

- `DomainError.message` — short project-controlled safe string. Do not interpolate dynamic user-controlled or external values that may contain sensitive data, including local/virtual paths, user file/document names, document/file/provider ids, sensitive URLs, record/content values, or raw external text.
- Stable project-controlled technical identifiers and literals are allowed in `DomainError.message` when they cannot contain user data or secrets. For example, a fixed protocol resource name such as `latest.json` is privacy-safe; whether it is appropriate user-facing copy is a separate UX decision.
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
- any library error that may include user-controlled paths, names, ids, URLs, contents, credentials, or raw user data.

Wrap with a project-controlled `DomainError.message`, stable enum `code`, and preserve raw `cause`. Sentry sanitizes the cause chain on export.

### Internal programmer errors

Internal programmer errors and project-controlled invariant failures may be reported as raw `Error` objects when both conditions hold:

- the message is project-controlled and stable;
- the message does not include dynamic user-controlled or external sensitive values.

Stable technical literals owned by Mioframe are allowed. Do not wrap or erase useful project-controlled detail only to satisfy privacy wording. Losing the original message or stack makes Sentry less useful.

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
- pass dynamic user-controlled or external sensitive values in context, tags, or extras.

Stable project-controlled identifiers may be used as bounded context/tag values when they cannot contain user data or secrets and they materially improve diagnostics.

## DomainError rules

- `DomainError.message` — user-facing/project-controlled; keep dynamic user or external sensitive values out of it. Stable Mioframe-owned technical literals are permitted when privacy-safe.
- `DomainError.code` — stable enum value; define near the source.
- `DomainError.cause` — may hold the raw runtime cause; `beforeSend` sanitizes Sentry export.
- Do not create a synthetic safe cause via `createSafeErrorCause` in feature code. Use raw cause and rely on the sanitizer.
- `createSafeErrorCause` remains valid at shared lib adapter boundaries (e.g. `googleDriveFileSystemProvider`) where the cause goes into shared diagnostics infrastructure that does not yet benefit from the outgoing sanitizer.

## Review checklist

Before final handoff, check touched error flows:

- Can this error reach `captureDiagnosticException` now or through an existing helper?
- Is `DomainError.message` free of dynamic user-controlled or external sensitive values (paths, user file/document names, ids, sensitive URLs, contents, credentials, raw external text)?
- Are any technical identifiers in the message fixed and project-controlled rather than derived from user/external input?
- Is `DomainError.code` a stable string enum value defined near the source?
- Is `DomainError.cause` the raw runtime cause (not a synthetic safe wrapper)?
- Are expected user outcomes excluded from reporting?
- Are internal programmer errors kept raw when their message and stack are safe?
- Is `captureDiagnosticException` context limited to stable safe metadata, with no dynamic user/external sensitive values?
- Are tests covering raw cause preservation and the sanitizer scrubbing sensitive values from Sentry events?

## Final reporting

When this skill applies, include a short note in the final summary:

- which expected errors are not reported;
- how boundary errors are wrapped (message, code, raw cause);
- which internal errors remain raw and why their messages are safe;
- which focused tests or checks cover the flow.
