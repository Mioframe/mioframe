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

Required final state: progress mode must depend on whether the resolved invocation actually contains multiple runnable checks, not merely on the presence of `--only`. A multi-check `release-impact` execution must report index/total; a truly single-runnable invocation remains denominator-free.

Verification: exercise the real verify CLI with a deterministic child-process boundary so a multi-check `--only release-impact` invocation proves indexed running/completion output without executing real release work; preserve the one-runnable denominator-free form.

### M2 — Normal-mode warning detail is printed twice

Owner: `scripts/verify.ts`

Problem: a passed check with warnings prints its warning summary and log pointer immediately in `runCommand()`, then `printCompactVerifySummary()` prints the same warning state again with summary/rerun information. This contradicts the documented rule that warnings, like failures, should have one compact trustworthy presentation rather than repeated sections.

Evidence:

- [`verify.ts`](./verify.ts) — `runCommand()` always prints `[label] warnings: ...` and `[label] full log: ...` for passed-with-warnings, including non-verbose mode; `printCompactVerifySummary()` later prints `<label>: passed with warnings`, the same `warningSummary`, and a rerun command.

Basis:

- [`../docs/testing/verify-agent-output.md`](../docs/testing/verify-agent-output.md) — warnings follow the same non-duplication principle as failures: compact trustworthy warning summary plus log/rerun pointer, not raw replay.

Risk: ordinary bounded output is noisier than its accepted contract and duplicates diagnostic content in agent context. This does not change proof selection or exit semantics.

Required final state: non-verbose mode must present the bounded warning detail once in the compact final summary, including the exact owning-check log path and focused rerun. The normal completion line may still report `passed with warnings`. Verbose mode may retain raw/additional immediate diagnostics.

Verification: exercise a real focused verify CLI invocation against a deterministic warning-emitting child shim; assert normal terminal output contains one bounded warning summary plus exact log/rerun pointers, and retain a verbose-mode diagnostic guard.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.

## Selected correction handoff

The PR completion plan requires these two minor findings to be closed before the final semantic review and benchmark. The ready implementation/proof handoff is:

```text
../docs/testing/verify-output-correction.md
```

Production owner:

```text
scripts/verify.ts
```

Primary proof owner:

```text
scripts/verify.test.ts
```

PROOF INTENT:

```text
Contract/scenario M1:
  progress reflects the resolved runnable population, including a multi-check --only release-impact grouping.

Must reject M1:
  four resolved runnable release checks render denominator-free [verify] progress.

Contract/scenario M2:
  normal passed-with-warnings output has one bounded diagnostic owner with exact log and focused rerun pointers.

Must reject M2:
  the same warning summary is printed by both immediate runCommand diagnostics and the compact final summary, or the final warning block lacks the exact per-check log path.

Primary proof owner:
  unit/integration-level deterministic CLI subprocess proof in scripts/verify.test.ts.

Red phase:
  required for both current observable defects.
```

Required pass order:

1. fresh independent test-author context changes only `scripts/verify.test.ts` and demonstrates contract-relevant RED for M1 and M2 using deterministic child `node`/`pnpm` PATH shims;
2. separate implementation context changes only `scripts/verify.ts` and treats accepted test assertions as read-only;
3. focused verifier-managed feedback only;
4. return to architect for complete output-contract re-review;
5. only after this review closes, continue to the full PR semantic review and benchmark stages.

Do not expand this correction into release planning, release execution, warning detection semantics, timeout/lock behavior, CI topology, benchmark work, or a generic logging/progress abstraction. Documentation, review state, PR metadata, CI interpretation and merge readiness remain architect-owned.
