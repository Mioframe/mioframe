---
name: diagnostic-events
description: 'Use this skill when adding, reviewing, or testing structured diagnostic events via reportDiagnosticEvent. Covers: two-layer model, when to emit events, generic event contract, enum selection, wrapper creation, sanitizeDiagnosticError, test sink usage, reporting layer policy, and privacy rules. Applies to writeAccessRecovery flows, save-replay failures, access-recovery flows, and any future instrumented operation.'
---

# Diagnostic events skill

Use this skill before adding, reviewing, or testing any `reportDiagnosticEvent` call, new wrapper module, enum value, or `sanitizeDiagnosticError` usage.

## Activation check

Use this skill when:

- Adding a new `reportDiagnosticEvent(...)` call or wrapper function.
- Reviewing existing diagnostic event coverage.
- Adding test coverage for a flow that emits a diagnostic event.
- Deciding whether `reportHandledError` or `reportDiagnosticEvent` is the right call.
- Checking which layer is allowed to emit diagnostic events.
- Creating a new flow-specific diagnostics module.

## Two-layer model

**Generic core** (`src/shared/lib/diagnostics`):

- `reportDiagnosticEvent`, queue, flush, Sentry transport;
- `sanitizeDiagnosticError`;
- `setDiagnosticEventSink`;
- generic enums: `DiagnosticSeverity`, `DiagnosticResult`, `DiagnosticClassification`;
- `DiagnosticSafeTags` type.

**Flow-specific wrappers** (next to the flow):

- `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.ts` — current example.

**Rule**: Do NOT add flow-specific feature/operation/stage/provider enum values to the shared core. Create a local `*Diagnostics.ts` module near the flow instead. The wrapper calls `reportDiagnosticEvent` internally and exposes short named functions.

## setDiagnosticEventForwarder — worker bootstrap only

`setDiagnosticEventForwarder` is the mechanism worker contexts use to relay diagnostic events to the main-thread Sentry reporter via the proxyService diagnostics channel. It is **not** a general-purpose API.

Allowed only in worker or service bootstrap code — see `setupWorkerDiagnosticsForwarder` in `src/shared/service/diagnosticsService.ts`.

Must **not** be called from:

- main-thread product code;
- UI layers (`pages`, `widgets`, `features`, `entities`);
- low-level adapters or VFS providers;
- flow-specific `*Diagnostics.ts` wrapper functions.

Normal diagnostics code must call `reportDiagnosticEvent` instead.

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
result: DiagnosticResult.Stale,
classification: DiagnosticClassification.Access,

