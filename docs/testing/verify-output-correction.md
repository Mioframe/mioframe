# Verify output correction

Status: **architecture ready; implementation pending**.

This document is the narrow correction handoff for the two remaining verifier-output findings in PR #216. `docs/testing/verify-agent-output.md` remains the canonical output contract; this file does not redefine that contract.

## Goal

Close the two remaining presentation defects without changing verification selection, execution semantics, proof ownership, timeouts, retry policy, or CI topology:

1. multi-check `--only release-impact` must use runnable index/total progress;
2. normal-mode passed-with-warnings diagnostics must be presented once, with an exact log pointer and focused rerun.

## Scope and ownership

Production owner:

```text
scripts/verify.ts
```

Primary proof owner:

```text
scripts/verify.test.ts
```

No other production module is required. In particular, do not change release-impact planning, release execution, workflow topology, command locks, timeout policy, or child-tool warning semantics.

## M1 — runnable progress is based on resolved runnable population

Current defect:

```text
onlyLabel !== null
→ progress denominator disabled
```

That is incorrect for `release-impact`, because the grouping can resolve several runnable source-impact checks in one invocation.

Required final rule:

```text
resolved runnable count > 1
→ [verify i/n]

resolved runnable count <= 1
→ [verify]
```

The denominator is the already-resolved runnable command population for this invocation; skipped entries are not counted. Do not special-case `release-impact` in presentation logic. Do not introduce a second progress state model.

Keep the existing sequential execution, heartbeat, completion formatting, fail-fast-expensive behavior, command order, and selected checks unchanged.

## M2 — warning detail has one normal-mode owner

Current defect:

- `runCommand()` prints warning summary + log immediately after a successful warning-bearing child process even in normal mode;
- `printCompactVerifySummary()` then prints the same warning detail again.

Required final ownership:

```text
normal mode
→ completion line may say "passed with warnings"
→ compact final summary owns warning detail exactly once

verbose mode
→ raw child output and additional immediate diagnostic detail remain allowed
```

For each normal-mode warning-bearing executed check, the compact warning detail must contain:

```text
<label>: passed with warnings
warnings: <bounded trustworthy summary>
details: <exact .verify/logs/<label>.log path>
rerun: <canonical focused verify command>
```

Equivalent bounded wording is acceptable, but the warning summary must not be duplicated in normal terminal output. The existing overall `logs: .verify/logs` line is not a replacement for the exact owning-check log pointer.

Do not change how `getWarningSummary()` detects warnings. Do not make warnings fatal. Do not suppress the normal completion line; it is progress state, not duplicate warning detail.

## Independent proof

Use a fresh test-author context before production edits. The oracle is `docs/testing/verify-agent-output.md` plus this correction handoff, not current `scripts/verify.ts` output.

The primary proof must exercise the real verify CLI presentation path without running expensive real child tools and without exporting private orchestration internals solely for tests.

Use deterministic subprocess proof in `scripts/verify.test.ts`:

- launch `scripts/verify.ts` through `process.execPath`;
- prepend a temporary directory to `PATH` containing minimal executable `node`/`pnpm` shims for child commands;
- keep the real verifier process, command planning, `selectOnlyCommands()`, `main()` loop, progress formatting, `runCommand()`, log capture and final summary intact;
- the shims only replace the external child process boundary and exit deterministically.

Do not introduce a production test hook, export `main()`/`runCommand()` only for proof, or execute real release/browser/build/lint workloads for this presentation contract.

### RED A — multi-check release-impact progress

Use an explicit changed file with an accepted four-check release mapping:

```text
pnpm verify --only release-impact --files scripts/release/buildArtifact.mjs
```

Run it through the deterministic CLI subprocess/shim setup.

Expected observable result:

- exactly four runnable release checks execute;
- running/completion progress uses `1/4` through `4/4` rather than denominator-free `[verify]` lines;
- no skipped release checks are included in the denominator.

The current implementation must fail this assertion because every `--only` invocation currently nulls the denominator.

Also preserve the single-runnable focused form with a one-check release-impact case such as:

```text
scripts/release/validateReleaseConfig.mjs
```

which must remain denominator-free rather than rendering `1/1`.

### RED B — normal warning detail is not duplicated

Run a normal focused `oxlint` invocation through the same deterministic CLI boundary, with the fake `pnpm` child emitting one stable warning-bearing line and exiting successfully.

Expected observable result:

- child output is not raw-streamed in normal mode;
- the completion line reports `passed with warnings`;
- the bounded warning summary appears once in normal terminal output;
- the warning block includes the exact `.verify/logs/oxlint.log` pointer;
- the warning block includes the canonical focused rerun command.

The current implementation must fail because `runCommand()` and the compact summary both emit the warning detail, while the compact warning block lacks the exact per-check log pointer.

Add/retain a verbose-mode guard proving detailed/raw warning diagnostics remain available when `--verbose` is explicitly requested. Verbose mode does not need the normal-mode non-duplication guarantee.

## Minimum implementation design

Keep the implementation local and explicit.

For M1, derive whether progress has an index/total from the already-computed `totalRunnableChecks`, not from `onlyLabel`.

For M2:

- immediate warning-summary/log printing from `runCommand()` must be verbose-only;
- normal-mode warning detail remains owned by `printCompactVerifySummary()`;
- add the exact executed-check log path to that compact warning block.

No generic reporter abstraction, event layer, presentation registry, or second summary model is justified.

## Acceptance criteria

The correction is complete when:

1. a real CLI `--only release-impact` invocation with four resolved runnable checks prints indexed `1/4` … `4/4` progress for running/completion lines;
2. a release-impact invocation with one runnable check keeps denominator-free focused progress;
3. skipped checks are not included in the progress denominator;
4. normal warning-bearing execution prints the bounded warning summary only once;
5. the normal warning block includes the exact per-check log path and canonical focused rerun;
6. verbose mode retains raw/additional diagnostics;
7. warning detection and pass/fail semantics are unchanged;
8. selected checks, command order, release-impact planning, fail-fast behavior, heartbeat cadence, timeouts, locks and CI topology are unchanged;
9. no new production test-only API or generic logging/progress abstraction is introduced;
10. focused independent proof is green after implementation;
11. architect re-reviews the complete output boundary before closing `scripts/REVIEW.md`.

## Verification boundary

Focused test-author/implementation feedback:

```bash
pnpm verify --only unit-tests --files \
  scripts/verify.ts \
  scripts/verify.test.ts
```

Use:

```bash
pnpm verify --fix-only --files \
  scripts/verify.ts \
  scripts/verify.test.ts
```

only if the touched files need formatting/lint fixes. Run `pnpm verify --only type-check` only when useful for the changed TypeScript surface.

Broad repository/release/browser verification remains architect-owned through exact-head CI.

## Forbidden

- Changing release-impact selection or `releaseRisk.ts`.
- Special-casing `release-impact` in the progress formatter when runnable-count logic is sufficient.
- Counting skipped checks in the denominator.
- Suppressing the warning completion state to hide duplication.
- Removing the final warning block instead of keeping one actionable owner.
- Treating the overall `.verify/logs` directory pointer as the exact warning-check detail pointer.
- Changing warning detection or making warnings fatal.
- Exporting private orchestration solely for tests.
- Adding a generic logger, event bus, reporter registry, second progress model, or new module.
- Changing heartbeat cadence, timeout policy, locks, fail-fast behavior, command ordering, retry policy, CI workflows, benchmark work, or other closed verifier passes.
- Editing architect-owned documentation, `REVIEW.md`, PR metadata, or GitHub lifecycle state from the coding/test-author contexts.
