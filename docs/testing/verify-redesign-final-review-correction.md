# Verify redesign — final resulting-PR correction architecture

## Status

Active correction after the complete PR #218 re-review.

The accepted eight-type architecture is unchanged. The review found implementation gaps in affected/execution ownership and CI coverage; this correction fixes those gaps without reopening the taxonomy, E2E product ownership model, unit architecture, lock/container model, or migrated product assertions.

Active review sources:

- `scripts/REVIEW.md` — first correction owner;
- `.github/workflows/REVIEW.md` — downstream CI owner after the scripts correction is accepted.

## Goal

Make normal/default and focused verification as fail-closed as literal `--full` for the contracts owned by `static`, `browser-integration`, `mutation`, and special production-artifact E2E, while keeping irrelevant invocations cheap.

## Non-goals

- no ninth/public verification type;
- no return to low-level public `--only` labels;
- no generic verification framework, second dependency graph, persistent cache, or broad source-to-test registry;
- no product behavior or migrated assertion changes;
- no redesign of page/widget E2E ownership or project applicability;
- no change to top-level verify lock, expensive-command lock, container-only Playwright, status/resume, timeout, profile/base, or fix semantics;
- no performance runner/budget;
- no workflow correction in the first scripts-owned pass.

## Decision 1 — release-sensitive static leaves use explicit affected ownership

The following internal leaves remain owned by public `static`:

- `release-version`;
- `release-config`;
- `build`;
- `publisher-node-import`;
- `artifact-static`;
- `managed-updates-static`.

They must no longer be created only as a side effect of literal `--full`.

Add one narrow release-static planner under `scripts/lib/` (for example `releaseStaticRisk.ts`) that resolves the relevant internal leaves from changed path capability/configuration ownership. This is a static-specific resolver, not a general registry/framework.

Required ownership behavior:

- version/package version validation changes select `release-version`;
- release-config validation/configuration inputs select `release-config`;
- production artifact/build inputs select `build` and the deterministic artifact proof they can affect;
- publisher implementation/import-boundary changes select `publisher-node-import`;
- managed controller/appUpdate/build inputs that can change worker byte identity select `managed-updates-static`;
- runtime-relevant `package.json` and lock/build-tooling changes widen the relevant static leaves safely;
- confirmed version-only `package.json` changes must not be treated as runtime/build impact merely because the file is `package.json`;
- when a path has broad artifact/build impact and precise narrowing is not provable cheaply, selecting the broader relevant static leaf set is preferred to adding dependency inference.

`--full` still runs all static leaves unconditionally. `--only static` filters the same normally planned static ownership; it does not use a synthetic full command list.

## Decision 2 — one source of exceptional release-browser execution membership

The exceptional fresh-container/cross-engine execution groups are allowed to be explicit because their grouping is an execution-semantic requirement, not ordinary product ownership.

Create one small TypeScript source of truth under `scripts/lib/` (for example `releaseProofInventory.ts`) for:

- the production-artifact browser-integration spec executed by the `artifact` leaf;
- the managed-update browser-integration groups and their fixed group order;
- the release-smoke productionArtifact E2E spec;
- the managed-update productionArtifact E2E groups and their fixed within-leaf group order.

`release/managedUpdatesProof` and the verifier planners consume this same inventory. Do not keep a second hard-coded `EXPECTED_*_CORPUS` list in tests.

Before affected selection or special execution, validate exact set equality against the current filesystem special inventory:

- all direct appUpdate `*.browser-integration.spec.ts` files must equal `artifact` + managed-update browser-integration membership;
- all target E2E files under owner-local `productionArtifact/` must equal `release-smoke` + managed-update E2E membership;
- duplicates, missing registered files, unexpected filesystem files, and malformed membership fail closed.

A structurally valid but unregistered special spec is invalid repository state. It must never turn into `skip` and must never be routed by owner-name heuristics.

Ordinary page/widget E2E remains structural and registry-free.

## Decision 3 — special shared support widens the owning proof