// Wrong — the old const-object pattern no longer exists
severity: 'error',
```

Do not use `const enum`.

## Generic event contract

```ts
interface DiagnosticEvent {
  name: string; // project-controlled dot-namespaced string constant
  severity: DiagnosticSeverity; // Info | Warning | Error | Fatal
  result: DiagnosticResult; // Success | Failed | Blocked | Denied | Stale | Unknown
  classification: DiagnosticClassification; // Access | Storage | Provider | Consistency | Unexpected | Unknown
  attemptId?: string; // crypto.randomUUID() — never user data
  counters?: DiagnosticCounters; // safe integers only
  error?: SanitizedDiagnosticError; // output of sanitizeDiagnosticError
  safeTags?: DiagnosticSafeTags; // Record<string, string> — project-controlled only
}
```

The `name` field replaces the old `feature/operation/stage` triplet. Flow-specific context goes in `safeTags`.

## Creating a flow-specific wrapper

1. Create `src/shared/<area>/<flow>Diagnostics.ts` next to the flow.
2. Define stable event names as string constants: `'flowName.eventType'`.
3. Expose short named functions, e.g. `reportFlowNameFailure({ attemptId, error })`.
4. Map flow outcomes to generic `DiagnosticResult` and `DiagnosticClassification`.
5. Add `safeTags` with project-controlled values for flow context (provider, operation, etc.).
6. **For any new `safeTags` key used:** also add that key to `SAFE_EVENT_TAG_KEYS` in `src/shared/lib/setupSentry.ts` and add a `beforeSend` survival test in `setupSentry.test.ts`. Tags not in the whitelist are silently dropped by Sentry's `beforeSend`.
7. Add a sibling `<flow>Diagnostics.test.ts` with full coverage.

## Dedupe/rate-limit

`reportDiagnosticEvent` deduplicates delivery to Sentry: identical events (matching `name`, `severity`, `result`, `classification`, `safeTags`, and error summary) are sent at most once per 30 seconds.

- `attemptId` is excluded from the dedupe key — loop failures with different attempt IDs are still correctly deduplicated.
- The memory sink (`setDiagnosticEventSink`) receives every event regardless of dedupe state.
- Dedupe is session-local and in-memory; it resets on page reload.
- Emit diagnostic events only at terminal/abnormal states, not as progress logs. The dedupe window protects against retry loops but is not a substitute for emitting at the right moment.

Example (from write-access recovery wrapper):

```ts
export const reportWriteAccessPermissionDenied = ({ attemptId }: { attemptId: string }): void => {
  reportDiagnosticEvent({
    name: 'writeAccessRecovery.permissionDenied',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Denied,
    classification: DiagnosticClassification.Access,
    attemptId,
    safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
  });
};
```

## Allowed reporting layers

Only these layers may call `reportDiagnosticEvent` (always through wrappers when one exists):

- `src/shared/service/**` — at service boundary after recovery/flush results are known.
- `src/shared/serviceClient/**` — main-thread broker boundary, through flow-specific wrappers.

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

1. `name` is a stable project-controlled dot-separated string constant.
2. `result` is from `DiagnosticResult` enum (PascalCase member).
3. `classification` is from `DiagnosticClassification` enum (PascalCase member).
4. `counters` fields are project-controlled integers only — no keys, ids, paths, or names.
5. `error` is the output of `sanitizeDiagnosticError`, not a raw error or message.
6. `safeTags` values are project-controlled strings — no paths, ids, names, URLs, or user data.
7. `attemptId` is set to `crypto.randomUUID()` generated at the start of the operation — never derived from user data.
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
import { setDiagnosticEventSink } from '@shared/lib/diagnostics';
import type { DiagnosticEvent } from '@shared/lib/diagnostics';

// In beforeEach:
const sink: DiagnosticEvent[] = [];
setDiagnosticEventSink(sink);

// In afterEach:
setDiagnosticEventSink(undefined);

// Assert:
expect(sink).toHaveLength(1);
expect(sink[0]).toMatchObject({
  name: 'writeAccessRecovery.permissionDenied',
  result: DiagnosticResult.Denied,
  classification: DiagnosticClassification.Access,
  safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
});

// Attempt ID assertion:
expect(typeof sink[0]?.attemptId).toBe('string');
expect(sink[0]?.attemptId).toMatch(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);

// Privacy assertion:
expect(JSON.stringify(sink[0])).not.toContain('/user/path');
expect(JSON.stringify(sink[0])).not.toContain('Work');
```

## Reference files

- Generic core: `src/shared/lib/diagnostics/`
- Core implementation: `src/shared/lib/diagnostics/reportDiagnosticEvent.ts`
- Core tests: `src/shared/lib/diagnostics/reportDiagnosticEvent.test.ts`, `sanitizeDiagnosticError.test.ts`
- Worker-to-main-thread forwarder: `src/shared/service/diagnosticsService.ts`
- Forwarder tests: `src/shared/service/diagnosticsService.test.ts`
- Write-access recovery wrapper: `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.ts`
- Wrapper tests: `src/shared/serviceClient/fileSystem/writeAccessRecoveryDiagnostics.test.ts`
- Broker call sites: `src/shared/serviceClient/fileSystem/useFileSystemAccessPermissionBroker.ts`
- Service boundary calls: `src/shared/service/repositories/repositoriesService.ts`, `src/shared/service/repositories/repositoriesDiagnostics.ts`
- Sentry privacy boundary: `src/shared/lib/setupSentry.ts`
- Policy doc: `docs/diagnostics.md`
