# Verify redesign — final review coding-agent correction task

## Read first

Read and follow, in this order:

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `docs/testing/architecture.md`;
4. `docs/testing/verify-redesign-final-review-correction.md`;
5. `scripts/REVIEW.md`.

The architecture is resolved. Do not redesign the verifier taxonomy or choose a different ownership model.

## Problem and cause

The complete PR #218 review found that the implemented eight-type verifier is not yet fail-closed in several affected/execution boundaries even though literal `--full` is broadly complete.

The root problems are:

1. release-sensitive static proof is created only in literal `--full`, so normal/default and `--only static --files ...` cannot run affected `release-version`, `release-config`, `build`, `publisher-node-import`, `artifact-static`, or `managed-updates-static` leaves;
2. special managed-update/browser and `productionArtifact/` E2E execution membership is duplicated across planner/runner/tests and is not validated against the real special filesystem inventory, allowing a valid new special spec to be silently omitted;
3. shared release fixture/publisher/artifact/build support used by special browser-integration/E2E proof is not fully represented in affected selection;
4. the generic browser-integration Playwright config also discovers the appUpdate special corpus, creating a weaker parallel execution path;
5. mutation planning does not treat lockfile/runtime-relevant Stryker toolchain changes as mutation infrastructure;
6. default/fix-only verifier planning can acquire two containerized Playwright owner inventories before proving E2E is relevant;
7. three new/task-touched verifier proof scripts remain `.mjs` without a runtime reason despite native Node 24 TypeScript support;
8. one managed-update comment claims a browser-integration-before-E2E cross-type ordering invariant that is not part of the accepted architecture and is not enforced.

All known scripts-owned findings are consolidated in `scripts/REVIEW.md`. Resolve them in one correction pass.

## Expected final state

### A. Release-sensitive static affected ownership

Add one narrow static-specific planner under `scripts/lib/` (use `releaseStaticRisk.ts` unless an existing task-local file is clearly the simpler owner).

It must resolve affected internal static leaves from explicit file capability/configuration ownership. It is not a generic registry/framework.

Required behavior:

- `release-version` is selected by version/package-version validation ownership;
- `release-config` is selected by release-config validation/configuration ownership;
- production artifact/build inputs select `build` and the deterministic artifact static proof they can affect;
- publisher implementation/import-boundary changes select `publisher-node-import`;
- managed controller/appUpdate/build inputs capable of changing worker byte identity select `managed-updates-static`;
- runtime-relevant `package.json` and lock/build-tooling changes widen the relevant static proof safely;
- a package change proven to be version-only must not be treated as runtime/build impact solely because `package.json` changed;
- when exact narrowing is not cheaply provable, use a broader explicit static path capability rather than dependency inference.

`buildCommands()` must schedule these leaves in normal/default planning when relevant, not only through the literal-full branch. Literal `--full` must still run every one unconditionally.

Do not implement `--only static` by generating a synthetic full command list and filtering it. It must use the same normal affected plan as default verification.

### B. Single exceptional release-browser execution inventory

Create one small TypeScript source of truth under `scripts/lib/` named `releaseProofInventory.ts` for the exceptional fresh-container/cross-engine execution membership:

- the `artifact` browser-integration spec;
- the fixed managed-update browser-integration groups and order;
- the `release-smoke` productionArtifact E2E spec;
- the fixed managed-update productionArtifact E2E groups and within-leaf order.

Both planner and runner must consume this same source.

Remove duplicated hard-coded expected corpus lists from tests.

Add fail-closed validation against the current filesystem:

- all direct `src/shared/service/appUpdate/*.browser-integration.spec.ts` files must equal `artifact` + managed-update browser-integration membership;
- all page/widget `productionArtifact/**/*.e2e.spec.ts` target files must equal `release-smoke` + managed-update E2E membership;
- reject duplicates, missing registered files, unexpected filesystem files, and malformed membership before selection/execution.

`e2eRisk.ts` must route special E2E by exact registered spec membership, not by owner-name heuristic. An unregistered `productionArtifact` target is `invalid`, never `skip`.

The managed-update browser-integration planner/runner must likewise fail closed when its special corpus is incomplete or contains an unexpected spec.

Ordinary page/widget E2E remains structural and must not gain a manual scenario registry.

### C. Complete shared special-support affected ownership

Special browser-integration/E2E affected selection must include the stable shared support that changes their real execution semantics.

At minimum cover:

