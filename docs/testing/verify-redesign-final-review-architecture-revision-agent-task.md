# Verify redesign — affected-ownership architecture revision coding-agent task

## Read first

Read and follow, in this order:

1. root `AGENTS.md`;
2. `.agents/skills/implementation-preflight/SKILL.md`;
3. `.agents/skills/verification/SKILL.md`;
4. `docs/testing/architecture.md`;
5. `docs/testing/migration-plan.md`;
6. `docs/testing/verify-redesign-final-review-architecture-revision.md`;
7. `scripts/REVIEW.md`.

Run implementation preflight from the ready architecture handoff before editing code. The architecture is resolved. If current repository evidence invalidates it, stop and report `blocked`; do not invent a replacement design.

## Problem and cause

Two correction rounds fixed several verify-redesign defects but repeated affected-ownership drift remains:

1. `releaseStaticRisk.ts` still models production artifact/build inputs with an incomplete exact config list. Real Vite artifact inputs such as `config/alias.ts`, `config/plugins/**`, `config/vueCustomElements.ts`, `.browserslistrc`, and related repository build configuration can change emitted output while `build` and `artifact-static` skip.
2. The command/lock/result/signal infrastructure behind `scripts/playwrightContainer.ts` is shared by behavior, visual, generic browser-integration, exceptional browser-integration, and E2E, but its affected ownership is duplicated incompletely across type-specific planners.
3. `buildCommands()` already gates expensive E2E Playwright inventory/graph acquisition, but still resolves E2E target-tree and project-applicability validation after E2E has been classified irrelevant.

The root cause is duplicated/incomplete ownership facts, not missing individual paths. Implement the revised architecture instead of adding another independent path list.

## Expected final state

### A. Production artifact static capability

Keep `scripts/lib/releaseStaticRisk.ts` as the sole owner of release-sensitive static affected planning.

Replace the incomplete production-artifact exact dependency list with one broad stable repository capability predicate. It must classify as production artifact/build inputs:

- production files under `src/**`, excluding deterministically proof-only/test/story/spec/helper files;
- `public/**`;
- non-test/proof files under `config/**`;
- root `vite.config.ts`;
- root `index.html`;
- root `.browserslistrc`;
- root `tsconfig*.json` build inputs;
- `scripts/release/buildArtifact.mjs`;
- runtime-relevant `package.json` through the existing package-impact refinement;
- `pnpm-lock.yaml`.

Every such input must select both `build` and `artifact-static`.

Preserve the existing additional ownership:

- appUpdate/controller production input -> `build` + `artifact-static` + `managed-updates-static`;
- publisher import-boundary input -> `publisher-node-import`;
- release-config inputs -> `release-config`, plus build/artifact when the same file is also a production artifact capability;
- release-version inputs -> `release-version`;
- a confirmed version-only `package.json` change remains release-version-only and must not widen build/browser/mutation proof solely because `package.json` changed;
- proof implementations continue to select their own truthful leaf where already required.

Do not enumerate `config/alias.ts`, individual `config/plugins/*.ts`, or their transitive imports as separate build dependencies. The stable `config/**` capability is the source of truth. Keep deterministic exclusions local and explicit; do not infer reachability with a graph.

### B. One shared Playwright execution-infrastructure source of truth

Add one small verifier-owned module/predicate, e.g. `scripts/lib/playwrightExecutionRisk.ts`, for paths whose runtime semantics are genuinely shared by every Playwright-container-backed verification type.

Its current shared infrastructure source of truth must include at least:

- `config/tooling.json`;
- `pnpm-lock.yaml`;
- `scripts/playwrightContainer.ts`;
- `scripts/lib/localCommandGuard.ts`;
- `scripts/lib/commandLock.ts`;
- `scripts/lib/runLocalCommand.ts`;
- `scripts/lib/processResult.ts`;
- `scripts/lib/signalForward.ts`.

`package.json` must not be added to this unconditional shared predicate; keep the existing runtime/version refinement in the type-specific planners.

Consume this predicate from the existing type-specific planners:

- `storybookBehaviorRisk.ts`: shared hit -> full behavior;
- `visualRisk.ts`: shared hit -> full visual;
- `browserIntegrationRisk.ts`: shared hit -> full exceptional browser-integration and full generic browser-integration, so the complete public browser-integration type is selected;
- `e2eRisk.ts`: shared hit -> full E2E and the cheap E2E relevance classifier returns relevant.

