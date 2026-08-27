---
name: verification
description: 'Use verifier-managed checks for implementation feedback and required branch-diff pre-handoff verification. Verification types are the public CLI contract; GitHub CI on the exact PR head remains the architect-owned final merge gate.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. `docs/testing/migration-plan.md` records the current executable verification state and completion/merge-readiness status.

For Storybook authoring/workbench behavior also follow `docs/testing/storybook.md`. Project-wide verification type names, suffixes, affected ownership, and fallback rules come from `docs/testing/architecture.md`.

## Ownership

Verification has three distinct purposes:

1. **Coding-agent feedback/proof** — focused checks used to implement, diagnose, or prove a narrow task-specific risk.
2. **Coding-agent branch handoff gate** — one verifier-managed pass over the complete cumulative PR diff against its target base before final coding handoff.
3. **Repository merge gate** — automatic verification on the exact published PR head in GitHub CI, owned by the architect.

Keep these purposes distinct, but do not omit the branch handoff gate for ordinary PR code work.

For a PR targeting `develop`, the canonical branch handoff command is:

```bash
pnpm verify --base origin/develop
```

For a PR with another target base, use `origin/<base>` instead.

Do not force `--profile github-actions` for ordinary local agent verification. The verifier should use the agent environment's normal local profile. GitHub CI owns its controlled `github-actions` profile. Use an explicit alternate profile locally only when a task specifically requires profile comparison or diagnosis.

This is deliberately **not** `pnpm verify --full`. `--base` asks the verifier to inspect the complete cumulative branch diff and select every applicable check using the current type/impact model below. `--full` ignores changed-file scope, cannot be combined with `--base`, and additionally owns full-project/release checks that are not the ordinary PR handoff contract.

The branch handoff gate is required after implementation is complete for coding work intended for a PR, unless the assigned task is explicitly diagnostic/read-only with no tracked implementation changes, or the architect explicitly marks branch verification unnecessary for a non-code handoff.

When branch verification fails:

1. identify the concrete failed contract selected by the cumulative PR diff;
2. if it is PR-caused and remains inside the accepted architecture/ownership, fix it;
3. use the smallest relevant focused verifier command for fast feedback on that correction;
4. when the focused correction is clean, rerun the complete branch gate;
5. repeat until the complete branch gate passes cleanly;
6. if a failure is unrelated to the PR, requires a different architecture/owner, or would materially expand the accepted PR contract, stop and report the concrete evidence instead of patching around it.

A retry-pass/flaky result is not a clean branch handoff.

GitHub CI still remains authoritative for the exact published head. The architect owns PR metadata, CI inspection, semantic review, roadmap status, and merge readiness.

## Public command contract

