# Verify redesign — final affected-ownership revision 02 coding-agent task

## Read first

Read and follow, in this order:

1. root `AGENTS.md`;
2. `.agents/skills/implementation-preflight/SKILL.md`;
3. `.agents/skills/verification/SKILL.md`;
4. `docs/testing/architecture.md`;
5. `docs/testing/migration-plan.md`;
6. `docs/testing/verify-redesign-final-review-architecture-revision-02.md`;
7. `scripts/REVIEW.md`.

Run implementation preflight from the ready revision-02 architecture before editing. The architecture is resolved. If current repository evidence invalidates it, stop and report `blocked`; do not invent a replacement design.

## Problem and cause

Implementation `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53` correctly implemented the previous architecture revision, including the E2E relevance gate. Complete consumer re-review then proved that the previous architecture modeled shared ownership too narrowly.

Three scripts-owned blockers remain:

1. The command/lock/result/signal boundary currently centralized as Playwright execution infrastructure is also used by release build/artifact proof and Storybook static build. Static verification can therefore skip after a low-level execution change that directly affects its proof runner.
2. Vite-backed proof types share global/ownerless build and application-harness inputs, but release static, Storybook, browser-integration, and E2E still own incomplete independent subsets. Inputs such as root PostCSS configuration, `public/**`, `index.html`, and PWA-assets configuration can alter a real build/harness while one or more owning public types skip.
3. Runtime-relevant `package.json` widens exceptional browser-integration but not generic browser-integration, so one public verification type can still execute only partially.

The root cause is incomplete duplicated ownership facts. Do not fix this by adding the newly discovered paths independently to each planner.

## Expected final state and architecture decision

### A. Neutral local-command execution ownership

Add `scripts/lib/localCommandExecutionRisk.ts` as the single path predicate for the current verifier execution boundary shared outside Playwright:

- `scripts/lib/localCommandGuard.ts`;
- `scripts/lib/commandLock.ts`;
- `scripts/lib/runLocalCommand.ts`;
- `scripts/lib/processResult.ts`;
- `scripts/lib/signalForward.ts`.

Expose one narrow predicate such as `isSharedLocalCommandExecutionPath(filePath)`.

Refactor `scripts/lib/playwrightExecutionRisk.ts` so its Playwright-specific predicate **composes** the neutral local-command predicate and retains only Playwright-specific shared inputs there, including the existing truthful Playwright/container/tooling/lock inputs. Remove the duplicated local-command literals from the Playwright-specific source of truth once composition is authoritative.

Consume the neutral local-command predicate directly from:

- `releaseStaticRisk.ts`: a hit selects `build`, `artifact-static`, and `managed-updates-static`, because all three current proof paths execute through this boundary;
- `storybookBuildRisk.ts`: a hit selects the Storybook static build.

Behavior, visual, browser-integration, and E2E continue receiving the same low-level impact through `playwrightExecutionRisk.ts`.

Do **not** widen unit or mutation from this predicate. Current `buildCommands()` invokes Vitest and Stryker directly; optional standalone wrappers are not the verifier execution graph.

### B. One neutral Vite build/harness capability

Add `scripts/lib/viteBuildRisk.ts` as the single shared capability owner for Vite-backed global/ownerless inputs.

It must expose two narrow predicates:

1. `isSharedViteBuildInputPath(filePath)` covering:
   - non-test/proof files under `config/**`;
   - `vite.config.ts`;
   - `postcss.config.js`;
   - `.browserslistrc`;
   - root `tsconfig*.json`;
   - `public/**`.
2. `isApplicationViteHarnessInputPath(filePath)` extending the shared set with:
   - `index.html`;
   - `pwa-assets.config.ts`.

The `config/**` rule must deterministically exclude test/spec/story/test-helper/proof-only files. Do not enumerate individual `config/plugins/*.ts` files or infer their import graph.

Do not include ordinary production `src/**` in this shared capability. Existing production-source ownership remains with colocated planners and E2E dependency traversal.

Consume the shared Vite capability as follows:

- `releaseStaticRisk.ts`: application Vite harness input selects `build` + `artifact-static`; preserve existing additional managed-update, release-config, release-version, publisher-boundary, package/lock, production-source, and proof-owner semantics;
- `storybookBuildRisk.ts`: shared Vite input selects full Storybook static build;
- `storybookBehaviorRisk.ts`: shared Vite input selects full behavior;
- `visualRisk.ts`: shared Vite input selects full visual;
- `browserIntegrationRisk.ts`: application Vite harness input selects the complete public browser-integration type, meaning both generic and exceptional plans widen;
- `e2eRisk.ts`: application Vite harness input is E2E-relevant and selects full E2E. The cheap relevance classifier must return relevant for the same capability, so the already-accepted structural validation path executes normally.

