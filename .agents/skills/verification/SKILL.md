---
name: verification
description: 'Use verifier-managed checks for focused implementation feedback and required branch-diff pre-handoff verification. GitHub CI on the exact PR head remains the architect-owned final merge gate.'
---

# Verification workflow

Follow `docs/testing/architecture.md`. For Storybook-owned UI proof also follow `docs/testing/storybook.md`; `docs/testing/migration-plan.md` records which target discovery/ownership mechanisms are currently executable.

## Ownership

Verification has three different purposes:

1. **Coding-agent feedback/proof** — focused checks needed to implement, diagnose, or prove a narrow task-specific risk.
2. **Coding-agent branch handoff gate** — one verifier-managed pass over the complete cumulative PR diff against its target base before final coding handoff.
3. **Repository merge gate** — automatic verification on the exact published PR head in GitHub CI, owned by the architect.

Keep these purposes distinct, but do not omit the branch handoff gate for ordinary PR code work.

For a PR targeting `develop`, the canonical branch handoff command is:

```bash
pnpm verify --base origin/develop
```

For a PR with another target base, use `origin/<base>` instead.

Do not force `--profile github-actions` for ordinary local agent verification. The verifier should use the agent environment's normal local profile. GitHub CI owns its controlled `github-actions` profile. Use an explicit alternate profile locally only when a task specifically requires profile comparison or diagnosis.

This is deliberately **not** `pnpm verify --full`. `--base` asks the verifier to inspect the complete cumulative branch diff and select every applicable check. `--full` ignores changed-file scope, cannot be combined with `--base`, and additionally owns full-project/release checks that are not the ordinary PR handoff contract.

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

## Canonical commands

Mioframe verifier entry points are:

```bash
pnpm verify
pnpm verify --base origin/develop
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

## Coding-agent use

During implementation or correction, use focused verifier-managed checks when they materially shorten the feedback loop or prove a task-specific risk.

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

Focused checks are implementation/diagnostic tools and do not replace the final branch-diff handoff gate for PR code changes.

Do not mechanically execute every label one-by-one. The expected iteration is:

- use focused checks while implementing;
- run `pnpm verify --base origin/<base>` when the task appears complete;
- if that broad pass exposes another PR-caused failure, fix it and verify that fix narrowly;
- rerun the broad branch gate;
- continue until the broad branch gate is clean.

If a coding task changes verifier tooling itself, run the smallest checks necessary to prove the changed verifier contract during implementation, then run the ordinary branch handoff gate if the work is being handed back as PR code.

## Required proof versus gate execution

A passing branch verifier is not evidence that every required proof type exists. Required contract proof must exist in the repository at the correct owner before handoff.

Examples:

- a browser-owned interaction requires faithful browser proof in code;
- a public token override path may require rendered browser proof;
- a product scenario may require application E2E;
- an explicitly identified flake may require a bounded stability diagnostic while fixing it.

The branch gate executes all verifier checks applicable to the cumulative diff. It does not replace architecture review, missing tests, stale ownership metadata, required measurements, or operator visual evidence.

Likewise, exact-head CI does not replace the coding-agent branch gate: the purpose of the local branch gate is to catch cumulative PR failures before publishing and waiting for CI.

## Flaky behavior

Known flaky behavior is failed proof, not an accepted warning.

A retry-pass/flaky classification never counts as green evidence. Correct the root cause and rerun the smallest faithful owning proof needed to establish the fix, then rerun the branch handoff gate. Do not weaken assertions, inflate timeouts, add sleeps, repeat an already-delivered user action, use `force`, or rely on a stronger CI runner to hide the problem.

`--repeat` is a bounded Storybook-behavior stability diagnostic only. It requires `--only storybook-behavior` plus explicit `--files`, accepts counts from 2 through 20, and must be used only when a concrete stability risk warrants it. It is not a substitute for the branch handoff gate or CI.

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

Use focused mutation during implementation only for an explicitly relevant high-risk target and through the verifier-managed surface:

```bash
pnpm verify --only mutation --files <narrow-source-or-test-paths...>
```

Do not infer focused mutation applicability merely from file adjacency and do not add mutation work solely because a broad automatic run might otherwise select it. The final branch-diff verifier may select mutation when the cumulative PR risk requires it.

## Release-sensitive work

`pnpm verify --full` and `pnpm verify:release` are deliberate full-project/release commands, not the ordinary coding-agent PR handoff command.

The ordinary branch handoff command is diff-aware:

```bash
pnpm verify --base origin/<base>
```

Use `--full` or `verify:release` locally only when the task specifically requires full-project or release-output proof. The authoritative final release/merge gate remains the required GitHub workflow on the exact PR head.

## Fix mode

Use:

```bash
pnpm verify --fix-only
```

when the coding change itself needs safe supported formatting/lint fixes or instruction compatibility generation. Inspect resulting changes, then continue normal verification. Fix mode does not replace the read-only branch handoff pass.

Architect-authored documentation or workflow-only edits remain architect-owned. If branch verification reports an architect-owned docs-only formatting problem, report it rather than changing architecture/review documents outside the coding assignment.

## CI merge gate

For PR work, GitHub CI is the authoritative automatic repository verification because it runs against the exact published head in the controlled CI environment.

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

Do not treat CI as the first normal execution of cumulative PR verification.

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

`complete` means the assigned coding scope and required proof are implemented and the required local branch handoff gate is clean. It does not replace exact-head GitHub CI or architecture/visual approval.
