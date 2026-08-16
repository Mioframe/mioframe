---
name: verification
description: 'Use the canonical automatic pnpm verify workflow for coding-agent handoff, with focused verifier-managed reruns only when useful during implementation or diagnosis, and hand final exact-head verification to GitHub CI.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. For Storybook-owned UI proof also follow `docs/testing/storybook.md`; `docs/testing/migration-plan.md` is the source of truth for which target discovery/ownership mechanisms are currently implemented.

The coding agent owns implementation feedback, task-specific proof, and one final automatic local `pnpm verify` handoff run. GitHub CI owns the final repository verification for a pull request on its exact head. Ordinary `pnpm verify` is not a full-project CI duplicate: it resolves the current workspace diff to the smallest workspace-backed verification plan. Only `pnpm verify --full` / `pnpm verify:release` is unconditional full-project release verification.

A skipped or empty local lane is not evidence that the proof type is unnecessary. Required contract proof must still exist and be owned correctly; CI is not a substitute for missing tests, stale ownership metadata, architecture review, required measurements, or visual evidence.

## Execution environment

Mioframe's canonical verifier entry points are `pnpm verify ...`, `pnpm verify:release`, `pnpm verify:status`, and `pnpm verify:resume`. These repository-owned commands are the controlled verification boundary: they own verification scope, command coordination and locking, timeouts, resource limits, and the project-managed container path for browser checks.

Keep the coding-agent runtime's sandbox and permission system enabled. The verifier entry points are a narrow project-approved exception that may run outside the generic agent sandbox only through the runtime's own command-scoped mechanism: an existing allow/exclusion rule or an explicit per-command approval/escalation request. Repository instructions do not themselves disable or bypass runtime permission checks.

Do not broaden this exception to generic `pnpm`, `node`, shell interpreters, arbitrary package scripts, or unrestricted/full-access execution. If a persistent runtime rule is proposed, scope it to the verifier entry point needed for the workflow rather than a general executable prefix.

If sandbox restrictions prevent a verifier invocation from reaching its project-owned execution path, keep the command unchanged and use the runtime's normal narrowly scoped approval/escalation flow. Treat the sandbox block as an execution-environment failure, not as evidence that the verifier or tested contract failed. Do not bypass the verifier by substituting raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, build, visual, mutation, or other child commands.

## Local verification purpose

Local verification exists to give the coding agent fast, relevant feedback while implementing or correcting code and to produce one canonical agent-facing summary before handoff.

During implementation, use focused verifier-managed checks only when they materially shorten the feedback loop for the contract currently being edited or diagnose a failure. They are optional iteration tools, not a mandatory checklist.

When implementation and required proof are ready for handoff, run:

```bash
pnpm verify
```

This is the default final local coding-agent verification. It automatically resolves changed paths, selects the smallest supported checks, applies safe full-lane fallback where impact is unknown, and prints the aggregated `VERIFY RESULT` with failures, warnings, skipped lanes, trigger reasons, logs, and actions required.

Do not mechanically run format, lint, type-check, unit, browser, visual, E2E, mutation, or other lanes one-by-one and then immediately repeat the same work through `pnpm verify`. If no focused feedback is needed, run the final automatic `pnpm verify` directly. If a focused check was useful during implementation, do not expand that into a complete per-label checklist before the final automatic run.

If the final automatic run fails, use the smallest relevant `pnpm verify --only <label>` rerun while correcting that failure when useful, then run the original automatic `pnpm verify` once after the corrections are stable. Do not rerun every unaffected label individually.

A task may hand back with a partial local verification result only when the final automatic `pnpm verify` cannot complete for a concrete environment, unrelated repository, or unresolved external blocker. Report the exact blocker and do not replace the automatic run with a manually assembled list of labels.

The architect owns PR creation, exact-head CI review, and merge readiness.

## Focused execution

Focused execution is for intermediate feedback, diagnosis, or a narrow rerun after a failed automatic check. Use verifier-managed labels when that narrower iteration is materially useful:

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

`--files` names readable existing paths. Removed, moved, or uncertain ownership must be handled by automatic status-aware planning or a full owning-lane fallback, not by passing nonexistent paths.

