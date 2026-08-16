# Verify V2A — application E2E planner precision

Status: implementation complete and architecture-reviewed; exact-head GitHub CI is the authoritative merge gate. The legacy playground cleanup is complete; its actual local E2E planner observation is recorded below.

This document is the implementation handoff for Stage V2A of verify modernization. `docs/testing/architecture.md` remains the canonical testing policy, and `docs/testing/migration-plan.md` remains the source of truth for the currently executable repository state.

Stage V1 was merged in PR #197. V2A changes only application-E2E impact planning. Visual planner precision and CI execution topology remain separate later changes. The superseded legacy playground was removed in its own completed cleanup.

## Goal

Reduce avoidable full application-E2E runs when the repository already has a stable source-to-product-scenario relation, without weakening product-scenario coverage or the fail-closed rule for unknown relevant impact.

The desired result is not “run fewer tests whenever possible”. Known product impact selects the smallest complete scenario set; unknown relevant impact still selects full application E2E.

## Non-goals

- Do not change application E2E scenarios or move specs.
- Do not change Playwright projects, workers, retries, sharding, or desktop/mobile applicability.
- Do not change Storybook behavior or visual planning.
- Do not change release verification, unit selection, mutation selection, or proof ownership.
- Do not introduce a dependency graph, import-graph resolver, generic impact DSL, production annotations, or a second scenario registry.
- Do not create broad “safe to skip E2E” allowlists for shared code.
- Do not remove the legacy playground as part of V2A; its separately completed cleanup is recorded below because Storybook superseded that developer surface.
- V2A did not add temporary planner exceptions for playground code scheduled for removal; the completed cleanup did not add one either.
- Do not claim wall-clock improvement from this resolver PR itself; the PR changes `e2eRisk.ts`, which remains full-E2E infrastructure impact.

## Confirmed current state

`scripts/lib/e2eRisk.ts` owns one explicit application-E2E scenario registry, `E2E_SCENARIO_SCOPES`, and validates that every centralized application-E2E spec is covered by that registry or an explicitly justified standalone entry.

Pre-V2A broad low-level classification conflates two different concepts:

1. a source domain is relevant to application E2E;
2. every change under that domain necessarily requires the complete application-E2E lane.

The broad domains include `src/app/`, `src/shared/service/`, `src/shared/serviceClient/`, `src/shared/lib/`, and `src/shared/ui/`. V2A separates mandatory-full infrastructure from product/source relevance while preserving full fallback for unknown relevant source, including non-TypeScript/Vue files in those broad runtime domains.

Confirmed ownership evidence:

- `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` is used by `databaseViewsAndQueryFlows.spec.ts` and all five `reorderSurface*.spec.ts` scenarios, so it owns the complete existing six-spec database-views + reorder set.
- `src/shared/lib/sortable/` is the legacy SortableJS implementation. Its sole remaining production consumer is `DatabaseItemSortingListSection.vue`, exercised by `databaseViewsAndQueryFlows.spec.ts`; the five `reorderSurface*.spec.ts` scenarios exercise the separate canonical `@shared/lib/reorder` implementation.
- `src/shared/ui/Query/` is used by the database-filter/query flow exercised by `databaseViewsAndQueryFlows.spec.ts`.
- Directory-prefix scenario matching must not make colocated `*.test.ts`, `*.spec.ts`, `*.testUtils.ts`, or `*.stories.*` files select application E2E merely because they live under a mapped source directory.
- At V2A completion, `src/app/playgroundPages.ts` and `src/shared/lib/playground/**` were legacy dev-only code. `setupApp()` loaded them only inside `import.meta.env.DEV`, ordinary app E2E ran the production `vite build && vite preview` path, and `setupPlayground()` had no other caller. The completed cleanup removed that bootstrap, source, and confirmed playground-only pages; Storybook is now the supported shared-UI development and demonstration surface. No planner mapping or cleanup-specific exclusion was added.

## Architecture decision

### 1. Keep one scenario mapping owner

`E2E_SCENARIO_SCOPES` remains the only explicit source-to-application-E2E mapping registry.

Do not add a second mapping table for shared code. Shared, widget, feature, entity, or app paths with stable product-scenario ownership belong in the existing registry.

