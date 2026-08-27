# Verify redesign — final review architecture revision 02

## Status

Ready architecture handoff after re-review of implementation `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53`.

The implementation correctly followed `verify-redesign-final-review-architecture-revision.md`, including the E2E relevance gate. Deeper consumer inspection showed that the previous handoff itself modeled two shared execution boundaries too narrowly. This document supersedes that handoff for the remaining scripts work.

The public eight-type verification architecture is unchanged.

## Goal

Make affected ownership match the real verifier execution graph for:

- low-level local command/lock/result/signal execution shared by browser and static proof;
- Vite-backed build/harness inputs shared by release static, Storybook, browser-integration, and E2E;
- runtime-relevant `package.json` impact across the complete public browser-integration type.

Keep the already-correct E2E relevance gate and all previously accepted verifier contracts unchanged.

## Confirmed current behavior and evidence

- `scripts/release/buildArtifact.mjs`, `scripts/release/productionArtifactStaticProof.ts`, and `scripts/release/managedUpdatesControllerArtifactIdentityProof.ts` use `localCommandGuard` / `runLocalCommand` / `processResult`; `scripts/storybook.mjs` uses the same boundary. Therefore that boundary is not Playwright-specific.
- `scripts/playwrightContainer.ts` also uses that low-level command boundary, so browser-backed types still depend on it through Playwright execution.
- `playwright.browserIntegration.config.ts` and `playwright.config.ts` both start the real application through Vite build/preview.
- Storybook uses `@storybook/vue3-vite`; the Vite builder loads/merges the root Vite configuration. `.storybook/main.ts` also directly consumes `config/alias.ts` and `config/tooling.json`.
- Vite automatically consumes root PostCSS configuration; this repository has `postcss.config.js`.
- `vite.config.ts` consumes `.browserslistrc`, root/config TypeScript build configuration, `config/**`, `package.json`, and application source. `vite-plugin-pwa` is configured with `pwaAssets.config: true`, so the production PWA build also consumes `pwa-assets.config.ts`.
- `index.html` and `public/**` are Vite application/static inputs without page/widget or colocated test ownership. They can change the real application harness used by browser-integration/E2E.
- exceptional browser-integration already treats runtime-relevant `package.json` as full, but generic browser-integration does not. A package-script/runtime dependency change can therefore select only part of the public browser-integration type.
- `ccd2bc...` correctly moved E2E target-tree/applicability validation behind the same E2E relevance decision as inventory/graph acquisition. That change is accepted and must not be reopened without new evidence.

## Non-goals

- no public verification type or CLI changes;
- no new dependency graph/import parser for static, Storybook, or browser selection;
- no universal planner registry, DSL, execution graph service, or cache;
- no `all scripts/** -> all types` rule;
- no change to unit or mutation execution ownership merely because standalone package scripts also reuse command helpers; `pnpm verify` executes those types directly;
- no change to product code, assertions, E2E owner structure, project applicability, mutation registry, performance inventory, locks, container-only Playwright, status/resume, timeout, profile/base, or flaky-failure semantics;
- no `.github/workflows/verify.yml` correction until scripts review is clean.

## Affected scenarios

1. A shared local command helper changes -> every verifier leaf that actually executes through that helper must run; unrelated types that bypass it must not widen solely because a standalone package script reuses it.
2. A shared Vite build/config/static input changes -> every Vite-backed proof type whose runtime can change must widen safely.
3. An application Vite entry/static/PWA-assets input without structural product ownership changes -> browser-integration and E2E must not skip it.
4. A runtime-relevant `package.json` change affects browser tooling/runtime -> the complete public browser-integration type runs; a positively confirmed version-only change keeps the existing narrow treatment.

## Boundaries and ownership

Changes remain in verifier/tooling under `scripts/` and focused tests.

### Shared local command execution

Add one neutral low-level predicate, e.g. `scripts/lib/localCommandExecutionRisk.ts`, owning exactly the current common execution boundary:

- `scripts/lib/localCommandGuard.ts`;
- `scripts/lib/commandLock.ts`;
- `scripts/lib/runLocalCommand.ts`;
- `scripts/lib/processResult.ts`;
- `scripts/lib/signalForward.ts`.

This predicate describes execution infrastructure, not verification types.

Consumers:

- `playwrightExecutionRisk.ts` composes it with Playwright-specific infrastructure;
- `releaseStaticRisk.ts` uses it to select `build`, `artifact-static`, and `managed-updates-static` because all three current proof paths execute through that boundary;
- `storybookBuildRisk.ts` uses it to select the Storybook static build;
- behavior, visual, browser-integration, and E2E continue receiving it through the Playwright-specific predicate.

Do not add unit or mutation widening from this predicate: current `buildCommands()` invokes Vitest and Stryker directly rather than through `scripts/vitestRun.mjs` / `scripts/mutate.mjs`.

### Shared Vite-backed inputs

Add one neutral Vite capability module/predicate rather than repeating build-input lists across planners.

`isSharedViteBuildInputPath`-style ownership must cover the current stable cross-consumer inputs:

- non-test/proof files under `config/**`;
- `vite.config.ts`;
- `postcss.config.js`;
- `.browserslistrc`;
- root `tsconfig*.json`;
- `public/**`.

The `config/**` rule excludes deterministic test/spec/test-helper files. Do not enumerate individual `config/plugins/*.ts` imports.

An `isApplicationViteHarnessInputPath`-style capability extends the shared Vite inputs with:

- `index.html`;
- `pwa-assets.config.ts`.