Do not use `--only` to reconstruct the final verification plan manually. The automatic `pnpm verify` planner owns that decision for handoff.

Raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, visual, E2E, or mutation commands are narrow diagnostic exceptions only. Return to a verifier-managed command for accepted local proof.

## Mode constraints

- Unknown, positional, or repeated arguments are rejected rather than silently changing scope.
- `pnpm verify` without `--full` is automatic changed-workspace verification and is the normal coding-agent handoff command.
- `--full` is unconditional full-project scope and must not be combined with `--files`.
- `pnpm verify --full` / `pnpm verify:release` is not the normal coding-agent handoff path unless the task explicitly requires release/full-project proof.
- Release-only labels require `--full`.
- Mutation is targeted and is not available as `--full --only mutation`.
- Fix modes are limited to checks that actually own safe automatic fixes.

## Automatic scope

The durable automatic planner may use workspace facts such as:

- added, modified, removed, and moved paths;
- directly changed tests/specs;
- snapshot ownership;
- supported unit related-test resolution and safe unit fallback;
- deterministic owner-local Storybook behavior/visual relations when implemented;
- explicit non-local Storybook, application E2E, release, mutation, and other stable mappings;
- full-lane paths and justified infrastructure/standalone specs;
- persistent project applicability metadata;
- persistent performance checks.

Migrated lanes resolve to `skip`, `focused`, `full`, or blocking `invalid` with inspectable reasons. Unknown relevant impact selects the full owning lane.

Do not describe planned resolver behavior as already implemented. Use current verifier output plus `docs/testing/migration-plan.md` to distinguish executable state from target architecture.

## Storybook and Playwright ownership

For Storybook behavior and visual proof:

- ordinary UI-owned relations should use deterministic local owner convention once the lane supports it;
- do not add duplicate registry entries merely to mirror a supported colocated relation;
- family/module/cross-file/cross-cutting relations use the smallest truthful explicit mapping when local naming cannot express ownership;
- Storybook infrastructure smoke may remain justified standalone;
- shared Storybook/Playwright configuration and broad helpers normally select the full owning lane;
- any Playwright config whose `testDir` scans from repository root must respect repository ignore policy so ignored nested/local workspaces cannot contribute specs; prefer Playwright's `respectGitIgnore` over a parallel hard-coded exclusion list;
- removed/moved/unresolved relevant ownership must fall back safely or fail validation, never skip silently.

During the browser migration, migrated `src/**/*.browser.spec.ts` specs use the implemented filesystem-derived owner-local convention and require no duplicate central registry entry. Specs still executed from `tests/e2e/storybook` remain legacy-central and must continue to satisfy the current resolver's mapping/validation requirements.

Colocated `src/**/*.browser.spec.ts` and `src/**/*.visual.spec.ts` are Playwright proof inputs only. Automatic unit-test scope must not classify them as Vitest tests merely because their filenames end in `.spec.ts`.

Application E2E remains centralized and therefore continues to use explicit stable source-to-product-scenario impact rather than component colocation.

## Visual baselines

Visual discovery and snapshot ownership are mixed: owners `docs/testing/migration-plan.md` records as authorized/migrated use the owner-local `<Owner>.visual.spec.ts` / `<Owner>.visual.spec.ts-snapshots/` convention from `docs/testing/storybook.md`; every other owner remains in the current central `tests/e2e/visual` location until its own migration stage.

For intentional visual changes:

- inspect every baseline change;
- run the owning visual proof through verifier-managed commands;
- use the owner-local snapshot convention for owners already migrated;
- preserve the current central executable snapshot convention for every other owner;
- unresolved baseline ownership uses full visual fallback.

A passing screenshot comparison does not prove Material correctness or browser behavior.

## Mutation

A focused mutation audit may run after focused deterministic tests pass when mutation-specific feedback is actually required:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Use persistent registered high-risk ownership when implemented. Do not infer semantic applicability merely from neighboring files or agent prose. Do not add a separate mutation run merely because mutation may also be selected by the final automatic `pnpm verify`.

## Release-sensitive work

Build/release configuration, routing/base paths, manifest/PWA/service-worker/channel isolation, release scripts, artifact assembly, or production-output dependency changes may require release-sensitive proof.