Remove superseded duplicated Vite/global path facts from type-specific exact sets when the shared capability becomes authoritative. Keep truthful type-specific configs/runners/helpers in their existing planners.

### C. Complete runtime package ownership for browser-integration

Reuse the existing `isPackageJsonRuntimeRelevantChange` decision for **both** browser-integration execution paths.

Required behavior:

- runtime-relevant `package.json` -> full exceptional browser-integration **and** full generic browser-integration;
- positively confirmed top-level version-only `package.json` -> no browser-integration widening solely because of `package.json`.

Do not create another package parser or dependency classifier.

Pass `packageJsonOldRef` to the generic browser-integration planning/composition boundary where needed. Ensure `buildCommands()` and `addGenericBrowserIntegrationCommands()` preserve the same package comparison context as exceptional planning.

## Constraints and preserved behavior

The public verification types remain exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Preserve these already-accepted contracts unchanged:

- the E2E relevance gate from `ccd2bc...`: E2E-irrelevant default/`--only <non-e2e>` invocations do not resolve target-tree, applicability, Playwright inventory, or dependency-graph work; E2E-relevant and literal `--full` retain complete fail-closed validation;
- `releaseProofInventory.ts` remains the single exceptional release-browser membership owner and focused/full/direct special execution remains fail-closed;
- generic browser-integration remains structurally disjoint from the appUpdate special corpus;
- `--fix-only` returns before proof planners/validators;
- mutation planning preserves deleted/renamed infrastructure identities and the four registered mutation targets remain unchanged;
- ordinary E2E remains structural page/widget ownership with dependency-cruiser used only for production reachability;
- verifier-managed Playwright remains container-only;
- top-level verify lock, expensive-command lock, status/resume, logging, timeout, profile/base, fix, and flaky-failure semantics remain unchanged.

Do not edit `.github/workflows/verify.yml`. Its browser-integration CI blocker is downstream and architect-owned until `scripts/REVIEW.md` is clean.

Do not edit architect-owned control records:

- `scripts/REVIEW.md`;
- `.github/workflows/REVIEW.md`;
- `docs/testing/verify-redesign-final-review-architecture-revision-02.md`;
- `docs/testing/verify-redesign-current-handoff.md`;
- `docs/testing/migration-plan.md`;
- this task file.

## Expected implementation scope

Use the smallest complete scripts-owned set, expected around:

- new `scripts/lib/localCommandExecutionRisk.ts` and its focused test;
- `scripts/lib/playwrightExecutionRisk.ts` and its test;
- new `scripts/lib/viteBuildRisk.ts` and its focused test;
- `scripts/lib/releaseStaticRisk.ts` and its test;
- `scripts/lib/storybookBuildRisk.ts` and its test;
- `scripts/lib/storybookBehaviorRisk.ts` and its test;
- `scripts/lib/visualRisk.ts` and its test;
- `scripts/lib/browserIntegrationRisk.ts` and its test;
- `scripts/lib/e2eRisk.ts` and its test;
- `scripts/verify.ts` and `scripts/verify.test.ts` where composition/package context requires it.

Touch another scripts file only when current direct repository evidence proves it is required by revision 02. Do not change product source/tests merely to make planner tests convenient.

Prefer TypeScript for every new tooling module. Remove replaced duplicated path facts; do not leave two authoritative ownership lists behind.

## TEST IMPACT

- Contract/scenario: low-level command execution affects every verifier leaf that actually executes through it.
  - Primary proof owner: `scripts/lib/localCommandExecutionRisk.test.ts`.
  - Additional proof: release-static, Storybook-build, Playwright-execution, behavior, visual, browser-integration, and E2E planner tests.
  - Required cases: representative local-command/lock/result/signal paths select release `build` + `artifact-static` + `managed-updates-static`, Storybook static build, and all Playwright-backed owning types; unit/mutation are not widened solely by this capability.

- Contract/scenario: global Vite build/harness inputs widen every truthful Vite-backed proof owner.
  - Primary proof owner: `scripts/lib/viteBuildRisk.test.ts`.
  - Additional proof: release-static, Storybook build/behavior, visual, browser-integration, E2E planner tests and `scripts/verify.test.ts` composition where needed.
  - Required representative inputs: `config/alias.ts`, `config/plugins/*.ts`, `config/vueCustomElements.ts`, `postcss.config.js`, `.browserslistrc`, root `tsconfig*.json`, `public/**`, `index.html`, and `pwa-assets.config.ts`.
  - Required exclusions: deterministic config test/spec/story/test-helper/proof files do not become Vite build inputs solely by location.

