---
name: verification
description: 'Use to execute verify-managed checks, choose focused command scope after the owning test layer is known, use fix mode safely, interpret failures and warnings, avoid duplicate expensive runs, and report final TASK RESULT and VERIFY RESULT.'
---

# Verification workflow

Follow `docs/testing/architecture.md` to decide what proof a change requires. This skill executes that decision through repository commands. It does not choose the owning test layer and must not treat inferred scope as proof that no additional focused check is required.

## Core completion rule

After code edits, before reporting completion, run read-only:

```bash
pnpm verify
```

Do not replace the final gate with manually selected commands. Do not use `--fix` for the final check.

A coding agent must not report `done`, `fixed`, `ready`, or equivalent completion after code edits without the final local `pnpm verify` result. If it was not run, report `not run`, explain why, and name the exact remaining command.

`TASK RESULT: complete` confirms only the assigned implementation scope and local evidence. It does not approve architecture, GitHub CI, PR review, operator visual acceptance, merge readiness, or product-task closure.

## Ownership before execution

Before selecting a command:

1. identify the changed contract;
2. select its owning test layer through `docs/testing/architecture.md` and the relevant testing skill;
3. run the narrowest verify-managed command that exercises that owner;
4. add explicit paths when the inferred scope does not include required browser, visual, consumer, or mutation proof.

Risk resolvers optimize execution. A skipped or empty inferred lane is not evidence that the lane is unnecessary.

## Focused checks during implementation

Use verify-managed checks whenever a matching label exists:

```bash
pnpm verify --only format --files <paths...>
pnpm verify --only oxlint --files <paths...>
pnpm verify --only eslint --files <paths...>
pnpm verify --only type-check
pnpm verify --only unit-tests --files <paths...>
pnpm verify --only e2e --files <paths...>
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only visual --files <paths...>
pnpm verify --only mutation --files <paths...>
```

Focused checks provide fast feedback but do not replace final verification.

Do not invoke raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, visual, e2e, or Stryker commands as completion gates. Raw underlying commands are allowed only for narrow diagnostics after a verify-managed failure or when the verify runner cannot express the required mode. Report them as diagnostics and return to verify-managed checks.

## Mutation execution

Mutation testing is never selected solely because a changed source file has a sibling test. Run it only after the explicit activation check in `mutation-testing` passes:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Do not run broad or full mutation checks for ordinary tasks. Mutation score is not a general completion target.

## Browser and visual execution

When a change affects browser-owned behavior, explicitly run the owning Storybook behavior or app e2e spec even if final `pnpm verify` would infer an empty scope.

Examples include navigation, focus, keyboard, pointer/touch, clickable targets, disabled or readonly behavior, scrolling, overlays, responsive behavior, browser capabilities, persistence, provider integration, import/export, authentication, or another complete user scenario.

```bash
pnpm verify --only storybook-behavior --files tests/e2e/storybook/<relevant>.spec.ts
pnpm verify --only e2e --files tests/e2e/<relevant>.spec.ts
```

For intentional visible changes, run the focused visual lane after any required baseline update and inspection:

```bash
pnpm verify --only visual --files <story-source-or-visual-spec-paths...>
```

If no focused browser or visual spec exists and adding one would broaden the task, report the gap and run the nearest faithful verify-managed coverage. Do not treat a less faithful unit test as equivalent proof.

## Fix mode

Use fix mode only when safe automatic formatting or lint fixes are useful:

```bash
pnpm verify --fix
```

Do not run fix mode merely because implementation is complete. Inspect generated or autofixed changes before continuing. After instruction-tree edits, use fix mode to regenerate agent compatibility files as required by root `AGENTS.md`.

Do not run `--fix` for the final read-only gate.

## Final and release gates

Development completion:

```bash
pnpm verify
```

Release verification:

```bash
pnpm verify --full
```

Use the full gate only when required by release policy or the task. Do not substitute a full suite for missing focused proof during implementation; a broad green run may still fail to diagnose the changed contract.

## Mode-specific verification

When changing tooling, scripts, CI, Storybook, Playwright, build config, package scripts, or command output, verify every user-visible mode touched by the change.

Examples:

- verify script changes: default mode and affected `--only`, `--fix`, `--verbose`, resume, or full modes;
- Storybook config or harness changes: affected Storybook build, behavior, or visual mode;
- Playwright config changes: every affected project or config lane;
- resolver changes: focused resolver unit tests plus representative command planning for the affected lane;
- package or build config changes: affected type-check, build, artifact, or release mode.

Final `pnpm verify` does not replace a mode that it does not exercise.

## Verification process ownership

Local coding agents work with repository files and local commands. GitHub CI, PR metadata, review threads, and merge decisions remain outside their completion scope unless explicitly assigned to a GitHub-capable assistant.

Unless the task explicitly targets verification infrastructure, treat the verify runner and its container/browser runtime as an opaque project boundary. Report the failed verify step and its output rather than bypassing repository commands or independently reconfiguring Podman, Docker, sockets, runtime directories, or container internals.

If safe CI autofix commits changes to the branch, synchronize the local checkout before continuing so implementation and final verification use the actual branch head.

## Failure handling

If a verify-managed check fails:

1. identify the exact failed label and command from the summary;
2. determine whether the failure is caused by the current change;
3. fix the issue when it belongs to the task;
4. rerun the narrow failed check through `pnpm verify --only <label>`;
5. rerun final `pnpm verify` before reporting completion;
6. if unrelated or unresolved, report the exact command, relevant output, and remaining risk;
7. never claim completion while required verification is failing or missing.

If verification is already active:

1. run `pnpm verify:status`;
2. inspect `.verify/logs`;
3. run `pnpm verify:resume` only when status reports that the run is ready to resume;
4. ask the user when status reports that a user decision is required.

Use only `pnpm verify`, `pnpm verify:status`, and `pnpm verify:resume` for verification state. Do not start a duplicate expensive run.

## Warning handling

Treat warnings in touched files or touched modes as work, not harmless noise.

After final verification:

1. inspect warning summaries;
2. fix warnings caused by the current change, especially lint, accessibility, deprecation, Storybook, Playwright, type, or mutation warnings;
3. classify any remaining warning as pre-existing, unrelated, or intentionally deferred;
4. do not describe the result as clean when new warnings remain.

Report `passed with CI-profile risk` exactly when the verify summary does; do not collapse it to plain `passed`.

## Avoid duplicate work

- Do not run the same broad verification twice without an intervening edit or a resumed interrupted run.
- Do not run `pnpm verify --fix` after a passing final verify unless a new edit was made.
- Do not run full e2e, visual, mutation, lint, or type-check manually when focused owner-specific proof is sufficient.
- Do not start manual expensive checks while verification is active.
- Use summary-first output by default and `--verbose` only for diagnostics.

## Task status

Report exactly one:

- `complete`: all assigned scope, acceptance criteria, owner-specific proof, and required final verification pass with no required work remaining;
- `partial`: useful work exists, but required scope, cleanup, documentation, warnings, or verification remains;
- `blocked`: further progress requires an unresolved decision, unavailable input, unavailable capability, or handoff change that the agent cannot resolve.

A failed, skipped, unavailable, or incomplete required check makes the task `partial` or `blocked`, never `complete`. Use `blocked` only when the agent cannot continue independently.

## Final response

Always include after edits:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining required work, verification, or blocker>

VERIFY RESULT
command: pnpm verify
status: passed | failed | not run | blocked by active local verification
reason if not run:
```
