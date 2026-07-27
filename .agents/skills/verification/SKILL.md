---
name: verification
description: 'Use to run verify-managed checks, inspect the automatic impact plan, use focused overrides and fix mode safely, interpret failures, avoid duplicate expensive runs, and report final TASK RESULT and VERIFY RESULT.'
---

# Verification workflow

Follow `docs/testing/architecture.md`.

The agent designs appropriate proof and maintains repository impact metadata. `verify` independently plans automatic checks from Git diff and repository-backed facts. It never reads `TEST IMPACT`.

A skipped or empty automatic lane is not evidence that the proof type is unnecessary. When the repository metadata is incomplete, fix the metadata or use an explicit focused override while preserving safe fallback.

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

Use focused runs for development feedback and explicit existing targets. `--files` does not represent deleted files or both sides of a rename; status-aware automatic planning must use Git diff/base-ref modes.

Raw Vitest, Playwright, ESLint, Oxlint, Oxfmt, type-check, visual, E2E, or Stryker commands are diagnostic exceptions only. A failed verify step may print its raw child command for diagnosis; do not use that command as the rerun or completion gate. Return to a verify-managed command that preserves the original invocation scope.

## Mode constraints

Invocation mode is validated before planning and again when persisted retry metadata is read:

- unknown, positional, or repeated CLI arguments are rejected rather than silently changing scope;
- `--full` is an unconditional full-project scope and must not be combined with `--base` or `--files`; environment base refs are ignored in full mode;
- release-only labels require `--full`;
- mutation is a PR-quality tool and is not available as `--full --only mutation`;
- `--fix --only` and `--fix-only --only` are limited to `agent-environment`, `format`, `oxlint`, and `eslint`, the checks that actually apply fixers.

## Automatic scope

The target automatic planner is defined only by repository facts:

- status-aware added, modified, deleted, and renamed paths;
- directly changed tests/specs;
- snapshot ownership;
- Vitest static-import related selection and safe full-unit fallbacks;
- independent Storybook behavior, app E2E, and visual impact registries;
- independent release-impact mappings to build, artifact, and release-smoke checks;
- full-lane paths, relevant source domains, mappings, standalone specs, and validation;
- persistent project applicability metadata when its audited migration is complete;
- persistent mutation targets;
- persistent performance checks for durable budgets.

Each lane resolves to `skip`, `focused`, `full`, or blocking `invalid` with inspectable reasons. Unknown relevant impact selects the full owning lane. Blocking `invalid` remains blocking in full/release mode; full execution never bypasses broken impact metadata.

Until `docs/testing/migration-plan.md` is complete, the current verifier may still use sibling unit selection, broad visual/E2E fallback, omit release-only checks from focused development runs, duplicate desktop/mobile execution, and use legacy mutation inference. Do not describe target behavior as already implemented.

## Repository impact metadata

When adding, moving, renaming, or removing a Playwright spec:

- update its owning lane registry in the same change;
- map production, story, fixture, or owned support sources only;
- do not put spec paths in source prefixes to group tests;
- use standalone only when no truthful stable source mapping exists;
- keep shared config/helpers on full-lane fallback unless the complete consumer set is explicit and validated.

When changing a release-only contract, maintain its repository mapping to the exact build, artifact, or release-smoke checks. Shared or unknown release impact uses full release fallback.

A broken registry or release mapping must fail verification before tests run, including during `pnpm verify:release`.

## Mutation

A task-specific focused mutation audit may be run after focused deterministic tests pass:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

The durable target is automatic selection from persistent registered high-risk source/test pairs. Do not infer semantic applicability merely from sibling files, and do not make automatic selection depend on agent prose.

Until the persistent registry replaces legacy inference, ordinary branch-diff verification may still execute broader mutation scope. When `pnpm verify:release` is the final completion gate, run required mutation proof beforehand through the focused verify-managed command because mutation is intentionally outside release mode.

## Browser, visual, and project selection

Run exact Storybook behavior, app E2E, and visual specs needed for focused feedback when automatic inference has not yet been migrated or metadata is being corrected.

Current app E2E desktop/mobile coverage remains authoritative until a dedicated audit and migration changes project applicability. Do not narrow the project matrix in an ordinary product task.

For intentional visual changes, inspect baseline diffs and run the owning visual specs. If baseline ownership is unresolved, use the full visual lane.

If no faithful test target exists, report the proof gap and resolve it within scope when the changed contract requires it. Do not substitute a less faithful proof type.

## Release selection

The target focused planner automatically selects production-artifact proof for release-relevant changes. `pnpm verify:release` remains the unconditional full gate for `main`.

