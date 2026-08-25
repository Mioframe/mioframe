# Database virtualization relation readiness failure evidence handoff

Status: **ready; diagnostic/read-only**.

## Goal

Recover the failing-state evidence from the newly reproduced relation-readiness flaky E2E without making another production/test correction by assumption.

The current cumulative branch gate on PR #217 reported `82 passed, 1 flaky` at:

`tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` — `uses default relation view inline and switches to a selected relation view`.

The existing test instrumentation already emits a structured `[relation-readiness]` snapshot only when the initial default-view assertion finally fails. This pass exists to recover that evidence and hand it back to architecture.

## Current decisions

- The E2E impact-mapping correction is accepted and is not part of this diagnostic.
- The repeated relation-readiness failure is active evidence again; do not classify it as unrelated or historical.
- No production owner/root cause is selected yet.
- Do not change the test instrumentation before reading the failing output it was created to capture.

## Required order

1. Do **not** rerun verification first.
2. Inspect the already completed `pnpm verify --base origin/develop` output and any verifier/Playwright log path retained by that invocation.
3. Recover the exact line prefixed `[relation-readiness]` and the original Playwright failure/retry classification around it.
4. Report the exact structured snapshot fields and the log path/source from which they were recovered.
5. If the previous output/log is genuinely unavailable, run exactly one focused verifier-managed diagnostic invocation:

   `pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`

6. After that single focused invocation, stop whether it reproduces or passes. Do not loop until failure and do not run another branch gate for this read-only pass.

## Snapshot fields

Report all values exactly as emitted:

- `loadingIndicatorCount`;
- `databaseTableCount`;
- `tableAriaRowcounts`;
- `rowBootstrapCount`;
- `mountedRealTbodyRowCount`;
- `renderedRowTexts`;
- `selectedRelationViewChipTexts`.

Also report:

- whether the failing attempt was the first attempt or a retry;
- whether a later whole-test retry passed;
- the original assertion/failure text;
- the verifier/Playwright log path when available.

## Interpretation boundary

The agent may state which observable bucket the snapshot belongs to, but must not choose or implement a correction:

- loading visible / no table -> pre-table/property readiness;
- table present but logical row metadata/rows absent -> data/query/table readiness;
- logical rowcount present with bootstrap/no real rows -> virtual-range startup readiness;
- correct rows with wrong selected chip -> relation-view selection readiness;
- another shape -> report it exactly without forcing it into one of these buckets.

Architecture will select the next owner after the evidence is returned.

## Forbidden

- production changes;
- test changes;
- mapping changes;
- new diagnostics;
- timeout/retry/sleep/recovery changes;
- forced remount or duplicate preload/query behavior;
- `virtualizer.measure()` or shared virtualization changes;
- repeated focused runs until reproduction;
- another `pnpm verify --base origin/develop` for this read-only pass;
- editing architect-owned `REVIEW.md`, virtualization docs, or PR metadata.

## Verification/reporting

This is a diagnostic/read-only task with no tracked implementation result. Branch verification is intentionally skipped.

Return:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <missing evidence>

DIAGNOSTIC EVIDENCE
source: existing branch-gate log | one focused rerun | unavailable
log path: <path> | unavailable
relation-readiness snapshot: <exact JSON> | not captured
failure/retry classification: <exact concise result>
observable bucket: <bucket> | unresolved

LOCAL FEEDBACK
commands: none | <single focused command if fallback was required>
status: not run | passed | failed | partial

BRANCH VERIFICATION
command: skipped
status: skipped
reason: diagnostic/read-only pass with no tracked implementation changes

CI GATE
status: architect-owned
```
