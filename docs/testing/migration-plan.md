# Testing architecture migration plan

`docs/testing/architecture.md` is the durable testing and verification contract. This file records the current executable migration state; detailed intermediate pass history remains in the `verify-redesign-*` records and Git history.

## Status

On `architecture/verify-redesign` / PR #218, the verify redesign implementation, workflow topology, documentation migration, current `develop` integration, post-merge Firefox correction, and final release-version isolation correction are architect-accepted.

Current `develop` integration:

- merged `develop`: `9dd19ed320ce227e915a824b5552af16108a5a10`;
- two-parent integration merge: `b6125cf2ce3c976402e269b117546a923eaa654f`;
- post-merge Firefox configuration-contract correction: `69e28e631a4a634817210e22a87a43a7095c6dd5`;
- release-version isolation correction: `2524e5e53f881f8271be84e9190eb0a6808b1915`.

Relevant scripts/workflow implementation history includes:

- first correction: `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`;
- second correction: `8911f44078676ccaceb19c8de8c05364b5ec6698`;
- first architecture-revision implementation: `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53`;
- revision-02 implementation: `c42cc1a09bdfee2c07f88412ee4c87951dfb3a43`;
- develop workflow browser-integration correction: `32af5521b271de1fca4f94740572afa70b4900ec`.

The final semantic-audit finding is resolved. `scripts/REVIEW.md` has been removed after architect re-review. The final coding pass reported clean focused unit/static verification and a clean cumulative `pnpm verify --base origin/develop` handoff with no retry/flaky acceptance.

PR #218 remains draft only until new exact-head GitHub CI succeeds on the architect-synchronized final tree and the architect performs the final readiness transition.

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

`--only` accepts verification types, never private planner leaves. `--full` is the release-grade full-project entry point and rejects narrowing combinations such as `--full --only` and `--full --files`. `verify:release` is removed.

`pnpm verify --base origin/develop` is the ordinary coding-agent branch-handoff gate for PRs targeting `develop`. It is cumulative and diff-aware, uses the agent's normal local profile, and is separate from exact-head GitHub CI. It is deliberately not a substitute for `--full`, and `--full` is not the ordinary handoff gate.

## Architect-accepted executable state

- **Static:** release-sensitive artifact planning covers production `src/**`, application Vite harness inputs, package/lock/build-entry handling, and neutral local-command execution ownership. Ordinary/default affected static planning does not select the private `release-version` leaf. A confirmed version-only `package.json` change therefore does not run release-policy validation through implementation static proof, while runtime-relevant package changes still select build/artifact/managed-update static proof. Literal `pnpm verify --full` still runs `release-version` as a private `static` leaf.
- **Unit:** Vitest is the only affected/dependency engine with accepted safe fallback and zero-match behavior.
- **Storybook static:** shared Vite build inputs and neutral local-command execution widen the Storybook static build when its real runtime/build can change.
- **Behavior:** discovery is owner-local `*.behavior.spec.ts`, with `.storybook/**/*.behavior.spec.ts` reserved for truthful Storybook infrastructure ownership. The database native-table virtualization behavior proof additionally runs in the dedicated Firefox project, and the root Playwright lane contract test machine-validates that routing.
- **Visual:** discovery is owner-local `*.visual.spec.ts` with colocated baselines.
- **Browser integration:** generic and exceptional runners remain disjoint; exceptional membership is centrally validated; shared Playwright execution, application Vite harness inputs, and runtime-relevant `package.json` widen the complete public browser-integration type; confirmed version-only package changes stay narrow.
- **Performance:** the public type remains valid with an intentionally empty persistent inventory.
- **Mutation:** the explicit four-target registry is the single automatic mutation ownership source; deleted/renamed infrastructure remains status-aware.
- **E2E:** ordinary page/widget ownership is structural; productionArtifact special execution remains central/fail-closed; shared Playwright execution and application Vite harness inputs widen full E2E. The integrated database virtualization scenario lives under `tests/e2e/widgets/DocumentView/` and is applicable to both desktop and mobile projects.
- **E2E relevance:** target-tree, project applicability, Playwright owner inventory, exceptional membership, and dependency graph validation occur only for E2E-relevant scopes or literal `--full`.
- **Fix mode:** `--fix-only` returns before proof planning.
- **Develop CI:** focused `static`, `unit`, `mutation`, `e2e`, `browser-integration`, `behavior`, and `visual` proof participate in the implementation gate. The independent PR-only `release-version` job is the sole PR version-policy merge gate; preview depends on implementation `verification`, not on that job.
- **Main CI:** the release gate runs `pnpm verify --full`.

Shared Vite ownership is centralized in one derived capability rather than repeated per-planner lists. Neutral low-level command/lock/result/signal ownership is likewise centralized and composed only by truthful current consumers. No tooling dependency graph beyond the dedicated E2E `dependency-cruiser` use, universal planner registry, DSL, cache, or second public metadata model was introduced.

## Compatibility removed and not to be restored

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
- known flaky behavior remains failed proof;
- ordinary coding-agent PR handoff requires one clean cumulative `pnpm verify --base origin/<base>` result unless repository rules explicitly permit the narrow non-code/read-only exception.

## Completion gate

Implementation, architecture, documentation, workflow topology, develop integration, and coding-agent branch verification are complete and architect-accepted.

PR #218 may move to merge-ready only after:

1. GitHub CI is green on the exact final architect-synchronized head, including independent browser-integration, aggregate implementation `verification`, independent `release-version`, and required aggregate `verify`;
2. the exact final head still has no active semantic review finding;
3. PR #218 is moved out of draft;
4. merge into `develop` uses squash merge.

Current merge readiness: **should not merge until blockers are fixed** — the remaining blocker is new exact-head CI / draft readiness, not implementation or architecture.
