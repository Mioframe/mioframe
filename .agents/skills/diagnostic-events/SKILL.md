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
- Permission denied after a permission prompt.
- Still-blocked state after recovery flush.
- Storage failure after a grant.
- Replay failures after a grant (`grantedWithReplayFailures`).
- Failed flush with non-zero pending count.

Do NOT emit for:

- Cancelled file picker.
- Denied optional permission with the app in a valid state.
- Ordinary validation errors or unsupported input handled by UX.

## Event contract checklist

Before submitting a diagnostic event call, verify:

1. `feature` is from `DiagnosticFeature` enum.
2. `operation` is from `DiagnosticOperation` enum.
3. `stage` is from `DiagnosticStage` enum.
4. `result` is from `DiagnosticResult` enum.
5. `classification` is from `DiagnosticClassification` enum.
6. `counters` fields are project-controlled integers only — no keys, ids, paths, or names.
7. `error` is the output of `sanitizeDiagnosticError`, not a raw error or message.
8. No path, file name, document name, document id, storage key, URL, raw external message, or bytes appear anywhere.

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
  feature: DiagnosticFeature.writeAccessRecovery,
  result: DiagnosticResult.staleRequest,
});

// Privacy assertion:
expect(JSON.stringify(sink[0])).not.toContain('/user/path');
```

## Adding new enum values

When instrumentation requires a new feature, operation, stage, result, or classification:

1. Add the value to `diagnosticEnums.ts`.
2. Re-export from `index.ts`.
3. Update `docs/diagnostics.md`.
4. Add a focused test covering the new emission.

## Reference files

- API: `src/shared/lib/diagnostics/`
- Tests: `src/shared/lib/diagnostics/reportDiagnosticEvent.test.ts`, `sanitizeDiagnosticError.test.ts`
- Policy: `docs/diagnostics.md`
- Current instrumentation: `src/shared/serviceClient/fileSystem/useFileSystemAccessPermissionBroker.ts`, `src/shared/service/repositories/repositoriesService.ts`
