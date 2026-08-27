---
name: verification
description: 'Use verifier-managed checks for implementation feedback and risk-specific proof. Verification types are the public CLI contract; GitHub CI on the exact PR head is the architect-owned final repository gate.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. `docs/testing/migration-plan.md` records the current executable verification state and completion/merge-readiness status.

For Storybook authoring/workbench behavior also follow `docs/testing/storybook.md`. Project-wide verification type names, suffixes, affected ownership, and fallback rules come from `docs/testing/architecture.md`.

## Ownership

Verification has two distinct purposes:

1. **Coding-agent feedback/proof** — focused checks used to implement, diagnose, or prove a narrow task-specific risk.
2. **Repository merge gate** — automatic verification on the exact published PR head in GitHub CI, owned by the architect.

Coding agents own code and task-specific proof. They do not own a mandatory broad final local verification ritual merely because implementation is ready.

The architect owns PR creation/update, exact-head CI review, semantic review, and merge readiness.

## Public command contract

```bash
pnpm verify
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

Use focused verifier-managed checks only when they materially shorten feedback or prove a task-specific risk.

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

Do not mechanically run every type one-by-one. Do not run broad verification solely to produce a handoff status that exact-head CI will immediately reproduce.

If the coding task changes verifier tooling itself, run the smallest risk-specific checks necessary to prove the changed planner/CLI contract during implementation.

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

Default verification runs affected registered targets. `--full` runs the complete registered mutation inventory.

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

## Flaky behavior

Known flaky behavior is failed proof, not an accepted warning.

Correct the root cause and rerun the smallest faithful owning proof. Do not weaken assertions, inflate timeouts, add sleeps, repeat already-delivered user actions, use `force`, or rely on a stronger CI runner to hide the issue.

The bounded focused behavior `--repeat` mode is diagnostic only; it does not create another verification type or relax flaky-failure policy.

## Fix mode

Use:

```bash
pnpm verify --fix-only
```

only when the coding change itself needs safe supported formatting/lint fixes or instruction compatibility generation. Inspect resulting changes.

Fix mode is development tooling, not merge proof.

## CI merge gate

GitHub CI on the exact published PR head is the authoritative automatic repository gate.

The architect must not recommend merge while required exact-head CI is missing or failing.

If CI fails because of the PR:

1. identify the failed contract and exact output;
2. route the failure to the truthful owner;
3. the coding agent fixes code if code is the owner;
4. the coding agent may use the smallest useful focused verifier check for feedback;
5. the architect republishes the corrected head and reviews CI again.

Do not require a second broad local gate before handoff unless a concrete risk-specific proof requires it.

## Coding-agent report

After edits, report implementation state and only focused verification actually used:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually useful during implementation/diagnosis>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

CI GATE
status: architect-owned
```

`complete` means the assigned implementation and required task-specific proof are complete with no known in-scope blocker. It does not require reproducing CI locally.