Until the release resolver migration is implemented, a task changing build configuration, routing/base paths, manifest/PWA/service worker/channel isolation, release scripts, artifact assembly, or production-output dependencies must use `pnpm verify:release` as its single final completion gate. It replaces, rather than supplements, the ordinary branch-diff completion gate.

## Performance evidence

For a one-off performance, memory, startup, main-thread, or bundle-size claim:

1. run the reproducible measurement named in preflight;
2. use the recorded representative scenario/dataset and environment;
3. report the baseline or budget and measured result;
4. rerun after implementation when comparison is required;
5. run the one applicable final completion gate.

A durable product budget belongs in a repository-owned automated check with impact metadata. Do not create permanent benchmark infrastructure for one task.

## Fix mode

When only automatic formatting, lint fixes, or instruction compatibility generation is needed, use fix-only mode with the same task scope:

```bash
pnpm verify --fix-only --base <parent-ref>
```

Inspect generated changes. `pnpm verify --fix` remains available as a combined convenience run, but it is not the default agent workflow and never replaces the final read-only gate. Remove `--fix` or `--fix-only` from the final rerun.

## Final completion gate

The top-level task owns exactly one final read-only completion gate after all implementation and focused or mode-specific proof are complete. Nested implementation and testing skills do not run separate final gates.

For ordinary feature-branch or PR work:

```bash
pnpm verify --base origin/develop
```

For a stacked branch, replace `origin/develop` with the actual parent feature branch. Plain `pnpm verify` is sufficient only when the complete task is exactly the current uncommitted diff against `HEAD`, or exactly the single last commit selected by verify's documented fallback; never report it as proof of a multi-commit PR.

When the change requires full/release proof:

```bash
pnpm verify:release
```

This is the single final completion gate for that task. Do not also run `pnpm verify --base <parent-ref>` as a second final gate. Complete any required proof not owned by release mode, such as mutation, with focused verify-managed commands before the final release run.

A broad green run does not replace missing proof, stale impact metadata, performance evidence, architecture review, operator visual acceptance, PR review, or merge readiness.

## Mode-specific changes

When tooling, scripts, CI, Storybook, Playwright, build config, package scripts, resolver logic, or command output changes, verify every affected user-visible mode during focused development proof.

Examples:

- verify runner: default and affected `--only`, `--files`, `--fix`, `--fix-only`, `--verbose`, base-ref, resume, or full modes;
- changed-path planner: local, base-ref, GitHub Actions, deletion, and rename;
- resolver: table-driven resolver tests plus representative command planning;
- Playwright config: every affected project/lane;
- Storybook harness: affected build, behavior, and visual mode;
- release resolver: focused development planning and unconditional full release mode;
- package/build config: affected type-check, build, artifact, or release mode.

Mode-specific focused proof is not another final gate. Select the final completion gate only after all affected modes are proven.

## Process ownership

GitHub PR ownership, draft/ready transitions, current-head review, and merge decisions follow the root `AGENTS.md` pull request workflow. This skill owns local verification planning, execution, failure handling, and reporting only.

Unless the task targets verification infrastructure, treat container/browser runtime internals as an opaque project boundary. Report the failing verify step rather than bypassing repository commands or reconfiguring runtime internals.

If CI autofix commits changes, synchronize the local checkout before continuing and re-review the resulting current head.

## Failure handling

When a required check, registry validation, or measurement fails:

1. identify the failed label, plan state, command, metric, or budget;
2. determine whether the current change caused it;
3. fix in-scope failures or stale repository impact metadata;
4. rerun the narrow failed proof through `pnpm verify --only <label>` while preserving applicable `--base`, `--full`, `--profile`, and `--files` arguments;
5. after all fixes, rerun the original final completion-gate command without `--fix` or `--fix-only`;
6. report unrelated or unresolved failures exactly;
7. never claim completion while required verification or evidence is missing or failing.

Do not follow a failure summary that drops the original base, full, profile, file, or label scope, and do not substitute a printed raw child command for the verify-managed rerun.

If verification is active, use `pnpm verify:status`, inspect `.verify/logs`, and use `pnpm verify:resume` only when instructed by status. Do not start duplicate expensive runs. After resume, rerun the exact original completion-gate command printed by `pnpm verify:resume` when structured metadata is available; plain `pnpm verify` is not an acceptable fallback when the original invocation had scope arguments.

## Warnings

Fix warnings caused by the current change. Classify any remaining warning as pre-existing, unrelated, or intentionally deferred. Preserve `passed with CI-profile risk` wording when reported by the verifier.

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

`complete` requires assigned scope, acceptance criteria, required proof and measurements, consistent repository impact metadata, and the one applicable final completion gate to pass.
