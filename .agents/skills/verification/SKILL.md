---
name: verification
description: 'Use verifier-managed checks for implementation feedback and risk-specific proof. GitHub CI on the exact PR head is the architect-owned final repository verification gate.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. For verifier terminal/progress behavior also follow `docs/testing/verify-agent-output.md`. For Storybook-owned UI proof also follow `docs/testing/storybook.md`; `docs/testing/migration-plan.md` records which target discovery/ownership mechanisms are currently executable.

## Ownership

Verification has two different purposes and owners:

1. **Coding-agent feedback/proof** — focused checks needed to implement, diagnose, or prove a narrow task-specific risk.
2. **Repository merge gate** — automatic verification on the exact published PR head in GitHub CI, owned by the architect.

Do not collapse these into one coding-agent handoff ritual.

Coding agents own code. They may run focused verifier-managed checks when useful, but they do **not** own a mandatory final `pnpm verify`, `pnpm verify --full`, `pnpm verify:release`, or manually reconstructed full checklist merely because their code is ready to hand back.

The architect owns PR creation/update, exact-head CI review, semantic review, roadmap status, and merge readiness.

## Canonical commands

Mioframe verifier entry points are:

```bash
pnpm verify
pnpm verify --only <label> --files <paths...>
pnpm verify --full
pnpm verify:release
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

Use these commands normally when they are actually required. The verifier owns its execution environment and transitive tooling.

Do not prepend shell-level environment assignments such as `NAME=value pnpm verify ...` or `env NAME=value pnpm verify ...` to select verifier behavior. Agent-selectable behavior must be represented by a verifier CLI option or resolved automatically by the verifier.

Do not preflight verifier internals or infer that a verifier command is unavailable from generic sandbox capabilities. Attempt the canonical command when the task actually requires it. If the runtime rejects it, use the runtime's normal command-scoped approval/escalation path without changing the command. Never ask the operator to run verifier commands, broaden approval to generic shell execution, or enable unrestricted/full-access execution.

## Agent-facing output

Normal coding-agent verification uses the default bounded verifier output. Do **not** add `--verbose` preemptively.

The default verifier surface must give the agent only the control information needed for the next decision:

- current runnable check and check index/total;
- compact completion status and elapsed time;
- bounded heartbeat for a long-running check so quiet work does not look hung;
- on failure, a short actionable reason/excerpt, exact `.verify/logs/...` path, and canonical focused rerun command;
- compact final success/failure summary.

Raw child stdout/stderr, long output tails, routine skipped-check inventories, complete trigger-reason inventories, changed-file lists, and environment/planner detail belong in `.verify/logs/**` or explicit verbose diagnostics rather than the normal agent context.

A normal heartbeat is verifier-owned liveness information. It must not echo arbitrary child-output lines; it should identify the active check, elapsed time, owned timeout when applicable, and the detailed log path. Do not invent percentages or completion estimates for tools that do not expose trustworthy progress.

If the bounded failure summary is insufficient, inspect the exact log first. Use `--verbose` only as deliberate diagnostic escalation when raw live output materially helps. Verbose presentation never changes proof selection or verification semantics.

Do not build a second logging/progress mechanism around `verify`. The verifier's existing execution, per-check logs, command-lock metadata, and status/resume surfaces own this behavior.

## Coding-agent use

During implementation or correction, use focused verifier-managed checks only when they materially shorten the feedback loop or prove a task-specific risk.

Examples:

```bash
pnpm verify --only format --files <paths...>
pnpm verify --only oxlint --files <paths...>
pnpm verify --only eslint --files <paths...>
pnpm verify --only type-check
pnpm verify --only unit-tests --files <paths...>
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only storybook-behavior --files <spec...> --repeat <2..20>
pnpm verify --only e2e --files <paths...>
pnpm verify --only visual --files <paths...>
pnpm verify --only mutation --files <paths...>
```

Focused checks are optional implementation/diagnostic tools unless the architecture/task explicitly requires one as risk-specific proof.

Do not run broad automatic verification solely to produce a handoff status that CI will immediately reproduce. Do not mechanically execute every label one-by-one. Do not ask a coding agent to verify architect-authored documentation or workflow-only edits when no code change remains.

If a coding task changes verifier tooling itself, run the smallest checks necessary to prove the changed verifier contract during implementation. The final repository gate still belongs to exact-head CI.

## Required proof versus gate execution

A skipped local check is not evidence that a proof type is unnecessary. Required contract proof must exist in the repository at the correct owner before handoff.

Examples:

- a browser-owned interaction requires faithful browser proof in code;
- a public token override path may require rendered browser proof;
- a product scenario may require application E2E;
- an explicitly identified flake may require a bounded stability diagnostic while fixing it.

Once that proof exists and the coding agent has used whatever focused feedback was needed to implement it, the automatic repository-wide execution of all applicable checks belongs to CI.

CI is not a substitute for missing tests, stale ownership metadata, architecture review, required measurements, or visual evidence. Conversely, local duplication of CI is not a substitute for architect exact-head review.

## Flaky behavior

Known flaky behavior is failed proof, not an accepted warning.

A retry-pass/flaky classification never counts as green evidence. Correct the root cause and rerun the smallest faithful owning proof needed to establish the fix. Do not weaken assertions, inflate timeouts, add sleeps, repeat an already-delivered user action, use `force`, or rely on a stronger CI runner to hide the problem.

`--repeat` is a bounded Storybook-behavior stability diagnostic only. It requires `--only storybook-behavior` plus explicit `--files`, accepts counts from 2 through 20, and must be used only when a concrete stability risk warrants it. It is not a normal handoff or CI checklist item.

## Impact and ownership

For Storybook behavior and visual proof:

- ordinary reusable UI should use deterministic owner-local discovery where implemented;
- do not add duplicate registry metadata for a relation already expressed by supported local ownership;
- justified family/module/cross-owner/infrastructure proof may remain central with the smallest truthful explicit mapping;
- shared config/helpers normally use full owning-lane fallback unless every consumer is explicit, small, stable, and validated;
- removed/moved/unresolved relevant ownership must fall back safely or fail validation, never skip silently.

Colocated `src/**/*.browser.spec.ts` and `src/**/*.visual.spec.ts` are Playwright proof inputs only. Automatic unit scope must not classify them as Vitest tests merely because they end in `.spec.ts`.

Application E2E remains centralized and continues to use explicit source-to-product-scenario ownership.

## Visual baselines

Visual discovery/ownership follows `docs/testing/migration-plan.md` and `docs/testing/storybook.md`.

For intentional visual changes:

- inspect every baseline change;
- keep the smallest bounded accepted surface;
- use the currently authorized snapshot location;
- unresolved baseline ownership must fail closed or select full visual proof.

A passing screenshot comparison does not prove Material correctness or browser behavior.

## Mutation

Use mutation only for an explicitly relevant high-risk target and through the verifier-managed surface:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Do not infer mutation applicability merely from file adjacency and do not add mutation work solely because a broad automatic run might otherwise select it.

## Release-sensitive work

`pnpm verify --full` and `pnpm verify:release` are deliberate full-project/release commands, not coding-agent handoff commands.

Use them locally only when a coding task specifically needs release-output feedback that cannot wait for CI. The authoritative final release/merge gate is the required GitHub workflow on the exact PR head.

Release-impact ownership must follow the **complete current execution mechanism**, not only top-level release scripts or newly noticed helper examples. When a release execution root adds, removes, or replaces a repository-relative runtime import, re-audit the bounded transitive shared release-execution support closure and update release-impact ownership in the same work. The audit must have an explicit root population and completion criterion, keep unrelated `scripts/lib/**` negative, and use the smallest truthful consumer set or fail closed when that set is not safely bounded.

Do not solve this workflow requirement by adding a generic runtime dependency graph to the verifier. The closure audit belongs to architecture/preflight/test authorship; production planning remains explicit and local unless a separately measured requirement justifies new infrastructure.

## Fix mode

Use:

```bash
pnpm verify --fix-only
```

only when the coding change itself needs safe supported formatting/lint fixes or instruction compatibility generation. Inspect resulting changes. Fix mode is development tooling, not merge proof.

Architect-authored documentation or workflow-only changes are not a reason to send a coding agent back solely for formatting or broad verification; the architect owns those edits and CI owns their automatic repository gate.

## CI merge gate

For PR work, GitHub CI is the authoritative automatic repository verification because it runs against the exact published head in the controlled CI environment.

The architect must not recommend merge while required exact-head CI is missing or failing.

If CI fails because of the PR:

1. identify the failed CI contract and exact output;
2. route the concrete failure to the truthful owner;
3. the coding agent fixes code if code is the owner;
4. the coding agent may use the smallest useful focused verifier-managed check for feedback;
5. the architect republishes the corrected head and reviews CI again.

Do not require a second broad local gate before handing the correction back unless a concrete risk-specific proof requires it.

## Stage-specific rules

Stage-specific skills may require focused verifier proof for a concrete implementation risk, but they must not introduce a mandatory final automatic local repository gate for coding-agent completion.

Any older workflow wording that says a coding worker must run a final automatic `pnpm verify` before handoff is superseded by this ownership rule and should be removed when that workflow is next edited.

## Coding-agent report

After coding-agent edits, report implementation state and only verification actually used during implementation:

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

`complete` means the assigned coding scope and required task-specific proof are implemented with no known in-scope blocker. It does not require reproducing CI locally.