The managed-update browser-integration and productionArtifact E2E corpora share real release/build test support outside their spec directories.

Use explicit stable support ownership, not a new import graph, for this exceptional runner boundary. A change to shared support must select every dependent special leaf/type.

At minimum the affected model must cover:

- `tests/e2e/release/fixtures/**`;
- `scripts/release/artifactServer.mjs` (or its TypeScript replacement if task-touched later);
- `scripts/pages/lib/**` used by the real publisher path exercised by the fixture;
- Vite/release build configuration used by those real artifact builds;
- runtime-relevant `package.json` changes and `pnpm-lock.yaml`;
- the existing release Playwright/container/orchestration infrastructure.

The coding pass must inspect the current direct execution/import boundary and include any additional current stable support path required for completeness. This is inventory completion inside the resolved ownership model, not an invitation to invent a different mechanism.

## Decision 4 — generic browser-integration runner is structurally disjoint

`playwright.browserIntegration.config.ts` is the generic Chromium browser-integration runner only.

It must structurally exclude the appUpdate special corpus. Bare `pnpm test:browser-integration` must not collect managed-update specs that require the release/fresh-container/cross-engine runner.

The existing `playwright.release.config.ts` remains the only Playwright configuration that discovers/executes the appUpdate special corpus.

## Decision 5 — mutation toolchain is mutation infrastructure

The explicit four-target mutation registry remains unchanged.

Mutation affected planning must select the complete registered inventory for:

- `scripts/lib/mutationTargets.ts`;
- `stryker.config.mjs`;
- `pnpm-lock.yaml`;
- runtime-relevant `package.json` changes that can alter Stryker/Vitest-runner execution.

A package change proven to be version-only remains mutation-irrelevant.

No adjacency inference or automatic mutation target discovery is reintroduced.

## Decision 6 — relevance is resolved before expensive E2E inventory acquisition

Do not run Playwright owner inventory or dependency-cruiser merely to discover that E2E is irrelevant.

Required order:

1. resolve invocation/fix mode and changed paths;
2. for `--fix-only`, finish static fixer planning without resolving non-static planners;
3. cheaply classify whether changed paths can affect E2E;
4. only when E2E is relevant (or literal `--full` requires complete validation), acquire/validate the structural E2E filesystem + Playwright inventory and dependency graph as needed;
5. retain fail-closed validation for changed/added/moved E2E targets, E2E infrastructure, shared E2E support, and relevant production changes.

`--only <non-e2e>` must acquire no E2E graph/Playwright inventory. A docs-only default invocation must also avoid it when the changed-path classifier proves E2E irrelevant.

The cheap classifier may be conservative; false-positive widening is acceptable, false-negative skipping is not.

## Decision 7 — no cross-type ordering contract is added

There is no canonical requirement that the entire `browser-integration` type must finish before the `e2e` type begins inside `pnpm verify --full`.

Preserve the fixed ordering **within** each managed-update leaf/group where fresh-container semantics require it. Correct the stale comment that claims a cross-type browser-integration-before-E2E invariant; do not add cross-type coupling solely to preserve that comment.

## Decision 8 — TypeScript-first applies to the new verifier proof scripts

No loader/runtime exception has been found for the new verifier-owned proof entry points. Convert these task-touched/new scripts to native TypeScript:

- `scripts/release/productionArtifactStaticProof.mjs` -> `.ts`;
- `scripts/release/managedUpdatesControllerArtifactIdentityProof.mjs` -> `.ts`;
- `scripts/release/managedUpdatesProof.mjs` -> `.ts`.

Update direct consumers/tests mechanically. Do not mass-convert unrelated legacy release/page scripts.

## Acceptance boundary for the first correction pass

The scripts-owned pass is accepted only when every finding in `scripts/REVIEW.md` is resolved together. Do not edit `.github/workflows/verify.yml` in this pass.

After scripts re-review is clean, the architect will issue/perform the downstream workflow correction recorded in `.github/workflows/REVIEW.md`: add public `browser-integration` to the develop CI gate and aggregate dependency.
