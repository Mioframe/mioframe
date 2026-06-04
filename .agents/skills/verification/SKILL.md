---
name: verification
description: 'Use this skill when choosing targeted checks, using pnpm verify --fix, interpreting verification failures or warnings, avoiding duplicate verification runs, or preparing the final VERIFY RESULT report. Final completion after edits requires read-only pnpm verify.'
---

# Verification workflow

Use this skill to verify changes without wasting time on duplicated or overly broad checks.

## Core rule

Before reporting completion after edits, run the read-only repository verification:

```bash
pnpm verify
```

Do not replace the final read-only check with manually selected commands. Do not use `--fix` for the final check.

A local coding agent must not report "done", "fixed", "ready", or equivalent completion after code edits unless it includes the final local `pnpm verify` result. If `pnpm verify` was not run, the work is not complete; say `not run`, explain why, and list the exact remaining command.

Local coding agents work only with repository files and local commands. Do not treat GitHub CI, PR threads, PR metadata, reviewer requests, or bot comments as actions the local coding agent can complete. Leave GitHub state for the reviewer unless the user explicitly assigns GitHub work to a GitHub-capable assistant.

## When to use fix mode

Use fix mode only when automatic formatting or lint fixes are useful:

```bash
pnpm verify --fix
```

Do not run fix mode just because a task is complete. Do not run fix mode and then immediately repeat the same broad manual commands unless the output shows a specific failure that needs targeted follow-up.

## During implementation

Use the narrowest useful check for the current change:

- run focused unit tests for touched logic with sibling tests;
- run focused Playwright specs for changed e2e files or UI flows;
- run `pnpm type-check` for TypeScript, Vue, config, package, or test changes;
- run targeted lint/format commands only when editing code style or fixing lint output.

Prefer the project `pnpm verify` script when it can infer the changed-file scope. It already runs changed-file formatting, lint, type-check, focused Vitest, changed Playwright specs, and narrow Stryker scope when applicable.

Do not treat skipped e2e from `pnpm verify` as sufficient when the change can affect user-visible behavior. Changed component or application code can break browser behavior even when no e2e spec file changed, and `pnpm verify` may not infer that scope automatically.

Run the relevant focused Playwright spec when changing behavior that affects navigation, focus or keyboard interaction, clickable targets, disabled or readonly states, ripples, permissions, persistence, provider integration, import/export, authentication, or any complete user scenario. If no focused spec exists, say so and run the nearest available coverage instead of treating the skipped e2e check as proof that e2e is unnecessary.

When a user-flow change needs e2e coverage but `pnpm verify` cannot infer it, pass the spec explicitly:

```bash
pnpm verify --only e2e --files tests/e2e/relevant-flow.spec.ts
```

`pnpm verify --only e2e` alone is not a forced e2e run when the inferred e2e scope is empty.

`pnpm verify` uses summary-first terminal output by default:

- passed checks print concise status lines;
- failed checks print the check label, exact command, exit code, relevant output tail, and log path;
- warning-only checks print a warning summary and log path;
- full command logs are written per check under `.verify/logs/`.

Use `pnpm verify --verbose` when you need full streamed command output in the terminal. It is a diagnostic mode, not a separate quality gate.

## Mode-specific verification

When changing tooling, scripts, CI, Storybook, Playwright, build config, package scripts, or command output, verify every user-visible mode touched by the change.

Examples:

- verify script changes: check default mode, `--fix`, and `--verbose` when affected;
- GitHub Actions changes: ensure the workflow command still exposes useful logs and annotations;
- Storybook changes: run the Storybook build or the narrow visual command that exercises the changed config;
- Playwright config changes: run the affected project or config, not only a generic unit test;
- package, dependency, or config changes: run type-check or build when runtime behavior or generated types can be affected.

Do not rely on final `pnpm verify` alone when the changed behavior is a mode that `pnpm verify` does not exercise directly.

## Failure handling

If `pnpm verify` fails:

1. Identify the exact failed command from the VERIFY RESULT summary.
2. Fix the failure if it is caused by the current change.
3. Rerun the narrow failed command when possible.
4. Rerun final `pnpm verify` before reporting completion.
5. If the failure is unrelated or cannot be fixed, report the exact failing command and relevant output.
6. Do not claim the task is complete while final verification is failing.
7. If `pnpm verify` is blocked because another local verification is active, do not rerun it immediately. Run `pnpm verify:status`, inspect `.verify/logs`, and report the block clearly.

## Warning handling

Treat warnings in touched files as follow-up work, not as harmless noise.

After final verification:

1. Inspect warning-only summaries when `pnpm verify` reports them.
2. Fix warnings caused by the current change, especially lint, accessibility, deprecation, Storybook, Playwright, type, or mutation warnings.
3. If a warning remains, explicitly state whether it is pre-existing, unrelated, or intentionally deferred.
4. Do not describe the result as clean when new warnings remain in touched files.

## Avoid duplicate checks

Do not run the same broad verification twice without a code or documentation change between runs.

Do not run `pnpm verify --fix` after a passing `pnpm verify` unless a new edit was made.

Do not run full e2e, full lint, or full mutation checks manually when the task only needs the inferred changed-file scope, unless explicitly requested or required by the failure.

Do not start manual e2e, visual, mutation, full lint, or full type-check commands while the local verify lock is active. `CI=true` outside GitHub Actions does not bypass local verification locks.

## Final response

Always include this verification block after edits:

```text
VERIFY RESULT
command: pnpm verify
status: passed | failed | not run | blocked by active local verification
reason if not run:
```

Also include the `BRV RESULT` block required by the root `AGENTS.md`. Use the `byterover` skill to decide whether it is `curated`, `skipped`, `failed`, or `not available`.

Use `not run` only when no repository verification could reasonably be run, such as documentation-only changes made through a remote editor. State the reason plainly.
