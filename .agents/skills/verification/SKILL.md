---
name: verification
description: 'Use to execute verify-managed checks and task-specific measurements after TEST IMPACT is resolved, use fix mode safely, interpret failures and warnings, avoid duplicate expensive runs, and report final TASK RESULT and VERIFY RESULT.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. `TEST IMPACT` chooses required proof, exact paths, and task-specific measurements. This skill executes that decision through repository commands.

A skipped or empty inferred lane is never evidence that the proof type is unnecessary.

## Focused execution

Use verify-managed labels:

```bash
pnpm verify --only format --files <paths...>
pnpm verify --only oxlint --files <paths...>
pnpm verify --only eslint --files <paths...>
pnpm verify --only type-check
pnpm verify --only unit-tests --files <paths...>
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
pnpm verify --only visual --files <paths...>
pnpm verify --only mutation --files <paths...>
```

Run every focused lane and exact path required by `TEST IMPACT`, even when default inference would skip it. Focused checks do not replace final verification.

Raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, visual, E2E, or Stryker commands are diagnostic exceptions only. Return to verify-managed checks before completion.

## Automatic scope

The verifier may use:

- direct changed unit tests, owning tests for changed Vitest snapshots, and Vitest related-test selection;
- lane-specific fail-closed impact mappings and justified standalone entries for Storybook behavior, app E2E, and visual specs;
- owning visual specs for changed Playwright baselines;
- Playwright tags/project filtering for `@mobile` and `@critical` scenarios;
- full owning-lane fallback for unresolved snapshots, shared config/helpers, deleted unit dependencies, dynamic-import boundaries, or unknown impact.

These mechanisms optimize execution. The agent remains responsible for `TEST IMPACT` and for updating stable Playwright mappings or justified standalone entries in the same change.

## Mutation

A dedicated mutation audit applies only after `mutation-testing` activation passes:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Do not invoke it because a file has a sibling test. Mutation score is not a general completion target.

Until `docs/testing/migration-plan.md` is complete, final `pnpm verify` or CI may still execute broader legacy mutation selection. Do not skip the mandatory final gate because of that temporary behavior, and do not treat an incidental legacy run as evidence that mutation applied to the task.

## Browser, visual, and project selection

Run the exact Storybook behavior, app E2E, and visual specs from `TEST IMPACT`.

Tag app E2E scenarios `@mobile` only for real touch, viewport, responsive composition, overlay, mobile capability, or lifecycle risk. Tag only the small essential cross-platform smoke set `@critical`.

For intentional visual changes, inspect baseline diffs and run the owning visual specs. If a baseline cannot be resolved to its owning spec through the configured snapshot convention, run the full visual lane.

If no faithful test target exists and adding one would broaden the task, report the gap. Do not substitute a less faithful test type.

## Performance evidence

When `TEST IMPACT` names a performance, memory, startup, main-thread, or bundle-size requirement:

1. run the existing benchmark, build check, or reproducible measurement named in preflight;
2. use the recorded representative scenario or dataset and environment;
3. report the metric, budget or baseline, measured result, and comparison;
4. rerun after implementation when a before/after comparison is required;
5. treat the measurement as task-specific evidence when no verify-managed label exists, and still run final `pnpm verify`.

Do not claim an optimization or performance-preserving change without the required measurement. Do not create permanent benchmark infrastructure for one task.

## Fix mode

Use safe autofix only when needed:

```bash
pnpm verify --fix
```

Inspect generated changes. After instruction-tree edits, use fix mode to regenerate compatibility files. Never use `--fix` for the final gate.

## Final and release gates

After code or instruction-tree edits, run read-only:

```bash
pnpm verify
```

Release verification:

```bash
pnpm verify --full
```

A broad green run does not replace missing focused proof, performance evidence, architecture review, operator visual acceptance, PR review, or merge readiness.

## Mode-specific changes

When tooling, scripts, CI, Storybook, Playwright, build config, package scripts, resolver logic, or command output changes, verify every affected user-visible mode.

Examples:

- verify runner: default and affected `--only`, `--fix`, `--verbose`, resume, or full modes;
- resolver: focused resolver tests plus representative command planning;
- Playwright config: every affected project/lane;
- Storybook harness: affected build, behavior, and visual mode;
- package/build config: affected type-check, build, artifact, or release mode.

Final `pnpm verify` does not replace a mode or measurement it does not exercise.

## Process ownership

Local coding agents own repository files and local commands, not GitHub CI, PR metadata, review threads, or merge decisions.

Unless the task targets verification infrastructure, treat container/browser runtime internals as an opaque project boundary. Report the failing verify step rather than bypassing repository commands or reconfiguring Podman/Docker/runtime internals.

If CI autofix commits changes, synchronize the local checkout before continuing.

## Failure handling

When a required check or measurement fails:

1. identify the failed label, command, metric, or budget;
2. determine whether the current change caused it;
3. fix in-scope failures;
4. rerun the narrow failed proof;
5. rerun final `pnpm verify`;
6. report unrelated or unresolved failures exactly;
7. never claim completion while required verification or evidence is missing or failing.

If verification is active, use `pnpm verify:status`, inspect `.verify/logs`, and use `pnpm verify:resume` only when instructed by status. Do not start duplicate expensive runs.

## Warnings

Fix warnings caused by the current change. Classify any remaining warning as pre-existing, unrelated, or intentionally deferred. Preserve `passed with CI-profile risk` wording when reported by the verifier.

## Final response

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining required work, verification, or blocker>

VERIFY RESULT
command: pnpm verify
status: passed | failed | not run | blocked by active local verification
reason if not run:
```

`complete` requires assigned scope, acceptance criteria, required proof and measurements, and final verification to pass. Use `not run` only when repository verification could not reasonably execute; state the reason and exact remaining command.