- Contract/scenario: runtime package changes own the complete public browser-integration type.
  - Primary proof owner: `scripts/lib/browserIntegrationRisk.test.ts`.
  - Additional proof: `scripts/verify.test.ts` if needed to prove final leaf composition.
  - Required cases: runtime-relevant package change selects generic + exceptional browser-integration; confirmed version-only does not widen either solely because `package.json` changed.

- Regression proof where touched: preserve the existing E2E relevance-gate tests, exceptional inventory validation, fix-only behavior, mutation deletion/rename handling, and generic appUpdate exclusion.

No new product/browser scenario assertions are required. Do not run browser proof merely to prove deterministic affected-planner classification already covered faithfully by unit tests.

## Acceptance criteria

All must hold:

1. Exactly one neutral local-command predicate owns the common command/lock/result/signal paths.
2. `playwrightExecutionRisk.ts` composes that predicate instead of duplicating its paths.
3. A representative neutral local-command change selects release `build`, `artifact-static`, `managed-updates-static`, Storybook static build, full behavior, full visual, complete public browser-integration, and full E2E.
4. The same local-command capability does not widen unit/mutation solely because standalone wrappers reuse it.
5. Exactly one neutral Vite capability owns shared/global Vite inputs; type-specific planners do not retain independent copies of those same facts.
6. Representative `config/**`, `postcss.config.js`, `.browserslistrc`, root tsconfig, and `public/**` changes widen release static, Storybook static/behavior/visual, complete browser-integration, and E2E according to revision 02.
7. `index.html` and `pwa-assets.config.ts` widen release static, complete browser-integration, and E2E without page/widget metadata; they are not required to widen Storybook solely through the application-harness extension.
8. Deterministic config proof/test/spec/story/helper files remain excluded from the shared Vite capability.
9. Ordinary `src/**` remains governed by existing production-source/colocated/E2E dependency ownership rather than a new global Vite mapping.
10. Runtime-relevant `package.json` selects both generic and exceptional browser-integration; confirmed version-only remains narrow.
11. E2E application-harness inputs make the cheap relevance gate return relevant and then select full E2E with all existing fail-closed structural validation preserved.
12. The accepted E2E relevance gate itself is not weakened or moved back to unconditional validation.
13. Central exceptional release inventory/full/direct validation, `--fix-only`, mutation status handling, generic/special browser separation, container-only Playwright, public taxonomy, locks, timeout/logging/status/profile semantics, and product/test assertion meaning remain unchanged.
14. No `.github/workflows/verify.yml` change is included.

## Verification

Use implementation preflight and only focused verifier-managed feedback that materially helps this tooling change.

Expected useful local feedback:

- `pnpm verify --only unit --files <all touched verifier source/test files>`;
- `pnpm verify --only static --files <all touched verifier source/test files>`.

Do not run `pnpm verify` or `pnpm verify --full` as a completion ritual. Exact-head GitHub CI remains architect-owned.

## Forbidden

- Do not add another independent command-execution path list to individual planners.
- Do not add another independent Vite/global-build path list to individual planners.
- Do not add a dependency/import graph for Vite/tooling ownership.
- Do not add a universal verification manager, planner registry, DSL, cache, or new metadata model.
- Do not treat all `scripts/**` or all root files as affecting all verification types.
- Do not widen unit/mutation from the neutral local-command capability when current verify execution bypasses it.
- Do not create a second package-impact parser/classifier.
- Do not expose private leaf labels through public `--only`, add a ninth/public release type, or restore `verify:release`.
- Do not weaken exceptional release membership or E2E structural/filesystem/Playwright equality validation.
- Do not change the four mutation targets or restore mutation adjacency/custom graph selection.
- Do not restore production-path -> ordinary E2E-spec mappings.
- Do not let generic browser-integration collect the appUpdate special corpus.
- Do not weaken locks, container-only Playwright, timeouts, flaky-failure semantics, status/resume, profile/base, or fix behavior.
- Do not add sleeps, retry inflation, timeout inflation, or assertion weakening.
- Do not change production feature behavior or migrated test assertion meaning.
- Do not edit `.github/workflows/verify.yml` or the architect-owned review/handoff/task files listed above.

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
