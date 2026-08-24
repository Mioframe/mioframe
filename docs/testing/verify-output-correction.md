# Verify output correction

Status: **implemented and architect-reviewed; closed**.

This document records the two final verifier-output corrections in PR #216. `docs/testing/verify-agent-output.md` remains the canonical output contract.

## Goal

The correction closed two presentation defects without changing verification selection, execution semantics, proof ownership, timeouts, retry policy, or CI topology:

1. multi-check `--only release-impact` uses runnable index/total progress;
2. normal-mode passed-with-warnings diagnostics are presented once, with an exact log pointer and focused rerun.

## Ownership

Production owner:

```text
scripts/verify.ts
```

Primary proof owner:

```text
scripts/verify.test.ts
```

No additional production module or presentation framework was introduced.

## M1 — resolved runnable population owns progress shape

Final rule:

```text
resolved runnable count > 1
→ [verify i/n]

resolved runnable count <= 1
→ [verify]
```

The denominator is the already-resolved runnable command population; skipped entries are not counted. The implementation does not special-case `release-impact`.

Sequential execution, heartbeat, completion formatting, fail-fast-expensive behavior, command order, and selected checks remain unchanged.

## M2 — one normal-mode warning-detail owner

Final ownership:

```text
normal mode
→ completion line may say "passed with warnings"
→ compact final summary owns warning detail exactly once

verbose mode
→ raw child output and additional immediate diagnostic detail remain allowed
```

For each normal-mode warning-bearing executed check, the compact warning detail contains:

```text
<label>: passed with warnings
warnings: <bounded trustworthy summary>
details: <exact .verify/logs/<label>.log path>
rerun: <canonical focused verify command>
```

Immediate warning-summary/log printing from `runCommand()` is verbose-only. Warning detection and warning pass/fail semantics are unchanged.

## Independent proof

A fresh dedicated test-author pass authored deterministic real-CLI subprocess proof in `scripts/verify.test.ts` before production edits.

The proof launches `scripts/verify.ts` through `process.execPath` and prepends temporary executable `node`/`pnpm` PATH shims. Only the external child-process boundary is replaced; real CLI argument resolution, command planning, `selectOnlyCommands()`, the `main()` loop, progress formatting, `runCommand()`, log capture, and final summary remain active.

Covered contracts:

- four-runnable `--only release-impact` reports `1/4` through `4/4` running/completion progress;
- one-runnable release-impact remains denominator-free;
- skipped checks are absent from the denominator;
- normal warning detail appears once and includes exact per-check log plus focused rerun;
- verbose warning diagnostics remain available.

The tests produced contract-relevant RED against the pre-correction implementation and were left read-only during the separate implementation pass.

## Architect review

Architect re-review checked the complete output boundary after implementation, not only the latest patch. No blocker, major issue, minor issue, or accepted risk remained in the output owner, so `scripts/REVIEW.md` was removed.

The later full PR semantic review did not reopen this output boundary. The active blocker found by that review is separate and owned by `scripts/lib/releaseRisk.ts`; see `scripts/lib/REVIEW.md` and `verify-release-impact-correction.md`.

## Acceptance state

The output correction remains closed because:

1. multi-check progress is based on resolved runnable count;
2. one-runnable progress stays denominator-free;
3. skipped checks do not affect the denominator;
4. normal warning detail has one owner;
5. exact per-check warning log and focused rerun are present;
6. verbose diagnostics remain available;
7. warning semantics and exit status are unchanged;
8. selected checks, ordering, fail-fast behavior, heartbeat cadence, timeouts, locks, and CI topology are unchanged;
9. no production test hook, generic logger, event bus, reporter registry, second progress model, or new module was introduced;
10. independent proof and architect semantic review are clean.
