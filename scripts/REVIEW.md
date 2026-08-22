# Review

Verdict: ready

## Scope reviewed

- PR #216 verifier execution/presentation contract in `scripts/verify.ts` and its focused tests.
- Default bounded output, progress/heartbeat semantics, warnings, failure detail, timeouts, command grouping, and current CLI execution flow.

## Blockers

None.

## Major issues

None.

## Minor issues

### M1 — `release-impact` loses multi-check progress indexing

Owner: `scripts/verify.ts`

Problem: `release-impact` is explicitly a grouping that can execute several source-impact release checks in one invocation, but progress indexing is disabled whenever any `--only` label is present. Consequently a multi-check `pnpm verify --only release-impact` run prints every check as focused (`[verify] ...`) without the runnable index/total required for multi-check invocations.

Evidence:

- [`verify.ts`](./verify.ts) — `selectOnlyCommands()` expands `release-impact` into multiple release checks, while `main()` sets `checkIndex` and `totalRunnableChecksForProgress` to `null` whenever `onlyLabel !== null`.
- [`verify.test.ts`](./verify.test.ts) — formatting tests prove an already-supplied multi-check progress object and a focused single-check object, but do not prove integration between the `release-impact` grouping and multi-check progress.

Basis:

- [`../docs/testing/verify-agent-output.md`](../docs/testing/verify-agent-output.md) — multi-check invocations must report runnable check index/total; only a focused single check may omit the denominator.

Risk: a long release-impact run can execute several expensive checks without telling the coding agent which check number it is on or how many runnable checks remain, weakening the new agent-facing liveness/control surface.

Required final state: progress mode must depend on whether the resolved invocation actually contains multiple runnable checks, not merely on the presence of `--only`. A multi-check `release-impact` execution must report index/total; a truly single-check focused invocation may remain denominator-free.

Verification: add a focused execution/planning test covering `--only release-impact` with more than one selected runnable check and assert indexed progress; preserve the current single-check focused format.

### M2 — Normal-mode warning detail is printed twice

Owner: `scripts/verify.ts`

Problem: a passed check with warnings prints its warning summary and log pointer immediately in `runCommand()`, then `printCompactVerifySummary()` prints the same warning state again with summary/rerun information. This contradicts the newly documented rule that warnings, like failures, should have one compact trustworthy presentation rather than repeated sections.

Evidence:

- [`verify.ts`](./verify.ts) — `runCommand()` always prints `[label] warnings: ...` and `[label] full log: ...` for passed-with-warnings, including non-verbose mode; `printCompactVerifySummary()` later prints `<label>: passed with warnings`, the same `warningSummary`, and a rerun command.

Basis:

- [`../docs/testing/verify-agent-output.md`](../docs/testing/verify-agent-output.md) — warnings follow the same non-duplication principle as failures: compact trustworthy warning summary plus pointers, not repeated reporting.

Risk: ordinary bounded output is noisier than its accepted contract and duplicates diagnostic content in agent context. This does not change proof selection or exit semantics.

Required final state: non-verbose mode must present each warning state once while retaining an actionable log/rerun pointer; verbose mode may retain additional diagnostic detail as explicitly allowed by the contract.

Verification: capture a non-verbose passed-with-warnings run/summary and assert the warning summary is emitted once with the required actionable pointer(s); preserve verbose diagnostics.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
