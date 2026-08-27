# Testing architecture migration plan

`docs/testing/architecture.md` is the canonical testing and verification contract. `docs/testing/verify-redesign-architecture.md` records the accepted design rationale. This document records only the durable executable migration state; implementation passes, coding-agent tasks, review handoffs, and correction history belong in Git history and the completed PR, not in the long-lived documentation set.

## Status

The verify redesign migration is complete. The current repository implements the target ownership and public command model. No transitional public compatibility path remains.

## Public executable contract

Public verification types are exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Supported public entry points are:

```text
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

`--only` accepts verification types, never private planner leaves. `--full` is complete release-grade full-project verification and rejects narrowing combinations such as `--full --only` and `--full --files`. There is no public `release` type and no `verify:release` alias.

## Current ownership

- **Static:** formatting, linting, type-checking, Storybook buildability, release/build/config/artifact invariants, and other deterministic repository checks. PR release-version policy is not affected/default static planning: the independent PR-only `release-version` CI job owns that merge policy, while literal `pnpm verify --full` retains version validation as a private static leaf.
- **Unit:** Vitest owns related/affected dependency selection, with safe full-unit fallback when the relation cannot be represented reliably.
- **Behavior:** owner-local `*.behavior.spec.ts` Playwright proof for isolated interactive UI behavior. Storybook infrastructure behavior may live under `.storybook/**/*.behavior.spec.ts`.
- **Visual:** owner-local `*.visual.spec.ts` proof with colocated baselines.
- **Browser integration:** owner-local `*.browser-integration.spec.ts` plus the explicitly bounded exceptional release/runtime inventory. Verifier-managed Playwright remains container-only.
- **Performance:** a valid public type with an intentionally empty persistent inventory until a concrete measurable requirement is registered.
- **Mutation:** one explicit four-target registry is the sole automatic mutation ownership source; `stryker.config.mjs` derives the mutation inventory from it.
- **E2E:** ordinary application proof uses structural `tests/e2e/pages/<Owner>/**` and `tests/e2e/widgets/<Owner>/**` ownership. Production reachability uses `dependency-cruiser`; there is no manual production-path -> ordinary-E2E mapping registry.

## Verification ownership

Verification has three distinct execution purposes:

1. focused verifier-managed checks are implementation and diagnostic feedback;
2. ordinary PR code work ends with one cumulative coding-agent branch handoff gate against the PR base, for example `pnpm verify --base origin/develop`;
3. GitHub CI on the exact published head is the architect-owned repository merge gate.

The branch handoff gate is diff-aware and is not `pnpm verify --full`. A clean branch handoff does not replace exact-head CI, and green CI does not replace architecture/ownership review.

## Removed compatibility

Do not restore:

- public low-level `--only` labels;
- `verify:release` or a public `release` type;
- ordinary `*.browser.spec.ts` discovery;
- central ordinary Storybook behavior/visual ownership;
- root-level ordinary application E2E ownership;
- `E2E_SCENARIO_SCOPES` or another production-path -> ordinary-E2E registry;
- host Playwright execution for verifier-managed discovery/proof;
- unit adjacency or a second dependency graph for unit selection;
- mutation adjacency or duplicate mutation registries;
- compatibility layers whose only purpose is preserving a removed migration-era command/location.

Internal release-named scripts and private proof leaves remain where they own real build, artifact, service-worker, fresh-container, cross-engine, publication, logging, timeout, or lock semantics.

## Maintenance

Future verification changes start from `docs/testing/architecture.md`, current repository rules, and current implementation/tests. Do not add new migration-pass documents for routine maintenance. If a future architectural change requires staged migration, create only the minimum temporary control artifacts needed for that active change and remove them when the migration closes.
