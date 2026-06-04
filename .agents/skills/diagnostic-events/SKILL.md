---
name: diagnostic-events
description: 'Use this skill when adding, reviewing, or testing structured diagnostic events via reportDiagnosticEvent. Covers: when to emit events, event contract, enum selection, sanitizeDiagnosticError, test sink usage, reporting layer policy, and privacy rules. Applies to writeAccessRecovery flows, save-replay failures, access-recovery flows, and any future instrumented operation.'
---

# Diagnostic events skill

Use this skill before adding, reviewing, or testing any `reportDiagnosticEvent` call, new enum value, or `sanitizeDiagnosticError` usage.

## Activation check

Use this skill when:

- Adding a new `reportDiagnosticEvent(...)` call.
- Reviewing existing diagnostic event coverage.
- Adding or renaming a value in `diagnosticEnums.ts`.
- Adding test coverage for a flow that emits a diagnostic event.
- Deciding whether `reportHandledError` or `reportDiagnosticEvent` is the right call.
- Checking which layer is allowed to emit diagnostic events.

## Key rule: which API to use

| Situation                                                   | Correct API             |
| ----------------------------------------------------------- | ----------------------- |
| Unexpected exception (programmer error or external failure) | `reportHandledError`    |
| Structured async/status/recovery observation                | `reportDiagnosticEvent` |
| Access recovery flow outcome                                | `reportDiagnosticEvent` |
| Save-replay result                                          | `reportDiagnosticEvent` |

`reportHandledError` accepts only `{ feature, action }` — there is no generic `metadata` field. Do not add it.

## String enums — use PascalCase members

All diagnostic enums are TypeScript string enums with PascalCase member names and stable lowercase wire values. Always use the member form in product code:

```ts
// Correct
severity: DiagnosticSeverity.Error,
feature: DiagnosticFeature.WriteAccessRecovery,
result: DiagnosticResult.StaleRequest,

// Wrong — the old const-object pattern no longer exists
severity: DiagnosticSeverity.error,
```

Do not use `const enum`.

## Allowed reporting layers

Only these layers may call `reportDiagnosticEvent`:

- `src/shared/service/**` — after recovery/flush results are known.
- `src/shared/serviceClient/**` — main-thread broker boundary only.

The following layers must never call `reportDiagnosticEvent` or Sentry directly:

- `src/shared/lib/**` adapters and providers — return structured results instead.
- `src/entities/**`, `src/features/**`, `src/widgets/**`, `src/pages/**`.

## Must-report policy

Emit a diagnostic event for:

- Stale or missing access request when recovery is attempted.
- Permission denied after a write-access permission prompt (saves remain blocked).
- Still-blocked state after recovery flush.
- Storage failure after a grant.
- Replay failures after a grant (`grantedWithReplayFailures`).
- Failed flush with non-zero pending count.
- Unexpected provider errors caught at the outer boundary (use `sanitizeDiagnosticError`).

Do NOT emit for:

- Cancelled file picker.
- Cancelled permission prompt where the app remains in a valid state (`cancelled` status).
- Ordinary validation errors or unsupported input handled by UX.

## Event contract checklist

Before submitting a diagnostic event call, verify:

1. `feature` is from `DiagnosticFeature` enum (PascalCase member).
2. `operation` is from `DiagnosticOperation` enum (PascalCase member).
3. `stage` is from `DiagnosticStage` enum (PascalCase member).
4. `result` is from `DiagnosticResult` enum (PascalCase member).
5. `classification` is from `DiagnosticClassification` enum (PascalCase member).
6. `counters` fields are project-controlled integers only — no keys, ids, paths, or names.
7. `error` is the output of `sanitizeDiagnosticError`, not a raw error or message.
8. `providerKind` is set for provider-specific flows (e.g. `DiagnosticProviderKind.WebFileSystem`).
9. `attemptId` is set to `crypto.randomUUID()` generated at the start of the operation — never derived from user data.
10. No path, file name, document name, document id, storage key, URL, raw external message, or bytes appear anywhere.

## sanitizeDiagnosticError usage

Always wrap boundary errors before attaching them:

```ts
import { sanitizeDiagnosticError, reportDiagnosticEvent } from '@shared/lib/diagnostics';

reportDiagnosticEvent({
  ...,
  error: sanitizeDiagnosticError(caughtError),
});
```

Never pass `error.message` from browser APIs, storage, network, VFS, Automerge, or other external sources to any diagnostic field.

## Attempt ID rules

- Generate at the start of one operation call: `const attemptId = crypto.randomUUID();`
- Pass to all events within that call so they can be correlated in Sentry.
- Must never contain or be derived from path, space name, document id, storage key, handle, or any user data.
- Do not introduce a global tracer or span context.

## Consent lifecycle

`useDiagnosticsReporting` manages both the handled-error queue and the diagnostic event queue:

- When reporting becomes **enabled**: calls `flushQueuedDiagnosticEvents()` after `flushQueuedHandledReports()`.
- When reporting becomes **disabled** or Sentry is not configured: calls `clearQueuedDiagnosticEvents()`.

The diagnostic queue flush is fire-and-forget and never produces unhandled promise rejections.

## Test pattern

Use the in-memory sink — do not mock Sentry:

```ts
import { setDiagnosticEventSink, reportDiagnosticEvent } from '@shared/lib/diagnostics';
import type { DiagnosticEvent } from '@shared/lib/diagnostics';

// In beforeEach:
const sink: DiagnosticEvent[] = [];
setDiagnosticEventSink(sink);

// In afterEach:
setDiagnosticEventSink(undefined);

// Assert:
expect(sink).toHaveLength(1);
expect(sink[0]).toMatchObject({
  feature: DiagnosticFeature.WriteAccessRecovery,
  result: DiagnosticResult.StaleRequest,
  providerKind: DiagnosticProviderKind.WebFileSystem,
});

// Attempt ID assertion:
expect(typeof sink[0]?.attemptId).toBe('string');
expect(sink[0]?.attemptId).toMatch(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);

// Privacy assertion:
expect(JSON.stringify(sink[0])).not.toContain('/user/path');
```

## Adding new enum values

When instrumentation requires a new feature, operation, stage, result, or classification:

1. Add the value to `diagnosticEnums.ts` with a PascalCase member and stable lowercase wire value.
2. Re-export from `index.ts`.
3. Update `docs/diagnostics.md`.
4. Add a focused test covering the new emission.

## Reference files

- API: `src/shared/lib/diagnostics/`
- Tests: `src/shared/lib/diagnostics/reportDiagnosticEvent.test.ts`, `sanitizeDiagnosticError.test.ts`
- Policy: `docs/diagnostics.md`
- Current instrumentation: `src/shared/serviceClient/fileSystem/useFileSystemAccessPermissionBroker.ts`, `src/shared/service/repositories/repositoriesService.ts`