### 2. Separate mandatory-full impact from relevant product/source impact

Use two distinct classifications:

- **full-lane infrastructure impact**: configuration/tooling/CI infrastructure whose consumer set is intentionally the complete application-E2E lane;
- **application-E2E-relevant product/source**: source that must never be silently skipped but may select focused scenarios when an explicit mapping exists.

A mapped relevant path resolves to its mapped specs. An unmapped relevant path resolves to `full`.

### 3. Preserve fail-closed runtime relevance

Unknown production/runtime source under the affected broad app/shared domains remains application-E2E relevant regardless of extension, except for existing proof-only exclusions such as stories and test files.

Stories and test-only files remain outside application-E2E product-source relevance. Non-TypeScript/Vue runtime source under broad app/shared domains remains protected and falls back to full when unmapped.

### 4. Do not model superseded playground code in V2A (historical, cleanup complete)

V2A did not map these legacy playground paths to `appSmoke.spec.ts`:

- `src/app/playgroundPages.ts`;
- `src/shared/lib/playground/` and descendants.

`appSmoke.spec.ts` runs against a production build and cannot exercise their `import.meta.env.DEV` branch, so such a mapping would claim proof that does not execute the changed source.

V2A also did not add a special skip/exclusion for those paths. Because the playground was superseded by Storybook and scheduled for separate removal, planner state solely for its short remaining lifetime would have added unnecessary temporary complexity.

The completed cleanup removed the dev-only bootstrap and source themselves. `e2eRisk.ts` still needs no playground mapping or playground-specific exclusion; its fail-closed treatment of a removed relevant path is recorded in the cleanup observation below.

### 5. Preserve canonical resolution order

Application E2E resolution remains:

1. full-lane infrastructure path → full lane;
2. added/modified existing app-E2E spec → focused direct spec unless another full condition applies;
3. removed/renamed app-E2E spec → full lane;
4. explicit product/source mapping → union of mapped specs;
5. unmapped relevant product/source → full lane;
6. path outside application-E2E relevance → no selection.

Registry validation remains blocking/fail-closed.

Before source-prefix scenario matching, stories and test-only files must be excluded from product-source scenario matching.

### 6. Confirmed V2A mappings

The final explicit mappings are:

- `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` plus the five existing `tests/e2e/reorderSurface*.spec.ts` files;
- `src/shared/lib/sortable/` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` only;
- `src/shared/ui/Query/` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` only.

There is no playground scenario mapping and no playground-specific relevance exception in V2A.

Do not broaden any mapping to neighboring directories merely to reduce execution.

## Expected plan changes