Use the normal automatic `pnpm verify` for coding-agent handoff unless the implementation contract explicitly requires a release/full-project local gate. `pnpm verify --full` / `pnpm verify:release` remains an explicit release verification mode, not a synonym for ordinary final local verification. The authoritative final release/merge gate is the required GitHub CI workflow for the exact PR head.

## Performance evidence

For a one-off performance, memory, startup, main-thread, or bundle-size claim:

1. run the reproducible measurement named in preflight;
2. use the recorded representative scenario/setup;
3. report baseline/budget and measured result;
4. rerun after implementation when comparison is required.

A durable product budget belongs in an automated check with stable impact ownership. Do not create permanent benchmark infrastructure for one task.

## Fix mode

When automatic formatting, lint fixes, or instruction compatibility generation is needed:

```bash
pnpm verify --fix-only
```

Inspect resulting file changes. Fix mode is development tooling; it does not replace the final automatic `pnpm verify` and does not itself prove correctness.

## CI merge gate

For pull-request work, GitHub CI is the authoritative final repository verification because it runs against the exact published PR head in the controlled CI environment.

The coding agent owns the optimized automatic local handoff run (`pnpm verify`) but does not own or duplicate unconditional full-project/release CI verification locally. Do not require `pnpm verify --full` or `pnpm verify:release` merely to hand work back to the architect.

The architect must not recommend merge until all required exact-head CI checks are green and the implementation has passed architecture/review requirements.

If CI fails:

1. identify the failed CI contract and exact output;
2. route the failure to the correct owner;
3. fix in-scope failures;
4. run the smallest relevant verifier-managed local check for feedback when useful;
5. before handoff of that correction, run the automatic `pnpm verify` once on the corrected workspace;
6. push the correction and let CI rerun the authoritative exact-head gate.

Do not precede that final automatic run with a redundant complete checklist of `--only` lanes.

## Mode-specific changes

When verifier tooling, Storybook, Playwright configuration, resolver logic, build configuration, package scripts, or command output changes, verify every affected user-visible mode during implementation proof.

Prefer resolver/unit/command-planning tests that exercise the affected modes as part of the code's normal proof, then let the final automatic `pnpm verify` select executable lanes. Use separate `--only` invocations only when they materially improve iteration or diagnose a failure; do not execute every affected mode separately merely to repeat it in the final automatic run.

Examples:

- path planner: added/removed/moved cases;
- resolver: table-driven resolver tests plus representative command planning;
- Playwright discovery: every affected lane and both legacy/new paths during migration;
- Storybook harness: affected build, behavior, and visual modes;
- release resolver: focused planning for the affected mode.

## Failure handling

When a local required check, ownership validation, or measurement fails:

1. identify the failed label/plan/command/metric;
2. determine whether current changes caused it;
3. fix in-scope failures or stale ownership facts;
4. rerun the narrow failed proof through `pnpm verify --only <label>` only when useful for the correction loop;
5. once corrections are stable, rerun the original automatic `pnpm verify` once for handoff;
6. report unrelated/unresolved failures exactly.

Do not substitute a raw child command printed by a failed step for the verifier-managed rerun. Do not rerun all successful labels individually before the final automatic run.

If verification is active, use `pnpm verify:status` and `pnpm verify:resume` according to repository output rather than starting duplicate expensive runs.

## Warnings

Fix warnings caused by the current change. Classify remaining warnings as pre-existing, unrelated, or intentionally deferred.

## Final response

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL VERIFY RESULT
commands: <final pnpm verify, plus only focused verifier-managed commands that were actually useful during implementation/diagnosis>
status: passed | failed | partial | not run
reason if partial/not run: <reason the final automatic pnpm verify could not complete>

CI GATE
status: not owned by coding agent
```

`complete` requires assigned implementation scope, acceptance criteria, required task-specific proof, no known in-scope failure, and an attempted final automatic `pnpm verify` handoff run. A concrete unrelated/environment blocker may make `LOCAL VERIFY RESULT` partial without changing implementation completeness, but the blocker must be reported exactly. `complete` does not require the coding agent to run `pnpm verify --full` / `pnpm verify:release` or duplicate the exact-head PR CI gate locally.