- `tests/e2e/release/fixtures/**`;
- `scripts/release/artifactServer.mjs`;
- `scripts/pages/lib/**` used by the real publisher path;
- Vite/release build configuration used by those real artifact builds;
- runtime-relevant `package.json` changes;
- `pnpm-lock.yaml`;
- existing release Playwright/container/orchestration infrastructure.

Inspect the current direct execution/import boundary while implementing and include any additional current stable support path needed for completeness. Keep this as explicit support ownership; do not add another dependency graph or source-to-spec mapping table.

A representative shared managed-release fixture/publisher/build-support change must select every dependent special browser-integration/E2E leaf instead of reporting those types irrelevant.

### D. Make generic browser-integration discovery disjoint

`playwright.browserIntegration.config.ts` must be generic-only.

Exclude `src/shared/service/appUpdate/*.browser-integration.spec.ts` from that config so bare:

```bash
pnpm test:browser-integration
```

cannot collect managed-update special specs.

`playwright.release.config.ts` remains the sole Playwright config for the appUpdate special corpus.

Update `playwright.lanes.test.ts` and any focused config proof accordingly.

### E. Mutation toolchain impact

Keep the exact four registered mutation targets unchanged.

Update mutation affected planning so the complete registered mutation inventory is selected for:

- `scripts/lib/mutationTargets.ts`;
- `stryker.config.mjs`;
- `pnpm-lock.yaml`;
- runtime-relevant `package.json` changes that can alter Stryker/Vitest-runner execution.

A package change proven to be version-only remains mutation-irrelevant.

Use the existing package impact comparison mechanism; do not add a second package diff parser.

### F. Avoid expensive E2E acquisition before relevance

Restructure planning so non-static planners are not eagerly resolved before the `--fix-only` early return.

For E2E specifically:

1. cheaply classify whether changed paths can affect E2E;
2. if the default invocation is provably E2E-irrelevant, do not collect Playwright owner inventory and do not acquire dependency-cruiser;
3. `--only <non-e2e>` must acquire neither;
4. `--fix-only` must acquire neither;
5. literal `--full`, changed/added/moved E2E targets, E2E infrastructure/support, and relevant production paths must still perform the required structural validation and fail closed.

The cheap classifier may be conservative. A false-positive broader run is acceptable; a false-negative skip is not.

Do not weaken the accepted filesystem/Playwright target equality proof.

### G. TypeScript-first cleanup

Rename and convert these task-touched/new verifier-owned entry points to native TypeScript:

- `scripts/release/productionArtifactStaticProof.mjs` -> `productionArtifactStaticProof.ts`;
- `scripts/release/managedUpdatesControllerArtifactIdentityProof.mjs` -> `managedUpdatesControllerArtifactIdentityProof.ts`;
- `scripts/release/managedUpdatesProof.mjs` -> `managedUpdatesProof.ts`.

Update direct imports/commands/tests/comments mechanically.

Keep genuinely unrelated legacy `.mjs` scripts unchanged. Do not mass-convert release/page tooling.

### H. Managed-update ordering comment

Do not add cross-type browser-integration-before-E2E ordering.

Preserve the existing required fixed ordering within each managed-update browser-integration/E2E group. Correct the stale comment that claims the whole browser-integration type must finish before E2E.

## Architecture and ownership constraints

- Public verification types remain exactly:
  - `static`
  - `unit`
  - `behavior`
  - `visual`
  - `browser-integration`
  - `performance`
  - `mutation`
  - `e2e`
- No public low-level verifier labels.
- No `release` public type.
- No `--full --only` compatibility.
- `performance` remains a valid empty public type; do not add a performance target.
- Native Vitest remains the only unit dependency/affected engine.
- `dependency-cruiser` remains only the production-to-E2E-owner graph mechanism.
- Ordinary E2E ownership remains page/widget structural ownership.
- Exceptional release-browser inventory is allowed only for the real special fresh-container/cross-engine execution groups described above.
- All verifier-managed Playwright execution remains container-only.
- Keep the existing top-level verify lock and expensive-command lock unchanged.
- Preserve status/resume/logging/timeouts/profile/base/fix semantics.
- No production feature code or product behavior changes.
- No migrated test assertion meaning changes.

## Expected implementation scope

Expected files are limited to the smallest complete set around:

- `scripts/verify.ts` and `scripts/verify.test.ts`;
- new `scripts/lib/releaseStaticRisk.ts` + focused tests;
- new `scripts/lib/releaseProofInventory.ts` + focused validation tests;
- `scripts/lib/browserIntegrationRisk.ts` + tests;
- `scripts/lib/e2eRisk.ts` and only the E2E structural helpers needed for special-inventory validation + tests;
- `scripts/lib/mutationTargets.ts` + tests;
- the three converted `scripts/release/*.ts` proof/orchestration files and their existing tests/importers;
- `playwright.browserIntegration.config.ts`;
- `playwright.lanes.test.ts`;
- direct command/reference updates caused by the three `.mjs` -> `.ts` renames.

