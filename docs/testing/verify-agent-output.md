# Verify agent-facing output

Status: **implemented output contract**.

`docs/testing/architecture.md` remains canonical testing policy. `docs/testing/verify-target-architecture.md` owns verifier planning/impact architecture. `.agents/skills/verification/SKILL.md` owns agent workflow. This document owns only the default human/agent-facing output contract of `pnpm verify`.

## Goal

`pnpm verify` must provide enough information for a coding agent to:

1. know what verification is doing and that it has not stalled;
2. identify the failed owning check;
3. understand the smallest trustworthy failure reason available;
4. know where complete diagnostics live;
5. know the canonical focused rerun command after correction.

It must do this without filling model context with routine child-process output, repeated planner detail, skipped-check inventories, long stack traces, browser/build logs, or duplicate summaries.

The default output is an **agent control surface**, not a live mirror of every child tool.

## Ownership

`scripts/verify.ts` owns orchestration and this presentation contract.

Lane resolvers own impact reasons. Child tools own their native diagnostics. `verify` captures those diagnostics and exposes bounded status plus durable log paths; it does not reimplement Vitest, Playwright, ESLint, build, release, or Stryker reporters.

Do not add a generic logging framework, event bus, progress database, second verifier state model, or lane-specific presentation registry.

`.verify/logs/**` remains the detailed per-check diagnostic surface. `--verbose` remains explicit opt-in raw streaming/diagnostics.

## Default-output principles

### Bounded by default

Without `--verbose`, ordinary child stdout/stderr is captured to the owning log and is not streamed into caller context.

Terminal output must remain bounded with respect to child-output size. A tool producing 10 lines and the same tool producing 100,000 lines must not cause proportionally larger default output.

Default verifier output may contain only:

- one compact run/plan header when useful;
- current check progress;
- bounded liveness heartbeat for a long-running check;
- one compact completion line per executed check;
- bounded failure/warning diagnostics;
- one compact final result/action section.

Do not print complete skipped-check, changed-file, trigger-reason, or child-output inventories in normal mode.

### Details are pull-based

When more detail exists than should be printed, show where to obtain it instead of pushing it into context.

For an executed check the durable detail pointer is its exact `.verify/logs/...` path.

For a failed check, default output provides the focused verifier rerun command when representable. The agent may inspect the named log or deliberately rerun with `--verbose` if the bounded summary is insufficient.

`--verbose` is diagnostic escalation, not normal coding-agent execution mode or a completion requirement.

### Trustworthy failure reason

A failed check must identify at minimum:

```text
<check>: failed
reason: <trustworthy bounded reason>
details: <exact log path when a child process ran>
rerun: <canonical focused verify command when available>
```

Reason priority is deliberately narrow:

1. verifier-owned blocking-log signal;
2. verifier-owned invalid/pre-execution plan reason;
3. verifier-owned timeout;
4. a stable structured reporter summary only if the owning child command exposes one reliably;
5. otherwise the exact non-zero exit code.

When no trustworthy semantic extractor exists, **do not infer root cause from an arbitrary output tail**. `exit code + exact log pointer + focused rerun` is the accepted fallback. A trailing line can be unrelated chatter and is not a reliable root-cause contract.

A specialized extractor may be added later only when a stable current command contract makes it materially more actionable and simpler overall.

One failure must not be repeated in multiple summary sections. Warnings follow the same principle: compact trustworthy warning summary plus log/rerun pointer, not raw replay.

## Progress contract

Default verification visibly makes forward progress even when the active child tool is quiet.

### Check-level progress

For a multi-check invocation, before a runnable check print one compact line equivalent to:

```text
[verify 2/5] unit-tests running
```

For a focused single check, an equivalent compact form is acceptable.

On completion print status and elapsed time, for example:

```text
[verify 2/5] unit-tests passed (18s)
```

The denominator counts checks actually runnable in this invocation, not every skipped lane.

### Long-running heartbeat

Preserve the current 60-second heartbeat cadence.

A heartbeat carries verifier-owned control information only:

