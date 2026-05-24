---
name: privacy-safe-errors
description: 'Use this skill when adding or reviewing error handling that can show user-facing messages, create DomainError instances, preserve error causes, call reportHandledError, send diagnostics, or handle browser, storage, network, File API, Google API, Automerge, Zod, VFS, or other external errors.'
---

# Privacy-safe errors

Use this skill to keep diagnostics useful without leaking paths, file names, document names, document ids, file ids, record values, raw external messages, or document contents.

## Activation check

Use this skill when code does any of the following:

- calls `reportHandledError`;
- creates or rethrows `DomainError` in a flow that may later be reported;
- preserves an unknown or external `error` as `cause`;
- handles browser APIs, File API, File System API, Google API, network, IndexedDB, VFS, Automerge/repo internals, Zod, or other external libraries;
- builds user-facing error messages, snackbar text, details panels, or copyable diagnostic text.

## Core rule

Any error that can reach handled diagnostics must be privacy-safe by construction.

Do not rely on a later caller to filter unsafe data. The boundary that converts unknown/external errors into project errors must make the reportable error safe.

## Safe reporting pattern

When reporting unexpected errors from a feature-level helper:

1. Separate expected user outcomes from unexpected app failures.
2. Do not report expected outcomes such as user cancellation, invalid user input, unsupported user-selected file format, or validation failures that are part of normal UX.
3. Convert unknown or external errors into a project-controlled safe `DomainError` or safe `Error` before reporting.
4. Pass only stable metadata to `reportHandledError`, such as `feature` and `action`.
5. Do not pass path, name, id, URL, file content, raw external message, or raw error object if it may contain private data.

Example shape:

```ts
try {
  await runAction();
} catch (error) {
  if (isExpectedUserOutcome(error)) {
    showExpectedMessage(error);
    return;
  }

  reportHandledError(toSafeReportableError(error), {
    feature: 'featureName',
    action: 'actionName',
  });
}
```

## DomainError rules

- `DomainError.message` may be user-facing. Keep it safe and avoid paths, names, ids, URLs, record values, or raw external text.
- `DomainError.cause` may be reported later. Use `createSafeErrorCause` or another project-controlled safe cause for external/browser/storage/network/Zod errors.
- `reportHandledError` reports an `Error` cause from a `DomainError` instead of the wrapper error. Passing a `DomainError` directly is safe only when its cause is also privacy-safe or absent.
- Raw `Error` may be preserved only when the message is project-controlled and cannot contain user-controlled values.
- Expected user-input errors can keep detailed causes only when the flow guarantees they will not be reported. Prefer safe causes anyway if future reuse is likely.

## Expected vs unexpected

Expected user outcomes usually should not be reported:

- user cancelled a picker or permission prompt;
- user selected invalid JSON or an unsupported document format;
- validation rejected user-provided data as part of normal UX;
- user denied an optional permission and the UI can recover.

Unexpected failures may be reported after wrapping safely:

- repository write failed;
- browser API threw in an unsupported way;
- storage operation failed unexpectedly;
- service call failed outside a known user-recoverable path.

## Review checklist

Before final handoff, check touched error flows:

- Can this error reach `reportHandledError` now or through an existing helper?
- Does any `Error.message`, `DomainError.message`, or `cause.message` include path, name, id, URL, content, raw external text, or validation payload?
- If a `DomainError` reaches `reportHandledError`, is its `cause` either absent or privacy-safe by construction?
- Are expected user outcomes excluded from reporting?
- Are unexpected unknown errors wrapped before reporting?
- Are `reportHandledError` options limited to stable safe metadata?
- Are tests covering cancellation, expected invalid input, and unexpected failure when the flow is user-facing or security-sensitive?

## Final reporting

When this skill applies, include a short note in the final summary:

- which expected errors are not reported;
- how unexpected errors are made reportable safely;
- which focused tests or checks cover the flow.