Do not edit `.github/workflows/verify.yml` in this pass. The workflow blocker is a separate downstream owner recorded in `.github/workflows/REVIEW.md` and will be handled only after this scripts correction is architect-reviewed.

Do not edit architect-owned control/review records:

- `scripts/REVIEW.md`;
- `.github/workflows/REVIEW.md`;
- `docs/testing/verify-redesign-final-review-correction.md`;
- `docs/testing/verify-redesign-final-review-agent-task.md`;
- `docs/testing/verify-redesign-current-handoff.md`;
- `docs/testing/migration-plan.md`.

## Acceptance criteria

All must hold:

1. Focused/default static planning can run every relevant release-sensitive static leaf without `--full`.
2. Literal `--full` still runs the complete static/browser/E2E/mutation inventories without affected narrowing.
3. One source of truth owns exceptional release-browser execution membership; planner, runner, and tests do not duplicate the corpus.
4. Special browser-integration and `productionArtifact` E2E filesystem inventories are validated for exact equality before they can be treated as valid.
5. An unexpected or missing special spec fails verification rather than being silently skipped.
6. Shared managed-release fixture/publisher/artifact/build support selects every dependent special proof type/leaf.
7. Bare generic browser-integration collection cannot discover appUpdate managed-update specs.
8. `pnpm-lock.yaml` and runtime-relevant mutation toolchain package changes select the complete four-target mutation inventory; version-only package changes do not.
9. Docs-only default, `--fix-only`, and `--only <non-e2e>` do not acquire Playwright E2E owner inventory or dependency-cruiser.
10. Relevant production/E2E/support changes still acquire the required E2E structural proof and fail closed on invalid state.
11. The three named new/task-touched verifier entry points are native TypeScript and participate in `tsconfig.scripts` checking.
12. No cross-type ordering is added solely to preserve the stale comment.
13. No workflow, product code, public taxonomy, lock/container/status/resume, performance, or unit architecture change is included.

## Verification

Use focused verifier-managed feedback only. Do not run a broad local completion gate solely to duplicate GitHub CI.

Required deterministic/unit proof should cover at least:

- release-static leaf affected ownership, including relevant vs unrelated paths and version-only package refinement;
- exact special inventory equality and missing/unexpected/duplicate failure;
- direct selection/routing for every registered special browser/E2E spec;
- shared fixture/publisher/build-support impact;
- generic browser-integration config exclusion;
- mutation lockfile/runtime-package impact;
- E2E acquisition seams proving zero expensive acquisition for docs-only/fix-only/non-E2E-only and positive acquisition for E2E-relevant inputs;
- converted TypeScript entry point import/type-check behavior.

Use the smallest relevant real proof where unit seams are insufficient. In particular:

- keep every Playwright CLI invocation containerized;
- use a real containerized Playwright `--list`/collection proof if needed to prove generic vs special discovery is disjoint;
- use a focused real browser-integration invocation only if needed to prove the corrected special/generic execution boundary;
- use focused static/unit verification for the changed tooling.

Do not run `pnpm verify --full` as a handoff ritual. Exact-head GitHub CI is architect-owned.

## Forbidden

- Do not edit `.github/workflows/verify.yml` in this correction.
- Do not add a ninth/public verification type or a public release type.
- Do not expose private leaf labels through `--only`.
- Do not make `--full` combinable with narrowing options.
- Do not add a generic verification manager/registry/DSL.
- Do not add another dependency graph/import parser for static, browser integration, mutation, or shared E2E support.
- Do not restore a production-path -> ordinary E2E-spec mapping table.
- Do not duplicate special execution corpus lists in planner, runner, and tests.
- Do not let generic Chromium browser-integration remain capable of collecting the managed-update special corpus.
- Do not weaken filesystem/Playwright E2E inventory equality.
- Do not weaken mutation registry validation or change the four accepted mutation targets.
- Do not bypass/relax lock, container, timeout, flaky-failure, status/resume, profile/base, or fix behavior.
- Do not add sleeps/retries/timeout inflation to make browser proof pass.
- Do not change product behavior or assertion meaning.
- Do not mass-convert unrelated legacy `.mjs` tooling.
- Do not edit the review/control documents listed above.

## Report

Return exactly:

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