| Changed path                                               | Pre-V2A | V2A target                                                                    |
| ---------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` | full    | focused `databaseViewsAndQueryFlows.spec.ts` + five `reorderSurface*.spec.ts` |
| `src/shared/lib/sortable/useReorderSurface.ts`             | full    | focused `databaseViewsAndQueryFlows.spec.ts`                                  |
| `src/shared/ui/Query/QueryRoot.vue`                        | full    | focused `databaseViewsAndQueryFlows.spec.ts`                                  |
| mapped feature/entity product paths                        | focused | unchanged                                                                     |
| mapped `*.test.ts` / `*.spec.ts` / story path              | varies  | skip app E2E unless independently a direct app-E2E spec                       |
| `src/entities/googleSession/index.ts`                      | full    | full                                                                          |
| unmapped `src/shared/ui/**` production/runtime source      | full    | full                                                                          |
| unmapped `src/shared/lib/**` production/runtime source     | full    | full                                                                          |
| true E2E infrastructure/config                             | full    | full                                                                          |

When several changed paths are present, any true-full or unknown-relevant hit upgrades the plan to full.

## State and ownership

No application state, persisted verifier state, or public product API changes.

Ownership remains:

- `docs/testing/architecture.md`: canonical testing and fail-closed policy;
- `scripts/lib/e2eRisk.ts`: application-E2E relevance, mapping validation, and plan resolution;
- `E2E_SCENARIO_SCOPES`: explicit production source-to-product-scenario impact facts;
- application E2E specs: existing product-scenario proof owners.

No ownership moves into product code.

## Acceptance criteria

1. Known production scenario mappings can focus even under formerly broad app/shared domains.
2. Unknown relevant product/runtime source still selects full application E2E.
3. Non-TypeScript/Vue runtime source under broad app/shared production domains is not silently dropped.
4. True E2E infrastructure/configuration continues to select full.
5. Direct existing app-E2E spec behavior remains unchanged.
6. Removed/renamed app-E2E specs remain fail-closed to full.
7. Registry validation remains blocking and covers every application-E2E spec.
8. `DatabaseViewsSheet.vue` selects all six confirmed scenarios that operate through that surface.
9. `src/shared/lib/sortable/` selects only `databaseViewsAndQueryFlows.spec.ts`, not canonical reorder-surface specs.
10. Test/story-only files under mapped product directories do not select app E2E through prefix matching.
11. No temporary playground-specific skip/relevance mechanism is introduced; the later completed cleanup removed those paths without planner changes.
12. Storybook behavior, visual, release, unit, mutation, Playwright project matrix, and CI topology are unchanged.
13. No second mapping registry, dependency graph, broad skip allowlist, or generic planner abstraction is introduced.
14. Package version remains the tooling PATCH version `0.3.16`.

## Required proof

Update `scripts/lib/e2eRisk.test.ts` with coverage for:

- `DatabaseViewsSheet.vue` → exactly the six database-views/reorder specs;
- representative `src/shared/lib/sortable/` source → exactly `databaseViewsAndQueryFlows.spec.ts`;
- representative `src/shared/ui/Query/` source → exactly `databaseViewsAndQueryFlows.spec.ts`;
- mapped test/spec/story paths → no app-E2E selection;
- unknown relevant app/shared TypeScript/Vue and non-TypeScript runtime source → full;
- mapped + mapped union;
- mapped + unknown relevant → full;
- mapped + infrastructure → full;
- direct app-E2E spec selection;
- removed/renamed app-E2E spec full fallback;
- Storybook/visual/release exclusions;
- scenario registry validation.

Keep proof at resolver/unit level unless a changed contract genuinely requires browser execution. Because `scripts/lib/e2eRisk.ts` itself is application-E2E infrastructure, exact-head PR CI still runs the full application-E2E lane as the final repository execution gate.

## Completed follow-up: remove legacy playground

The completed cleanup removed the guarded bootstrap from `setupApp.ts`, `src/app/playgroundPages.ts`, `src/shared/lib/playground/**`, and every current registry page confirmed to have no non-playground source consumer. Storybook remains the supported shared-UI development and demonstration surface; no replacement runtime playground was introduced.

For the cleanup diff at verification time, `pnpm verify --only e2e` used local-base `origin/develop` scope and selected the full application-E2E lane. Its exact trigger was `unmapped application-E2E-relevant path src/app/playgroundPages.ts -> full app e2e (map it in scripts/lib/e2eRisk.ts or add e2e coverage)`. This is the planner's intended fail-closed handling of a removed relevant path, not a planner bug: `scripts/lib/e2eRisk.ts` remains unchanged and no cleanup-specific exclusion was introduced. The selected 118-test Chromium and Mobile Chrome run passed in 10m56s with no retry or flaky classification.

## Deferred

### Stage V2B — visual planner precision

Audit visual relevance, deterministic owner moves, docs/instructions/type-only paths, and remaining broad visual fallbacks separately.

### Stage V3 — CI execution performance

After planner precision is stable, measure CI wall-clock and separately evaluate isolated desktop/mobile E2E jobs and, only if justified, Storybook artifact reuse.

## Forbidden

- Do not turn unknown relevant production source into `skip`.
- Do not use a broad “no E2E impact” allowlist for shared runtime code.
- Do not reintroduce a dev-only runtime playground or map one to a production app-E2E spec that cannot execute it.
- Do not add cleanup-specific planner infrastructure for removed playground code.
- Do not add speculative mappings based only on directory proximity.
- Do not classify unit/browser/story proof files as product-source E2E impact merely because they live under a mapped source prefix.
- Do not change or weaken application-E2E assertions.
- Do not change retries, flaky handling, workers, projects, sharding, browser matrix, or CI topology.
- Do not move application-E2E specs.
- Do not touch visual planner behavior in this PR.
- Do not introduce generic impact infrastructure or a second registry.
