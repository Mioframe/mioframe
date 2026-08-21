# Verify agent-facing output

Status: implementation contract for verifier progress and diagnostics.

`docs/testing/architecture.md` remains the canonical testing policy. `docs/testing/verify-target-architecture.md` owns verifier planning/impact architecture. `.agents/skills/verification/SKILL.md` owns agent workflow. This document owns only the default human/agent-facing output contract of `pnpm verify`.

## Goal

`pnpm verify` must provide enough information for a coding agent to:

1. know what verification is currently doing and that it has not stalled;
2. identify the failed owning check;
3. understand the smallest actionable failure summary available without dumping tool output;
4. know where to inspect complete diagnostics;
5. know the canonical focused rerun command after a correction.

It must do this without filling the model context with routine child-process output, repeated planner detail, skipped-check inventories, long stack traces, browser logs, build logs, or duplicate summaries.

The default output is an **agent control surface**, not a live mirror of every tool that `verify` invokes.

## Ownership

`scripts/verify.ts` owns orchestration and this presentation contract.

Existing lane resolvers continue to own impact reasons. Existing child tools continue to own their native diagnostics. `verify` captures those diagnostics and exposes a bounded summary plus a durable log path; it does not reimplement Vitest, Playwright, ESLint, build, release, or Stryker reporters.

Do not add a generic logging framework, event bus, progress database, second verifier state model, or lane-specific presentation registry for this requirement.

`.verify/logs/**` remains the detailed per-check diagnostic surface. `--verbose` remains the explicit opt-in for streaming raw child stdout/stderr.

## Default-output principles

### Bounded by default

Without `--verbose`, child stdout/stderr is captured to the owning log and is not streamed into the caller context.

The terminal output must remain bounded with respect to child-output size. A tool producing 10 lines and the same tool producing 100,000 lines must not cause proportionally larger default verifier output.

Default verifier output may contain only:

- one compact run/plan header when useful;
- current check progress;
- bounded liveness heartbeat for a long-running check;
- one compact completion line per executed check;
- bounded failure/warning diagnostics;
- one compact final result/action section.

Do not print the complete skipped-check inventory, complete changed-file inventory, complete trigger-reason inventory, or complete child-output tail in normal mode merely because that information exists internally.

### Details are pull-based

When more detail exists than should be printed, show where to obtain it instead of pushing it into context.

For an executed check the durable detail pointer is its exact `.verify/logs/...` path.

For a failed check, default output must provide the focused verifier rerun command when one is representable. The agent may then inspect the named log or deliberately rerun with `--verbose` if the bounded summary is insufficient.

`--verbose` is diagnostic escalation, not normal agent execution mode and not a completion requirement.

### Actionable failure, not generic noise

A failed check must identify at minimum:

```text
<check>: failed
reason: <bounded actionable diagnostic or exit/plan reason>
details: <exact log path when a child process ran>
rerun: <canonical focused verify command when available>
```

The `reason` should prefer a verifier-known semantic failure (invalid plan, blocking warning, timeout, known reporter summary) over arbitrary trailing log lines.

When no reliable semantic extraction exists, print only a small bounded diagnostic excerpt sufficient to orient the agent, then point to the complete log. Do not pretend that an arbitrary last line is the root cause.

One failure must not be repeated in three different summary sections.

Warnings follow the same principle: compact warning summary plus log/rerun pointer, not raw output replay.

## Progress contract

Default verification must visibly make forward progress even when the active child tool is quiet.

### Check-level progress

For a multi-check invocation, before executing a runnable check print one compact line equivalent to:

```text
[verify 2/5] unit-tests running
```

For a focused single-check invocation, an equivalent compact focused form is acceptable.

On completion print one compact line containing status and elapsed time, for example:

```text
[verify 2/5] unit-tests passed (18s)
```

The progress denominator counts checks that are actually runnable in this invocation, not every skipped lane in the repository.

### Long-running heartbeat

If a running check has not completed within the heartbeat interval, print a compact liveness update even when its child process is producing no terminal-visible output.

Preserve the current 60-second heartbeat cadence for the initial implementation. The immediate `running` line plus one bounded liveness line per minute is sufficient unless later measured agent/runtime behavior proves that cadence inadequate.

The heartbeat must contain only verifier-owned control information, for example:

```text
[verify 2/5] e2e still running (2m 0s; timeout 17m; log .verify/logs/e2e.log)
```

Applicable fields:

- active check label;
- check index / runnable total when known;
- elapsed time;
- timeout when the verifier owns one;
- exact log path.