```text
[verify 2/5] e2e still running (2m 0s; timeout 17m; log .verify/logs/e2e.log)
```

Applicable fields:

- active check label;
- check index / runnable total when known;
- elapsed time;
- verifier-owned timeout when applicable;
- exact log path.

The heartbeat must not echo the child's latest output line. It is liveness information, not proof progress; do not invent percentages or ETAs.

Do not emit high-frequency spinner/tick output.

### Lock/wait progress

When the verifier waits on its owned command/machine lock long enough to look stalled, the existing lock status/heartbeat mechanism remains visible and bounded. Do not duplicate lock state in a second progress mechanism.

## Final summary

Normal-mode final output is optimized for the next agent decision, not for auditing every internal planner result.

On success it is compact, semantically equivalent to:

```text
VERIFY RESULT: passed
checks: 5 passed, 0 failed
elapsed: 4m 12s
logs: .verify/logs
```

Additional information is printed only when it changes the next decision, such as CI-profile risk or warnings.

On failure prioritize:

1. overall failed status;
2. failed check labels;
3. trustworthy bounded reason for each failed check;
4. exact log path for detailed diagnostics;
5. focused rerun command;
6. original-scope rerun only when useful after corrections.

Do not print successful checks, skipped checks, heavy-check reasons, environment/profile metadata, base refs, or changed-file counts in normal final output unless necessary to explain a failure/risk.

## Verbose mode

`--verbose` is the explicit escape hatch for raw execution detail. It may include:

- streamed child stdout/stderr;
- full plan/trigger details;
- skipped-check reasons;
- environment/profile/base-ref diagnostics;
- other existing detailed verifier metadata.

Verbose mode must not change selected proof, execution semantics, exit status, timeout behavior, or log persistence. CI may intentionally use verbose job logs; that does not make verbose mode the default coding-agent contract.

## Failure-detail extraction

Keep extraction narrow and trustworthy.

Prefer, in order:

1. verifier-owned invalid/timeout/blocking-log reason;
2. structured or stable reporter summary already produced by the owned command;
3. exact exit failure with log pointer when no trustworthy semantic summary exists.

Do not create brittle regex catalogues or arbitrary tail heuristics merely to avoid opening a log.

## Acceptance criteria

Implementation must prove at minimum:

- default mode does not stream ordinary child stdout/stderr;
- very large child output does not grow normal terminal output proportionally;
- a multi-check run reports runnable check index/total and completion;
- a long quiet check emits bounded heartbeat at the preserved 60-second cadence;
- default heartbeat does not echo child output;
- heartbeat includes log path and verifier-owned timeout when applicable;
- a failed check prints a bounded trustworthy reason, exact log path when available, and focused rerun command;
- absent a trustworthy semantic extractor, exit code plus log pointer is accepted rather than an arbitrary tail inference;
- normal successful completion does not enumerate every skipped lane or routine trigger reason;
- `--verbose` exposes detailed/raw diagnostics without changing execution semantics;
- invalid pre-execution plans remain actionable when no child log exists;
- timeout failures remain actionable and point to the captured log;
- existing `verify:status` / `verify:resume` and command-lock recovery semantics remain intact.

Tests should assert presentation through deterministic captured output/helper seams. Do not execute expensive real Playwright/build/release work merely to prove formatting/progress behavior.

## Forbidden

- streaming raw child output by default;
- echoing the last child-output line in normal heartbeats;
- inferring a failure cause from an arbitrary trailing output line;
- printing unbounded output tails, stack traces, changed-file lists, skipped-lane lists, or trigger-reason lists in normal mode;
- treating `--verbose` as the normal coding-agent command;
- hiding all progress until a long command exits;
- changing the 60-second heartbeat cadence without measured evidence;
- fake percentages or completion estimates;
- high-frequency progress chatter;
- a second logging/progress framework beside current verifier execution/log/lock mechanisms;
- lane-specific presentation metadata that duplicates existing planner reasons;
- discarding detailed logs merely to keep terminal output short;
- making presentation changes alter selected checks, exit semantics, retry policy, or proof ownership.
