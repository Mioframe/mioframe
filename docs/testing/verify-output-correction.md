# Verify output correction

Status: **implemented and architect-reviewed; closed**.

This document records the completed correction for the two final verifier-output findings in PR #216. `docs/testing/verify-agent-output.md` remains the canonical output contract.

## Goal

The correction had two bounded requirements:

1. multi-check `--only release-impact` must report runnable index/total progress;
2. normal-mode passed-with-warnings diagnostics must have one bounded owner with an exact per-check log pointer and focused rerun.

Production owner:

```text
scripts/verify.ts
```

Primary proof owner:

```text
scripts/verify.test.ts
```

No release-impact planning, release execution, workflow topology, timeout, lock, fail-fast, retry, or warning-detection semantics were changed.

## M1 — runnable progress

Final rule:

```text
resolved runnable count > 1
→ [verify i/n]

resolved runnable count <= 1
→ [verify]
```

The denominator comes from the already-resolved runnable command population; skipped entries are not counted. The implementation is generic and does not special-case `release-impact`.

The existing sequential execution, heartbeat/completion formatting, fail-fast-expensive behavior, command order, and selected checks remain unchanged.

## M2 — warning-detail ownership

Final ownership:

```text
normal mode
→ completion line may report "passed with warnings"
→ compact final summary owns warning detail exactly once

verbose mode
→ raw child output and additional immediate warning diagnostics remain allowed
```

Normal-mode warning detail contains:

```text
<label>: passed with warnings
warnings: <bounded trustworthy summary>
details: <exact .verify/logs/<label>.log path>
rerun: <canonical focused verify command>
```

`getWarningSummary()` semantics and warning pass/fail behavior are unchanged.

## Independent proof

A fresh test-author pass added deterministic real-CLI subprocess proof in `scripts/verify.test.ts` before the production correction.

The proof launches `scripts/verify.ts` through `process.execPath` and replaces only the external child `node`/`pnpm` boundary with temporary executable `PATH` shims. Real invocation parsing, command planning, `selectOnlyCommands()`, the `main()` loop, progress formatting, `runCommand()`, log capture, and final summary all execute unchanged.

The proof rejects the two original observable defects:

### M1

For:

```text
pnpm verify --only release-impact --files scripts/release/buildArtifact.mjs
```

four resolved runnable release checks must report `1/4` through `4/4` running/completion progress. A one-runnable release-impact case remains denominator-free.

### M2

A normal focused warning-bearing `oxlint` run must:

- not raw-stream child output;
- report `passed with warnings` in the completion line;
- emit the bounded warning summary exactly once;
- include `.verify/logs/oxlint.log` in the compact warning block;
- include the canonical focused rerun.

A verbose-mode guard preserves raw/additional warning diagnostics.

The test oracle is the accepted output contract, not current production output, and no production test hook or private orchestration export was added.

## Architect re-review

Architect re-review covered the complete affected output path rather than only the patch:

- `selectOnlyCommands()` grouping behavior;
- resolved runnable population and execution loop;
- progress, completion and heartbeat contracts;
- warning capture, immediate diagnostics, compact summary and rerun/log pointers;
- changed proof oracle and plausible wrong outcomes;
- unchanged release-impact selection, execution order, timeout, lock, fail-fast and CI ownership.

Result:

```text
blockers: 0
major issues: 0
minor issues: 0
accepted risks: 0
```

The correction is closed. `scripts/REVIEW.md` is removed because no active output review state remains.

## Verification evidence

Coding/test-author focused feedback reported green:

```bash
pnpm verify --only unit-tests --files \
  scripts/verify.ts \
  scripts/verify.test.ts

pnpm verify --only type-check

pnpm verify --only oxlint --files scripts/verify.ts
```

Exact-head CI remains architect-owned and is not replaced by this focused evidence.
