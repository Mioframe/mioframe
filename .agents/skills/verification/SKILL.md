---
name: verification
description: 'Use to run verifier-managed project checks, apply focused overrides and safe fix mode, interpret failures, avoid duplicate expensive runs, and report TASK RESULT and VERIFY RESULT.'
---

# Verification workflow

Follow `docs/testing/architecture.md`.

The agent designs appropriate proof and maintains workspace impact metadata. The verifier independently selects checks from readable workspace files, test ownership, snapshots, and persistent project mappings. It never reads `TEST IMPACT` prose.

A skipped or empty lane is not evidence that the proof type is unnecessary. When impact metadata is incomplete, fix it or use an explicit owning-lane fallback.

## Workspace boundary

Use only documented project commands and their readable outputs.

- Do not inspect hidden workspace metadata or unrelated environment internals.
- Treat container, browser runtime, and command-runner internals as opaque unless the task explicitly targets them.
- When a command fails before reaching its relevant project check, report the exact command and visible failure. Do not invent or perform environment-repair procedures.

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

Use focused runs for development feedback and explicit existing targets. `--files` represents only the named readable paths; when removed, moved, or uncertain ownership is relevant, use the full owning lane selected by the verifier.

Raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, visual, E2E, or mutation commands are narrow diagnostic exceptions only. Return to a verifier-managed command for accepted proof.

## Mode constraints

- Unknown, positional, or repeated arguments are rejected rather than silently changing scope.
- `--full` is unconditional full-project scope and must not be combined with `--files`.
- Release-only labels require `--full`.
- Mutation is a targeted quality tool and is not available as `--full --only mutation`.
- `--fix --only` and `--fix-only --only` are limited to checks that actually apply safe fixers.

## Automatic scope

The automatic planner uses workspace facts:

- added, modified, removed, and moved paths available to the verifier;
- directly changed tests and specs;
- snapshot ownership;
- static-import related unit selection and safe full-unit fallback;
- Storybook behavior, application E2E, and visual impact mappings;
- release-impact mappings to build, artifact, and release-smoke checks;
- full-lane paths and standalone specs;
- persistent project applicability metadata;
- persistent mutation targets;
- persistent performance checks.

Each lane resolves to `skip`, `focused`, `full`, or blocking `invalid` with inspectable reasons. Unknown relevant impact selects the full owning lane. Full execution never bypasses invalid impact metadata.

Until `docs/testing/migration-plan.md` is complete, do not describe target resolver behavior as already implemented.

## Impact metadata

When adding, moving, renaming, or removing a Playwright spec:

- update its owning lane mapping in the same change;
- map production, story, fixture, or owned support sources only;
- use standalone ownership only when no truthful stable source mapping exists;
- keep shared configuration and helpers on full-lane fallback unless the complete consumer set is explicit and validated.

When changing a release-sensitive contract, maintain its mapping to the exact build, artifact, or release-smoke checks. Shared or unknown release impact uses full release fallback.

A broken mapping must fail verification before tests run.

## Mutation

A focused mutation audit may run after focused deterministic tests pass:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Use persistent registered high-risk source/test pairs. Do not infer semantic applicability merely from neighboring files or agent prose.

When `pnpm verify:release` is the final gate, run required mutation proof beforehand because mutation is intentionally outside release mode.

## Browser and visual proof

Run exact Storybook behavior, application E2E, and visual specs needed for focused feedback when automatic inference is incomplete or impact metadata is being corrected.

Preserve the current application E2E desktop/mobile coverage unless a dedicated audited migration changes project applicability.

For intentional visual changes, inspect baseline diffs and run the owning visual specs. If baseline ownership is unresolved, use the full visual lane.

If no faithful target exists, report and resolve the proof gap when the changed contract requires it. Do not substitute a less faithful proof type.

## Release-sensitive proof

A task changing build configuration, routing/base paths, manifest/PWA/service-worker behavior, channel isolation, release scripts, artifact assembly, or production-output dependencies requires:

```bash
pnpm verify:release
```

This replaces the ordinary final gate for that task. Do not run both as final gates.

## Performance evidence

For a one-off performance, memory, startup, main-thread, or bundle-size claim:

1. run the reproducible measurement named in preflight;
2. use the recorded representative scenario and environment;
3. report the baseline or budget and measured result;
4. rerun after implementation when comparison is required;
5. run the one applicable final completion gate.

A durable product budget belongs in an automated check with impact metadata. Do not create permanent benchmark infrastructure for one task.

## Fix mode

When only automatic formatting, lint fixes, or instruction compatibility generation is needed:

```bash
pnpm verify --fix-only
```

Inspect resulting file changes. `pnpm verify --fix` remains a convenience mode but never replaces the final read-only gate.

## Final completion gate

The top-level task owns exactly one final read-only completion gate after all implementation and focused proof are complete.

Ordinary task:

```bash
pnpm verify
```

Release-sensitive task:

```bash
pnpm verify:release
```

A broad passing run does not replace missing proof, stale impact metadata, performance evidence, architecture review, or operator visual acceptance.

## Mode-specific changes

When verifier tooling, scripts, Storybook, Playwright, build configuration, package scripts, resolver logic, or command output changes, verify every affected user-visible mode during focused development proof.

Examples:

- verifier runner: default and affected `--only`, `--files`, `--fix`, `--fix-only`, `--verbose`, resume, or full modes;
- path planner: added, removed, and moved-file cases;
- resolver: table-driven resolver tests plus representative command planning;
- Playwright configuration: every affected project and lane;
- Storybook harness: affected build, behavior, and visual modes;
- release resolver: focused planning and unconditional full release mode;
- package/build configuration: affected type-check, build, artifact, or release mode.

Mode-specific focused proof is not another final gate.

## Failure handling

When a required check, mapping validation, or measurement fails:

1. identify the failed label, plan state, command, metric, or budget;
2. determine whether current file changes caused it;
3. fix in-scope failures or stale impact metadata;
4. rerun the narrow failed proof through `pnpm verify --only <label>` while preserving applicable `--full`, `--profile`, and `--files` arguments;
5. after fixes, rerun the original final completion-gate command without fix mode;
6. report unrelated or unresolved failures exactly;
7. never claim completion while required verification or evidence is missing or failing.

Do not substitute a raw child command printed by a failed step for the verifier-managed rerun.

If verification is active, use `pnpm verify:status`, inspect `.verify/logs`, and use `pnpm verify:resume` only when instructed by status. Do not start duplicate expensive runs. After resume, rerun the exact completion-gate command reported by the verifier.

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

`complete` requires assigned scope, acceptance criteria, required proof and measurements, consistent impact metadata, and the one applicable final completion gate to pass.
