---
name: verification
description: 'Use to run verifier-managed project checks, apply focused overrides and safe fix mode, interpret failures, avoid duplicate expensive runs, and report TASK RESULT and VERIFY RESULT.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. For Storybook-owned UI proof also follow `docs/testing/storybook.md`; `docs/testing/migration-plan.md` is the source of truth for which target discovery/ownership mechanisms are currently implemented.

The agent designs appropriate proof and maintains required workspace ownership facts. The verifier independently selects checks from readable workspace files, supported local ownership conventions, snapshots, and persistent project mappings. It never reads `TEST IMPACT` prose.

A skipped or empty lane is not evidence that the proof type is unnecessary. When ownership is incomplete or unresolved, fix the durable relation or use the owning lane's documented full fallback.

## Command scope

Use documented project commands and readable outputs. When a command fails before reaching its relevant project check, record the exact command and visible failure. Do not infer a cause that is not shown by command output.

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

Raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, visual, E2E, or mutation commands are narrow diagnostic exceptions only. Return to a verifier-managed command for accepted proof.

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

During the browser migration, migrated `src/**/*.browser.spec.ts` specs use the implemented filesystem-derived owner-local convention and require no duplicate central registry entry. Specs still executed from `tests/e2e/storybook` remain legacy-central and must continue to satisfy the current resolver's mapping/validation requirements. Do not move an additional spec until the current migration stage authorizes that owner and the lane can discover it.

Colocated `src/**/*.browser.spec.ts` files are Playwright proof inputs only. Automatic unit-test scope must not classify them as Vitest tests merely because their filenames end in `.spec.ts`; unit selection follows the Vitest-owned test patterns and keeps browser proof in the `storybook-behavior` lane.

Application E2E remains centralized and therefore continues to use explicit stable source-to-product-scenario impact rather than component colocation.

## Visual baselines

Visual discovery and snapshot ownership are mixed: owners `docs/testing/migration-plan.md` records as authorized/migrated use the owner-local `<Owner>.visual.spec.ts` / `<Owner>.visual.spec.ts-snapshots/` convention from `docs/testing/storybook.md`; every other owner remains in the current central `tests/e2e/visual` location until its own migration stage.

For intentional visual changes:

- inspect every baseline change;
- run the owning visual proof through verifier-managed commands;
- use the owner-local snapshot convention for owners `docs/testing/migration-plan.md` has already migrated;
- preserve the current central executable snapshot convention for every other owner until its migration is merged;
- unresolved baseline ownership uses full visual fallback.

Colocated `src/**/*.visual.spec.ts` files are Playwright visual proof inputs only. Automatic unit-test scope must not classify them as Vitest tests merely because their filenames end in `.spec.ts`; unit selection follows the Vitest-owned test patterns and keeps visual proof in the `visual` lane.

A passing screenshot comparison does not prove Material correctness or browser behavior.

## Mutation

A focused mutation audit may run after focused deterministic tests pass:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Use persistent registered high-risk ownership when implemented. Do not infer semantic applicability merely from neighboring files or agent prose.

When `pnpm verify:release` is the final gate, complete required mutation proof beforehand because mutation is intentionally outside release mode.

## Release-sensitive proof

A task changing build/release configuration, routing/base paths, manifest/PWA/service-worker/channel isolation, release scripts, artifact assembly, or production-output dependencies requires the release-sensitive final gate selected by repository policy.

Do not run both ordinary and release final gates as competing completion evidence.

## Performance evidence

For a one-off performance, memory, startup, main-thread, or bundle-size claim:

1. run the reproducible measurement named in preflight;
2. use the recorded representative scenario/setup;
3. report baseline/budget and measured result;
4. rerun after implementation when comparison is required;
5. run the one applicable final completion gate.

A durable product budget belongs in an automated check with stable impact ownership. Do not create permanent benchmark infrastructure for one task.

## Fix mode

When only automatic formatting, lint fixes, or instruction compatibility generation is needed:

```bash
pnpm verify --fix-only
```

Inspect resulting file changes. Fix mode never replaces the final read-only gate.

## Final completion gate

The top-level task owns exactly one final read-only completion gate after all edits and focused proof are complete.

Ordinary task:

```bash
pnpm verify
```

Release-sensitive task:

```bash
pnpm verify:release
```

When branch-diff scope is required by repository/workflow rules, preserve that exact base in the final command.

A broad passing run does not replace missing proof, stale ownership metadata, architecture review, required measurements, or a concrete reported visual/motion defect.

## Mode-specific changes

When verifier tooling, Storybook, Playwright configuration, resolver logic, build configuration, package scripts, or command output changes, verify every affected user-visible mode during focused development proof.

Examples:

- path planner: added/removed/moved cases;
- resolver: table-driven resolver tests plus representative command planning;
- Playwright discovery: every affected lane and both legacy/new paths during migration;
- Storybook harness: affected build, behavior, and visual modes;
- release resolver: focused planning and unconditional full release mode.

Mode-specific focused proof is not another final gate.

## Failure handling

When a required check, ownership validation, or measurement fails:

1. identify the failed label/plan/command/metric;
2. determine whether current changes caused it;
3. fix in-scope failures or stale ownership facts;
4. rerun the narrow failed proof through `pnpm verify --only <label>` while preserving applicable scope;
5. after fixes, rerun the original final completion-gate command without fix mode;
6. report unrelated/unresolved failures exactly;
7. never claim completion while required verification/evidence is missing or failing.

Do not substitute a raw child command printed by a failed step for the verifier-managed rerun.

If verification is active, use `pnpm verify:status` and `pnpm verify:resume` according to repository output rather than starting duplicate expensive runs.

## Warnings

Fix warnings caused by the current change. Classify remaining warnings as pre-existing, unrelated, or intentionally deferred.

## Final response

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining required work, verification, or blocker>

VERIFY RESULT
command: <exact final completion-gate command>
status: passed | failed | not run | blocked by active local verification
reason if not run:
```

`complete` requires assigned scope, acceptance criteria, required proof/measurements, consistent durable ownership facts, and the one applicable final completion gate to pass.