The latter is intentionally broad for application browser/E2E ownership: it is a real production PWA artifact input, and both public types contain production-artifact proof even though their ordinary dev/test harness may disable PWA.

Consumers:

- `releaseStaticRisk.ts`: application Vite harness inputs plus existing eligible production `src/**`, release build entry, package/lock handling -> `build` + `artifact-static`; existing appUpdate/controller rules additionally -> `managed-updates-static`;
- `storybookBuildRisk.ts`: shared Vite build input -> full Storybook static build;
- `storybookBehaviorRisk.ts`: shared Vite build input -> full behavior;
- `visualRisk.ts`: shared Vite build input -> full visual;
- both generic and exceptional browser-integration planning: application Vite harness input -> complete public browser-integration ownership;
- E2E relevance/planning: application Vite harness input -> full E2E, preserving all current structural validation once relevant.

Do not route ordinary `src/**` through this shared predicate. Existing colocated/browser ownership and E2E dependency traversal remain responsible for production source. The shared capability exists for ownerless/global Vite inputs.

### Browser-integration package impact

Runtime-relevant `package.json` is one public browser-integration-wide impact decision:

- runtime-relevant -> exceptional + generic browser-integration inventories are both selected/full;
- positively confirmed top-level version-only -> no browser widening solely from package.json.

Reuse `isPackageJsonRuntimeRelevantChange`; do not add another package parser or dependency classifier. The implementation may pass `packageJsonOldRef` into the generic resolver or resolve the same existing helper at the smallest local composition boundary.

`pnpm-lock.yaml` remains covered through the existing Playwright execution infrastructure ownership.

## Source of truth and state shape

No persistent state, registry metadata, or public API is added.

Sources of truth are only derived changed-path predicates:

- one low-level local-command execution predicate;
- one Vite build/harness capability;
- existing type-specific planners and existing package-impact helper.

Type-specific configs, specs, owners, and special release inventory remain where they are today.

## Minimum sufficient design

1. Split the current `playwrightExecutionRisk.ts` fact into a neutral local-command boundary plus Playwright-specific composition.
2. Replace repeated/partial Vite input knowledge with one neutral Vite capability consumed by the existing planners.
3. Make runtime package impact complete across both browser-integration execution paths.
4. Preserve `ccd2bc...` E2E relevance gating and all previously accepted fixes unchanged.

This adds only the two shared facts proven to have multiple current consumers. It removes duplicated path knowledge and is simpler than another sequence of owner-local patches.

## Rejected approaches

- adding `postcss.config.js`, `index.html`, helper paths, etc. independently to every planner: repeats the ownership drift already observed;
- treating all `scripts/**`, all root config files, or every package script as affecting every verification type: safe but unnecessarily broad and not truthful to `buildCommands()` execution;
- dependency-cruiser/import parsing for Vite/tooling consumers: unnecessary for these stable coarse capabilities;
- a universal execution graph/planner registry: broader than the confirmed problem;
- reopening the accepted E2E relevance gate, special release inventory, fix-only order, mutation status handling, or generic/special browser separation.

## Acceptance matrix

- each low-level local-command path -> release `build` + `artifact-static` + `managed-updates-static`, Storybook static build, and all Playwright-backed owning types;
- the same low-level paths do not widen unit/mutation merely because optional standalone wrappers use them;
- `config/plugins/*.ts`, `config/alias.ts`, `config/vueCustomElements.ts`, `postcss.config.js`, `.browserslistrc`, root `tsconfig*.json`, and `public/**` -> all truthful Vite-backed owning types;
- `index.html` and `pwa-assets.config.ts` -> application Vite/browser/E2E/release-static ownership without requiring page/widget metadata;
- proof/test/spec helper files under `config/**` remain excluded from the Vite capability;
- runtime-relevant `package.json` -> complete public browser-integration; confirmed version-only remains narrow;
- docs-only/default and `--only <non-e2e>` remain behind the accepted E2E relevance gate;
- relevant/full E2E retains inventory equality, target-tree, applicability, special membership, and graph validation;
- special release inventory/full/direct validation, `--fix-only`, mutation deletion/rename handling, TypeScript-first proof entry points, and generic appUpdate exclusion remain unchanged.

## Required test proof

- neutral local-command predicate tests plus consumer tests for release static, Storybook build, behavior, visual, browser-integration, and E2E;
- Vite capability tests covering representative `config/**`, `postcss.config.js`, `.browserslistrc`, root tsconfig, `public/**`, `index.html`, `pwa-assets.config.ts`, and deterministic exclusions;
- planner/integration tests proving Vite inputs widen the correct public types and `buildCommands()` includes the expected leaves;
- generic browser-integration regression proving runtime-relevant package.json widens generic + exceptional, while version-only does not;
- preserve existing E2E relevance-gate tests and other accepted regression proof where touched.

## Required verification

Coding-agent implementation may use only focused verifier-managed unit/static feedback needed for this tooling change. Exact-head GitHub CI remains architect-owned.

The downstream workflow browser-integration lane is corrected only after this scripts implementation receives a clean architect re-review.

## Forbidden

- no `.github/workflows/verify.yml` edits in this pass;
- no third set of independent path lists across each planner;
- no dependency/import graph for static/Vite/Playwright planning;
- no universal verification manager/registry/DSL;
- no public taxonomy, product assertion, mutation-target, performance, lock, container, or E2E ownership changes;
- do not weaken any accepted fail-closed inventory/structural validation.

## Implementation readiness

- required architecture decisions resolved: yes;
- source of truth and ownership explicit: yes;
- simplest viable alternative compared: yes;
- unresolved architecture blockers: none;
- verdict: **ready**.