```bash
pnpm verify
pnpm verify --base origin/develop
pnpm verify --only <type>
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
pnpm verify --full
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

Public verification types are:

```text
static
unit
behavior
visual
browser-integration
performance
mutation
e2e
```

Low-level operations such as format, Oxlint, ESLint, type-check, Storybook build, browser setup, build/artifact preparation, and release/runtime checks are verifier internals, not durable `--only` API values.

`--full` means every verification type, every test/spec, and every registered mutation/performance target with no affected-test narrowing. It is incompatible with narrowing options such as `--only` and `--files`.

There is no public `release` verification type. Release-sensitive proof is classified by the contract it verifies.

## Current executable model

The redesign target is executable. Removed compatibility is not a current fallback path:

- public low-level `--only` labels are removed;
- ordinary `*.browser.spec.ts` discovery is removed;
- root/legacy ordinary E2E discovery and manual production-path -> E2E-spec mappings are removed;
- central ordinary Storybook behavior/visual assertion ownership is removed;
- mutation adjacency inference is removed.

Historical implementation records may mention those mechanisms only as migration history. Do not restore or extend them unless a new architecture decision explicitly replaces the current model.

## Spec taxonomy

| Type                | Current naming                                 |
| ------------------- | ---------------------------------------------- |
| unit                | `*.test.<supported-ext>`; normally `*.test.ts` |
| behavior            | `*.behavior.spec.ts`                           |
| visual              | `*.visual.spec.ts`                             |
| browser-integration | `*.browser-integration.spec.ts`                |
| performance         | `*.performance.spec.ts`                        |
| e2e                 | `*.e2e.spec.ts`                                |

Static and mutation are verification types but not independent test-spec suffixes.

## Focused coding-agent use

Use focused verifier-managed checks when they materially shorten feedback or prove a task-specific risk, both during implementation and when correcting a branch-gate failure.

Examples:

```bash
pnpm verify --only static --files <paths...>
pnpm verify --only unit --files <paths...>
pnpm verify --only behavior --files <paths...>
pnpm verify --only visual --files <paths...>
pnpm verify --only browser-integration --files <paths...>
pnpm verify --only performance --files <paths...>
pnpm verify --only mutation --files <paths...>
pnpm verify --only e2e --files <paths...>
```

Focused checks are implementation/diagnostic tools and do not replace the final branch-diff handoff gate for PR code changes. Do not mechanically run every type one-by-one. The expected iteration is:

- use focused checks while implementing;
- run `pnpm verify --base origin/<base>` when the task appears complete;
- if that broad pass exposes another PR-caused failure, fix it and verify that fix narrowly;
- rerun the broad branch gate;
- continue until the broad branch gate is clean.

If the coding task changes verifier tooling itself, run the smallest risk-specific checks necessary to prove the changed planner/CLI contract during implementation, then run the ordinary branch handoff gate if the work is being handed back as PR code.

## Required proof versus gate execution

A passing branch verifier is not evidence that every required proof type exists. Required contract proof must exist in the repository at the correct owner before handoff.

Examples:

- a browser-owned interaction requires faithful browser proof in code;
- a public token override path may require rendered browser proof;
- a product scenario may require application E2E;
- an explicitly identified flake may require a bounded stability diagnostic while fixing it.

The branch gate executes all verifier checks applicable to the cumulative diff. It does not replace architecture review, missing tests, stale ownership metadata, required measurements, or operator visual evidence.

Likewise, exact-head CI does not replace the coding-agent branch gate: the purpose of the local branch gate is to catch cumulative PR failures before publishing and waiting for CI.

## Impact and ownership

### Unit

Use Vitest native related/affected analysis where static imports represent the relation. Do not build or maintain a second unit dependency graph.

Unresolved relevant unit impact widens to full unit.

### Behavior / visual / browser integration / local performance

Ordinary local proof derives ownership from current suffix plus truthful repository colocation.

Do not add duplicate registry metadata when path/placement already expresses ownership.

Shared config/helpers use full owning-type fallback unless every consumer is explicit, small, stable, and validated.

Removed/moved/unresolved relevant ownership widens safely or fails structural validation; it never silently skips.

### E2E

Primary ownership comes from:

```text
tests/e2e/pages/<Owner>/**/*.e2e.spec.ts
tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts
```

Changed production code resolves affected product owners through `dependency-cruiser` reverse dependencies.

Traversal records reachable widgets and continues upward; reachable pages/panes are recorded and stop that branch.

The directory gives the primary E2E owner. Additional owners are exceptional machine-validated Playwright-native owner metadata only.

Do not maintain a manual production-path -> E2E-spec registry.

Do not add routine owner tags to every E2E and do not create a custom E2E wrapper/DSL.

Unknown relevant E2E impact widens to full E2E. Invalid E2E structure fails verification.

### Mutation

Mutation uses the explicit project-owned registry in `scripts/lib/mutationTargets.ts`. Do not infer mutation targets from adjacency.

Default verification runs affected registered targets. `--full` runs the complete registered mutation inventory. The final branch-diff verifier may select mutation when the cumulative PR risk requires it; do not add focused mutation work solely because a broad automatic run might otherwise select it.

### Performance

Persistent performance proof requires a measurable threshold/budget. Do not create permanent performance infrastructure for one-off task measurements. The current persistent performance inventory is intentionally empty.

## Release-sensitive work

`release` is not a verification type.

Classify release-sensitive proof by contract:

- source/build/config invariant -> static;
- isolated browser/PWA/runtime/update contract -> browser-integration;
- isolated interactive UI -> behavior;
- complete product/user flow -> e2e;
- measurable performance invariant -> performance;
- registered mutation strength -> mutation where applicable.

The release-grade command is:

```bash
pnpm verify --full
```

`--full` is a deliberate full-project/release command, not the ordinary coding-agent PR handoff command. Use it locally only when the task specifically requires full-project or release-output proof; the ordinary handoff command is the diff-aware branch gate above.

## Flaky behavior

Known flaky behavior is failed proof, not an accepted warning.

A retry-pass/flaky classification never counts as green evidence. Correct the root cause and rerun the smallest faithful owning proof needed to establish the fix, then rerun the branch handoff gate. Do not weaken assertions, inflate timeouts, add sleeps, repeat an already-delivered user action, use `force`, or rely on a stronger CI runner to hide the problem.

The bounded focused behavior `--repeat` mode is diagnostic only; it does not create another verification type or relax flaky-failure policy, and it is not a substitute for the branch handoff gate or CI.

## Fix mode

Use:

```bash
pnpm verify --fix-only
```

only when the coding change itself needs safe supported formatting/lint fixes or instruction compatibility generation. Inspect resulting changes, then continue normal verification. Fix mode does not replace the branch handoff gate.

Architect-authored documentation or workflow-only edits remain architect-owned. If branch verification reports an architect-owned docs-only formatting problem, report it rather than changing architecture/review documents outside the coding assignment.

## CI merge gate

GitHub CI on the exact published PR head is the authoritative automatic repository gate.

The architect must not recommend merge while required exact-head CI is missing or failing.

The expected sequence for code PRs is:

1. coding agent implements and uses focused verifier feedback as needed;
2. coding agent runs `pnpm verify --base origin/<base>` using its normal local verifier profile;
3. if it fails for an in-contract PR-caused issue, the agent fixes that issue and uses focused verification for the correction;
4. the agent reruns the complete branch gate and repeats until it is clean;
5. the agent hands back only after that branch gate is clean, or reports a concrete blocker;
6. the architect publishes/reviews the resulting exact head;
7. GitHub CI confirms the controlled-environment merge gate with its own CI profile.

If CI still fails after a clean branch handoff:

1. identify the failed CI contract and exact output;
2. compare it with the locally exercised branch plan and environment;
3. route the concrete discrepancy to the truthful owner;
4. fix the root cause rather than accepting retry/flaky behavior;
5. require another clean local branch-diff handoff before republishing code.

Do not treat CI as the first normal execution of cumulative PR verification. Do not require a second broad local gate before republishing unless a concrete risk-specific proof requires it.

## Stage-specific rules

Stage-specific skills may require additional focused verifier proof for concrete implementation risks. They must not weaken or replace the branch-diff handoff gate for PR code work.

A deterministic workflow may skip that gate only for explicitly diagnostic/read-only work with no tracked implementation result, or when the architect explicitly records why a non-code handoff does not need it.

## Coding-agent report

After coding-agent edits, report implementation state, focused feedback actually used, and the branch handoff result:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually useful during implementation/diagnosis>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

BRANCH VERIFICATION
command: pnpm verify --base origin/<base> | skipped
status: passed | failed | skipped
reason if failed/skipped: none | <exact reason>

CI GATE
status: architect-owned
```

`complete` means the assigned coding scope and required task-specific proof are implemented and the required branch handoff gate is clean. It does not replace exact-head GitHub CI or architecture/visual approval.