Remove duplicated shared-infrastructure path ownership from type-specific exact sets when the new predicate becomes authoritative. Keep type-specific Playwright configs, runners, fixtures, helpers, release support, Storybook support, and other truthful local infrastructure in their existing planners.

This module is only a path predicate for shared execution infrastructure. It must not become a type registry, test registry, planner manager, dependency graph, or generic verification framework.

### C. One E2E relevance gate before all E2E structural validation

In `scripts/verify.ts`, resolve E2E relevance once from the invocation and changed paths.

When E2E is irrelevant, including docs-only default work and `--only <non-e2e>` invocations:

- do not call `resolveStructuralE2EPlan()`;
- do not call `validateE2ETargetTree()`;
- do not call `validateE2EProjectApplicability()`;
- do not collect Playwright E2E owner inventory;
- do not acquire the dependency-cruiser graph;
- emit the normal E2E skip planning result without synthesizing a structural failure.

When E2E is relevant:

- retain every current fail-closed target-tree, project-applicability, Playwright/filesystem inventory equality, productionArtifact exceptional membership, owner, and graph check;
- keep current focused/full routing semantics.

Literal `--full` is always E2E-relevant and must run complete structural validation.

Do not weaken structural validation to obtain the gate. Move the validation boundary behind relevance; do not remove it.

## Ownership and constraints

The public verification contract remains exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Preserve all accepted second-correction behavior:

- `releaseProofInventory.ts` remains the single exceptional release-browser membership owner;
- focused, literal-full, and direct managed special execution remain fail-closed on invalid exceptional membership;
- generic browser-integration remains structurally disjoint from the appUpdate special corpus;
- `--fix-only` returns before proof planners/validators;
- mutation planning preserves deleted/renamed-away mutation-infrastructure identities and the four registered targets remain unchanged;
- ordinary E2E remains structural page/widget ownership with dependency-cruiser used only for production reachability;
- verifier-managed Playwright stays container-only;
- top-level verify lock, expensive-command lock, status/resume, logging, timeout, profile/base, fix semantics, and flaky-failure behavior remain unchanged.

Do not edit `.github/workflows/verify.yml`. The workflow blocker is downstream and architect-owned until `scripts/REVIEW.md` is clean.

Do not edit architect-owned control records:

- `scripts/REVIEW.md`;
- `.github/workflows/REVIEW.md`;
- `docs/testing/verify-redesign-final-review-architecture-revision.md`;
- `docs/testing/verify-redesign-current-handoff.md`;
- `docs/testing/migration-plan.md`;
- this task file.

## Expected implementation scope

Use the smallest complete set, expected around:

- `scripts/lib/releaseStaticRisk.ts` and `scripts/lib/releaseStaticRisk.test.ts`;
- new `scripts/lib/playwrightExecutionRisk.ts` and focused unit tests;
- `scripts/lib/storybookBehaviorRisk.ts` and tests;
- `scripts/lib/visualRisk.ts` and tests;
- `scripts/lib/browserIntegrationRisk.ts` and tests;
- `scripts/lib/e2eRisk.ts` and tests;
- `scripts/verify.ts` and `scripts/verify.test.ts`.

Touch another scripts file only when current direct repository evidence proves it is required by this architecture. Do not change product source/tests merely to make planner tests convenient.

Remove superseded duplicated shared path facts when centralizing them; do not leave two authoritative lists behind.

## TEST IMPACT

- Contract/scenario: production/build input affected ownership for release-sensitive static proof.
  - Primary proof owner: `scripts/lib/releaseStaticRisk.test.ts`.
  - Additional proof: `scripts/verify.test.ts` for selected real `build` + `artifact-static` leaves under default/`--only static` composition.
  - Required cases: ordinary production source/assets, `public/**`, `config/alias.ts`, representative `config/plugins/*.ts`, `config/vueCustomElements.ts`, `.browserslistrc`, root `tsconfig*.json`, appUpdate production, runtime package/lock, version-only package, and deterministic test/story/spec/helper exclusions.

