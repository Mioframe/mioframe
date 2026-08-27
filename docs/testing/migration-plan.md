# Testing architecture migration plan

`docs/testing/architecture.md` is the durable testing and verification contract. This file records only the current executable migration state; detailed intermediate pass history remains in the `verify-redesign-*` records and Git history.

## Status

On `architecture/verify-redesign` / PR #218, the verify redesign is **not yet merge-ready**.

Historical Pass A-F acceptance remains evidence for those reviewed boundaries. Later full-PR review reopened implementation acceptance and led to several scripts corrections plus two architecture revisions.

Scripts implementation history includes:

- first correction implementation: `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`;
- second correction implementation: `8911f44078676ccaceb19c8de8c05364b5ec6698`;
- first architecture-revision implementation: `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53`;
- revision-02 implementation: `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`.

Architect re-review of `c42cc1a...` accepted the complete scripts-owned affected/execution ownership. `scripts/REVIEW.md` is resolved and removed.

The only active review state is now:

- `.github/workflows/REVIEW.md` — one blocker: develop CI omits the public `browser-integration` verification type and the aggregate `verification` job does not require it.

## Current executable public contract

The intended and executable public verification types are exactly:

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

`--only` accepts verification types, never private planner leaves. `--full` remains the release-grade full-project entry point and rejects narrowing combinations such as `--full --only` and `--full --files`. `verify:release` remains removed.

## Architect-accepted executable state

- **Static:** release-sensitive artifact planning covers production `src/**`, application Vite harness inputs, package/lock/build-entry handling, and neutral local-command execution ownership; dependent `build`, `artifact-static`, and managed-update static proof are selected truthfully.
- **Unit:** Vitest is the only affected/dependency engine with accepted safe fallback and zero-match behavior.
- **Storybook static:** shared Vite build inputs and neutral local-command execution widen the Storybook static build when its real runtime/build can change.
- **Behavior:** owner-local `*.behavior.spec.ts` remains primary proof; shared Playwright execution and shared Vite build inputs widen the complete behavior type.
- **Visual:** owner-local `*.visual.spec.ts`/baselines remain primary proof; shared Playwright execution and shared Vite build inputs widen the complete visual type.
- **Browser integration:** generic and exceptional runners remain disjoint; exceptional membership is centrally validated; shared Playwright execution, application Vite harness inputs, and runtime-relevant `package.json` widen the complete public browser-integration type; confirmed version-only package changes stay narrow.
- **Performance:** the public type remains valid with an intentionally empty persistent inventory.
- **Mutation:** the explicit four-target registry remains unchanged; deleted/renamed infrastructure remains status-aware.
- **E2E:** ordinary page/widget ownership remains structural; productionArtifact special execution remains central/fail-closed; shared Playwright execution and application Vite harness inputs widen full E2E.
- **E2E relevance:** target-tree, project applicability, Playwright owner inventory, exceptional membership, and dependency graph validation occur only for E2E-relevant scopes or literal `--full`.
- **Fix mode:** `--fix-only` returns before proof planning.

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

## Remaining migration work

Only CI wiring remains before final PR review:

- develop verification must run the public `browser-integration` type as its own verifier-managed lane;
- aggregate `verification` must require that lane;
- existing parallel topology, container-only Playwright execution, public type command, autofix/profile/base semantics, log artifacts, and fail-on-flaky behavior must remain unchanged.

## Completion gate

The migration may be marked complete only after:

1. the `.github/workflows/REVIEW.md` browser-integration CI blocker is fixed and the workflow review is clean;
2. `.github/workflows/REVIEW.md` is removed only after its finding is actually resolved;
3. the complete resulting PR receives a clean semantic review against `docs/testing/architecture.md` and repository rules;
4. GitHub CI is green on the exact final head, including browser-integration;
5. PR #218 is moved out of draft;
6. merge into `develop` uses squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
