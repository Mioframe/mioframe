---
name: verification
description: 'Use to run verifier-managed focused project checks for local development feedback, apply safe fix mode, interpret failures, and hand final exact-head verification to GitHub CI.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. For Storybook-owned UI proof also follow `docs/testing/storybook.md`; `docs/testing/migration-plan.md` is the source of truth for which target discovery/ownership mechanisms are currently implemented.

The coding agent owns implementation feedback and task-specific proof. GitHub CI owns the final repository verification for a pull request on its exact head. Do not duplicate the CI gate locally merely to declare the coding task complete.

A skipped or empty local lane is not evidence that the proof type is unnecessary. Required contract proof must still exist and be owned correctly; CI is not a substitute for missing tests, stale ownership metadata, architecture review, required measurements, or visual evidence.

## Local verification purpose

Local verification exists to give the coding agent fast, relevant feedback while implementing or correcting code.

Use the smallest verifier-managed scope that faithfully proves the changed contract. Run broader local checks only when the changed risk or a failure diagnosis requires them.

A coding task may be complete without a local full-project `pnpm verify` when:

- the requested implementation is complete;
- required task-specific proof exists;
- relevant focused checks have passed, or any omitted local check is intentionally delegated to CI;
- no known in-scope failure remains.

The architect owns PR creation, exact-head CI review, and merge readiness.

## Focused execution

Use verifier-managed labels:

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

Raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, visual, E2E, or mutation commands are narrow diagnostic exceptions only. Return to a verifier-managed command for accepted local proof.

## Mode constraints

- Unknown, positional, or repeated arguments are rejected rather than silently changing scope.
- `--full` is unconditional full-project scope and must not be combined with `--files`.
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

A focused mutation audit may run after focused deterministic tests pass:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Use persistent registered high-risk ownership when implemented. Do not infer semantic applicability merely from neighboring files or agent prose.

## Release-sensitive work

Build/release configuration, routing/base paths, manifest/PWA/service-worker/channel isolation, release scripts, artifact assembly, or production-output dependency changes may require release-sensitive proof.

The coding agent runs focused local release-sensitive checks when useful for implementation feedback. The authoritative final release/merge gate is the required GitHub CI workflow for the exact PR head. Do not run a second broad local gate solely to duplicate CI.

## Performance evidence

For a one-off performance, memory, startup, main-thread, or bundle-size claim:

1. run the reproducible measurement named in preflight;
2. use the recorded representative scenario/setup;
3. report baseline/budget and measured result;
4. rerun after implementation when comparison is required.

A durable product budget belongs in an automated check with stable impact ownership. Do not create permanent benchmark infrastructure for one task.

## Fix mode

When only automatic formatting, lint fixes, or instruction compatibility generation is needed:

```bash
pnpm verify --fix-only
```

Inspect resulting file changes. Fix mode is development tooling; it does not replace CI and does not itself prove correctness.

## CI merge gate

For pull-request work, GitHub CI is the authoritative final repository verification because it runs against the exact published PR head in the controlled CI environment.

The coding agent does not own this gate and must not delay handoff merely because a full local `pnpm verify` has not been run.

The architect must not recommend merge until all required exact-head CI checks are green and the implementation has passed architecture/review requirements.

If CI fails:

1. identify the failed CI contract and exact output;
2. route the failure to the correct owner;
3. fix in-scope failures;
4. run the smallest relevant verifier-managed local check for feedback;
5. push the correction and let CI rerun the authoritative exact-head gate.

Do not require a full local rerun after every correction unless it is materially useful for diagnosis.

## Mode-specific changes

When verifier tooling, Storybook, Playwright configuration, resolver logic, build configuration, package scripts, or command output changes, verify every affected user-visible mode during focused development proof.

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
4. rerun the narrow failed proof through `pnpm verify --only <label>` while preserving applicable scope;
5. report unrelated/unresolved failures exactly.

Do not substitute a raw child command printed by a failed step for the verifier-managed rerun.

If verification is active, use `pnpm verify:status` and `pnpm verify:resume` according to repository output rather than starting duplicate expensive runs.

## Warnings

Fix warnings caused by the current change. Classify remaining warnings as pre-existing, unrelated, or intentionally deferred.

## Final response

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL VERIFY RESULT
commands: <focused verifier-managed commands actually run, or none>
status: passed | failed | partial | not run
reason if partial/not run: <reason>

CI GATE
status: not owned by coding agent
```

`complete` requires assigned implementation scope, acceptance criteria, required task-specific proof, and no known in-scope failure. It does not require the coding agent to duplicate the PR CI gate locally.