The heartbeat must **not** echo the child's latest output line by default. Arbitrary tool output is diagnostic payload and belongs in the log/verbose channel; copying it into every heartbeat defeats context bounding and can repeat very long or irrelevant lines.

A heartbeat is liveness information, not proof progress. Do not invent percentages or estimated completion when the underlying tool does not expose trustworthy progress.

Do not emit high-frequency spinner/tick output that consumes agent context without adding state.

### Lock/wait progress

When the verifier is legitimately waiting on an owned verifier/expensive-command lock long enough to look stalled, its existing lock status/heartbeat mechanism must remain visible and bounded. Waiting must not silently appear as a hung verification process.

Do not duplicate lock state in a second progress mechanism; presentation may consume the existing lock metadata/state.

## Final summary

Normal-mode final output is optimized for the next agent decision, not for auditing every internal planner result.

On success it should be compact, for example semantically:

```text
VERIFY RESULT: passed
checks: 5 passed, 0 failed
elapsed: 4m 12s
logs: .verify/logs
```

Additional information is printed only when it changes the next decision, such as CI-profile risk or warnings.

On failure it should prioritize:

1. overall failed status;
2. failed check labels;
3. compact actionable reason for each failed check;
4. exact log path for detailed diagnostics;
5. focused rerun command;
6. original-scope rerun only when it is actually useful after all focused corrections.

Do not print successful checks, skipped checks, heavy-check trigger reasons, environment/profile metadata, base refs, and changed-file counts in the normal final summary unless one of those facts is necessary to explain a failure/risk or the invocation explicitly requests verbose diagnostics.

Planner reasons remain inspectable, but routine successful planning detail belongs to verbose/status/diagnostic output rather than every agent-facing completion.

## Verbose mode

`--verbose` is the explicit escape hatch for a human or agent that needs raw execution detail.

Verbose mode may include:

- streamed child stdout/stderr;
- full plan/trigger details;
- skipped-check reasons;
- environment/profile/base-ref diagnostics;
- other existing detailed verifier metadata.

Verbose mode must not change verification semantics, selected proof, exit status, timeout behavior, or log persistence. It changes presentation only.

CI may intentionally use verbose output where full job logs are desirable. That does not make verbose output the default coding-agent contract.

## Failure-detail extraction

Keep extraction narrow and trustworthy.

Prefer, in order:

1. verifier-owned invalid/timeout/blocking-log reason;
2. structured or stable reporter summary already produced by the owned command;
3. a small bounded relevant excerpt;
4. no inferred reason beyond exit failure, with an exact log pointer.

Do not create brittle regex catalogues for every dependency merely to avoid opening a log. Add a specialized extractor only when a stable current command contract makes it materially more actionable and simpler overall.

Any excerpt has a hard line/character bound and strips terminal-control noise where practical.

## Acceptance criteria

Implementation must prove at minimum:

- default mode does not stream ordinary child stdout/stderr;
- very large child output does not grow normal terminal output proportionally;
- a multi-check run reports runnable check index/total and completion;
- a long quiet check emits bounded heartbeat/liveness output at the preserved 60-second cadence;
- default heartbeat does not echo the child's last output line;
- heartbeat includes the owning log path and verifier-owned timeout when applicable;
- a failed check prints a bounded actionable summary, exact detailed log path, and focused rerun command;
- normal successful completion does not enumerate every skipped lane or routine trigger reason;
- `--verbose` still exposes detailed/raw diagnostics without changing execution semantics;
- invalid pre-execution plans remain actionable even though no child log exists;
- timeout failures remain actionable and point to the captured log;
- existing `verify:status` / `verify:resume` and command-lock recovery semantics remain intact.

Tests should assert the verifier presentation contract through deterministic captured output/helper seams. Do not execute expensive real Playwright/build/release work merely to prove formatting/progress behavior.

## Forbidden

- Streaming raw child output by default.
- Echoing the last child-output line in normal heartbeats.
- Printing unbounded output tails, stack traces, changed-file lists, skipped-lane lists, or trigger-reason lists in normal mode.
- Treating `--verbose` as the normal coding-agent command.
- Hiding all progress until a long command exits.
- Changing the 60-second heartbeat cadence without measured evidence that the current cadence is inadequate.
- Fake percentages or completion estimates not supplied by the owning tool.
- High-frequency progress chatter.
- A second logging/progress framework beside the current verifier execution/log/lock mechanisms.
- Lane-specific presentation metadata that duplicates existing planner reasons.
- Discarding detailed logs merely to keep terminal output short.
- Making presentation changes alter selected checks, exit semantics, retry policy, or proof ownership.