- Contract/scenario: shared Playwright execution infrastructure affects every browser-backed verification type.
  - Primary proof owner: new shared predicate unit tests.
  - Additional proof: existing behavior, visual, browser-integration, and E2E planner tests each prove a representative shared path widens the complete owning type; browser-integration integration/planner proof must show generic plus exceptional selection together.
  - Durable ownership update: the shared predicate replaces duplicated common path literals in type-specific planners.

- Contract/scenario: E2E structural validation is relevance-gated.
  - Primary proof owner: `scripts/verify.test.ts` dependency seams.
  - Required cases: docs-only default and `--only <non-e2e>` call no E2E tree/applicability/inventory/graph dependencies; relevant production/E2E input and literal `--full` still call the required validation/acquisition path and preserve fail-closed behavior.

- Regression proof where touched: central exceptional membership validation, fix-only non-invocation, deleted/renamed mutation infrastructure, and generic appUpdate exclusion remain unchanged.

No browser runtime/product assertion changes are part of this task, so do not add new Playwright scenario execution solely for this planner refactor.

## Acceptance criteria

All must hold:

1. `config/alias.ts`, a representative production `config/plugins/*.ts`, `config/vueCustomElements.ts`, `.browserslistrc`, root `tsconfig*.json`, ordinary production `src/**`, `public/**`, `vite.config.ts`, `index.html`, and the release build entry select `build` + `artifact-static`.
2. Deterministically proof-only/test/story/spec/helper files under `src/**` and `config/**` do not become production artifact inputs solely by location.
3. appUpdate/controller production changes additionally select `managed-updates-static`.
4. Version-only `package.json` remains narrow; runtime-relevant package and lock changes retain the already accepted safe widening.
5. One shared Playwright execution-infrastructure predicate owns the common runtime paths; type-specific planners do not maintain independent copies of that shared list.
6. A representative shared execution-infrastructure change makes behavior full, visual full, generic browser-integration full, exceptional browser-integration full, and E2E full.
7. Default browser-integration planning for the same shared hit selects both generic and exceptional browser-integration execution leaves through the existing composition.
8. Type-specific helper/config changes remain owned only by their truthful type(s); the shared predicate is not widened into generic `scripts/**` ownership.
9. Docs-only default and `--only <non-e2e>` E2E-irrelevant plans invoke none of target-tree, project-applicability, Playwright owner inventory, or dependency-cruiser graph acquisition.
10. Relevant E2E scopes and literal `--full` retain all current structural validators and fail-closed behavior.
11. Central exceptional release-proof inventory/full/direct validation remains intact.
12. `--fix-only`, status-preserving mutation planning, generic/special browser separation, container-only Playwright, public taxonomy, locks, timeout/logging/status/profile semantics, and product/test assertion meaning remain unchanged.
13. No `.github/workflows/verify.yml` change is included.

## Verification

Use implementation preflight and focused verifier-managed feedback only.

The expected useful local feedback is:

- `pnpm verify --only unit --files <all touched verifier source/test files>`;
- `pnpm verify --only static --files <all touched verifier source/test files>`.

Run them when useful to prove the implementation; do not run `pnpm verify` or `pnpm verify --full` as a completion ritual. Do not require Podman merely to prove deterministic planner/path classification already covered by unit tests.

Exact-head GitHub CI and the downstream workflow correction remain architect-owned.

## Forbidden

- Do not add a third independent common Playwright path list to individual planners.
- Do not add a dependency/import graph for release-static, behavior, visual, or browser-integration selection.
- Do not add a universal verification manager, planner registry, DSL, cache, or new metadata model.
- Do not expose private leaf labels through public `--only` or add a ninth/public release type.
- Do not restore `verify:release`.
- Do not weaken exceptional release membership or E2E structural/filesystem/Playwright equality validation.
- Do not change the four mutation targets or restore mutation adjacency inference.
- Do not restore production-path -> ordinary E2E-spec mappings.
- Do not let generic browser-integration collect the appUpdate special corpus.
- Do not weaken locks, container-only Playwright, timeouts, flaky-failure semantics, status/resume, profile/base, or fix behavior.
- Do not add sleeps, retries, timeout inflation, or assertion weakening.
- Do not change production feature behavior or migrated test assertion meaning.
- Do not edit `.github/workflows/verify.yml` or architect-owned review/handoff/task files listed above.

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
