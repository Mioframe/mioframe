# Testing architecture migration plan

`docs/testing/architecture.md` is the durable testing and verification contract. This file records only the current executable migration state; detailed intermediate pass history remains in the `verify-redesign-*` records and Git history.

## Status

On `architecture/verify-redesign` / PR #218, the verify redesign implementation is **executable and architect-accepted**, but the PR is not yet merge-ready because final current-facing documentation cleanup and exact-head CI remain.

Scripts implementation history includes:

- first correction implementation: `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`;
- second correction implementation: `8911f44078676ccaceb19c8de8c05364b5ec6698`;
- first architecture-revision implementation: `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53`;
- revision-02 implementation: `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`;
- develop workflow browser-integration correction: `32af5521b271de1fca4f94740572afa70b4900ec`.

Architect re-review accepted the complete scripts-owned affected/execution ownership and the final workflow topology. `scripts/REVIEW.md` and `.github/workflows/REVIEW.md` are resolved and removed.

The only active review state is:

- `docs/testing/REVIEW.md` — one documentation major: current-facing Storybook/developer/ADR guidance has not fully closed the removed migration/private proof model.

## Current executable public contract

The public verification types are exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Supported public entry points remain:

```text
pnpm verify
pnpm verify --only <type>
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
pnpm verify --full
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

`--only` accepts verification types, never private planner leaves. `--full` is the release-grade full-project entry point and rejects narrowing combinations such as `--full --only` and `--full --files`. `verify:release` is removed.

## Architect-accepted executable state

- **Static:** release-sensitive artifact planning covers production `src/**`, application Vite harness inputs, package/lock/build-entry handling, and neutral local-command execution ownership; dependent `build`, `artifact-static`, and managed-update static proof are selected truthfully.
- **Unit:** Vitest is the only affected/dependency engine with accepted safe fallback and zero-match behavior.
- **Storybook static:** shared Vite build inputs and neutral local-command execution widen the Storybook static build when its real runtime/build can change.
- **Behavior:** target discovery is owner-local `*.behavior.spec.ts`; legacy ordinary `*.browser.spec.ts` and central ordinary Storybook behavior discovery have no current consumer.
- **Visual:** target discovery is owner-local `*.visual.spec.ts` with colocated baselines; central ordinary visual-spec discovery has no current consumer.
- **Browser integration:** generic and exceptional runners remain disjoint; exceptional membership is centrally validated; shared Playwright execution, application Vite harness inputs, and runtime-relevant `package.json` widen the complete public browser-integration type; confirmed version-only package changes stay narrow.
- **Performance:** the public type remains valid with an intentionally empty persistent inventory.
- **Mutation:** the explicit four-target registry remains unchanged; deleted/renamed infrastructure remains status-aware.
- **E2E:** ordinary page/widget ownership remains structural; productionArtifact special execution remains central/fail-closed; shared Playwright execution and application Vite harness inputs widen full E2E.
- **E2E relevance:** target-tree, project applicability, Playwright owner inventory, exceptional membership, and dependency graph validation occur only for E2E-relevant scopes or literal `--full`.
- **Fix mode:** `--fix-only` returns before proof planning.
- **Develop CI:** focused `static`, `unit`, `mutation`, `e2e`, `browser-integration`, `behavior`, and `visual` proof participate in the implementation gate; `browser-integration` is an independent job behind `autofix` and aggregate `verification` requires its success. The performance inventory is empty, so no persistent performance lane exists.
- **Main CI:** the release gate runs `pnpm verify --full`.

Shared Vite ownership is centralized in one derived capability rather than repeated per-planner lists. Neutral low-level command/lock/result/signal ownership is likewise centralized and composed only by truthful current consumers. No tooling dependency graph, universal planner registry, DSL, cache, or new public metadata model was introduced.

## Compatibility already removed and not to be restored

Do not restore:

- public low-level `--only` labels;
- `verify:release`;
- legacy ordinary `*.browser.spec.ts` discovery;
- central ordinary behavior/visual assertion ownership;
- root/release ordinary application E2E assertion ownership;
- `E2E_SCENARIO_SCOPES` or production-path -> ordinary E2E mappings;
- host Playwright ownership-metadata execution;
- unit adjacency/custom graph selection;
- mutation adjacency or duplicate mutation registries.

Internal release-named commands/files remain where required by built-artifact, service-worker, fresh-container, cross-engine, deployment, logging, timeout, or lock semantics.

## Preserved invariants

- top-level single-run verify lock and expensive-command lock;
- container-only Playwright for verifier-managed browser proof;
- E2E project applicability and release/fresh-container semantics;
- accepted E2E relevance gate;
- status/resume/logging/timeout/profile/base/fix behavior;
- fail-closed structural validation when the owning type is relevant;
- central exceptional release-proof inventory/full/direct validation;
- known flaky behavior remains failed proof.

## Remaining migration closeout

No implementation or workflow architecture correction remains without new repository evidence.

Before the migration is marked complete, current-facing documentation must be synchronized with the executable target:

- `docs/testing/storybook.md` must stop presenting removed legacy behavior/central Storybook/visual discovery as current executable compatibility;
- `DEVELOPMENT.md` must summarize proof ownership with public contract types rather than private leaf labels / a generic `release verification` category;
- `docs/testing/verify-redesign-architecture.md` must no longer state that implementation is pending.

Historical pass/correction/task records may retain their historical terminology.

## Completion gate

The migration may be marked complete only after:

1. `docs/testing/REVIEW.md` is corrected, re-reviewed clean, and removed;
2. the complete resulting PR has no active review finding or stale current-state documentation;
3. GitHub CI is green on the exact final head, including the independent browser-integration lane and aggregate `verify` gate;
4. PR #218 is moved out of draft;
5. merge into `develop` uses squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
