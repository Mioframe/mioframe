# Verify V2A — application E2E planner precision

Status: architecture ready for final implementation correction.

This document is the implementation handoff for Stage V2A of verify modernization. `docs/testing/architecture.md` remains the canonical testing policy, and `docs/testing/migration-plan.md` remains the source of truth for the currently executable repository state.

Stage V1 was merged in PR #197. V2A changes only application-E2E impact planning. Visual planner precision and CI execution topology remain separate later stages.

## Goal

Reduce avoidable full application-E2E runs when the repository already has a stable source-to-product-scenario relation, without weakening product-scenario coverage or the fail-closed rule for unknown relevant impact.

The desired result is not “run fewer tests whenever possible”. Known product impact selects the smallest complete scenario set; confirmed paths that are outside production app-E2E execution select no app-E2E work; unknown relevant impact still selects full application E2E.

## Non-goals

- Do not change application E2E scenarios or move specs.
- Do not change Playwright projects, workers, retries, sharding, or desktop/mobile applicability.
- Do not change Storybook behavior or visual planning.
- Do not change release verification, unit selection, mutation selection, or proof ownership.
- Do not introduce a dependency graph, import-graph resolver, generic impact DSL, production annotations, or a second scenario registry.
- Do not create broad “safe to skip E2E” allowlists for shared code.
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
- `src/app/playgroundPages.ts` and `src/shared/lib/playground/**` are dev-only bootstrap/source. `setupApp()` loads them only inside `import.meta.env.DEV`, while the application-E2E Playwright configuration runs `vite build && vite preview`, so ordinary app E2E executes the production branch and cannot exercise these files. Repository code search shows `setupPlayground()` is called only from that dev-only branch.

## Architecture decision

### 1. Keep one scenario mapping owner

`E2E_SCENARIO_SCOPES` remains the only explicit source-to-application-E2E mapping registry.

Do not add a second mapping table for shared code. Shared, widget, feature, entity, or app paths with stable product-scenario ownership belong in the existing registry.

### 2. Separate mandatory-full impact from relevant product/source impact

Use two distinct classifications:

- **full-lane infrastructure impact**: configuration/tooling/CI infrastructure whose consumer set is intentionally the complete application-E2E lane;
- **application-E2E-relevant product/source**: production source that must never be silently skipped but may select focused scenarios when an explicit mapping exists.

A mapped relevant path resolves to its mapped specs. An unmapped relevant path resolves to `full`.

### 3. Preserve fail-closed runtime relevance

Unknown production/runtime source under the affected broad app/shared domains remains application-E2E relevant regardless of extension, except for explicitly proven non-product/proof-only paths.

Stories and test-only files remain outside application-E2E product-source relevance. Non-TypeScript/Vue runtime source under broad app/shared production domains remains protected and falls back to full when unmapped.

### 4. Treat confirmed dev-only playground source as outside app-E2E relevance

The following paths are confirmed outside the production app-E2E execution graph:

- `src/app/playgroundPages.ts`;
- `src/shared/lib/playground/` and descendants.

They must not be mapped to `appSmoke.spec.ts`: that test runs a production build and cannot exercise the `import.meta.env.DEV` branch.

For the **application-E2E lane only**, these exact dev-only paths resolve to no selection (`skip`) when no other changed path requires app E2E.

Implement this as a narrow, explicit dev-only relevance exclusion inside the existing app-E2E relevance owner. Do not generalize it into a reusable skip registry or a broad playground-name heuristic.

Changes to `setupApp.ts` itself remain relevant/full when unmapped because it is production bootstrap code outside the guarded dev-only modules.

### 5. Preserve canonical resolution order

Application E2E resolution remains:

1. full-lane infrastructure path → full lane;
2. added/modified existing app-E2E spec → focused direct spec unless another full condition applies;
3. removed/renamed app-E2E spec → full lane;
4. explicit product/source mapping → union of mapped specs;
5. unmapped relevant product/source → full lane;
6. confirmed non-product/proof-only/dev-only source → no selection;
7. other path outside application-E2E relevance → no selection.

Registry validation remains blocking/fail-closed.

Before source-prefix scenario matching, stories and test-only files must be excluded from product-source scenario matching.

### 6. Confirmed V2A mappings

The final explicit mappings are:

- `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` plus the five existing `tests/e2e/reorderSurface*.spec.ts` files;
- `src/shared/lib/sortable/` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` only;
- `src/shared/ui/Query/` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` only.

`src/app/playgroundPages.ts` and `src/shared/lib/playground/` are **not** scenario mappings; they are confirmed dev-only app-E2E exclusions.

Do not broaden any mapping or exclusion to neighboring directories merely to reduce execution.

## Expected plan changes

| Changed path                                               | Pre-V2A | V2A target                                                                    |
| ---------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `src/app/playgroundPages.ts`                               | full    | skip app E2E                                                                  |
| `src/shared/lib/playground/setupPlayground.ts`             | full    | skip app E2E                                                                  |
| `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` | full    | focused `databaseViewsAndQueryFlows.spec.ts` + five `reorderSurface*.spec.ts` |
| `src/shared/lib/sortable/useReorderSurface.ts`             | full    | focused `databaseViewsAndQueryFlows.spec.ts`                                  |
| `src/shared/ui/Query/QueryRoot.vue`                        | full    | focused `databaseViewsAndQueryFlows.spec.ts`                                  |
| mapped feature/entity product paths                        | focused | unchanged                                                                     |
| mapped `*.test.ts` / `*.spec.ts` / story path              | varies  | skip app E2E unless independently a direct app-E2E spec                       |
| `src/entities/googleSession/index.ts`                      | full    | full                                                                          |
| unmapped `src/shared/ui/**` production/runtime source      | full    | full                                                                          |
| unmapped `src/shared/lib/**` production/runtime source     | full    | full                                                                          |
| true E2E infrastructure/config                             | full    | full                                                                          |

When several changed paths are present, any true-full or unknown-relevant hit still upgrades the plan to full. Confirmed dev-only/test/story paths do not dilute or override another path's focused/full selection.

## State and ownership

No application state, persisted verifier state, or public product API changes.

Ownership remains:

- `docs/testing/architecture.md`: canonical testing and fail-closed policy;
- `scripts/lib/e2eRisk.ts`: application-E2E relevance, dev-only exclusion, mapping validation, and plan resolution;
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
11. `src/app/playgroundPages.ts` and representative `src/shared/lib/playground/**` paths resolve `skip` for app E2E because production Playwright execution cannot load them.
12. `src/app/setupApp.ts` remains full when unmapped; the DEV-only exclusion must not broaden to production bootstrap.
13. Storybook behavior, visual, release, unit, mutation, Playwright project matrix, and CI topology are unchanged.
14. No second mapping registry, dependency graph, broad skip allowlist, or generic planner abstraction is introduced.
15. Package version remains the tooling PATCH version `0.3.15`.

## Required proof

Update `scripts/lib/e2eRisk.test.ts` with coverage for:

- `src/app/playgroundPages.ts` → app-E2E `skip`;
- representative production and non-TypeScript paths under `src/shared/lib/playground/` → app-E2E `skip`;
- `src/app/setupApp.ts` → full, proving the dev-only exclusion is narrow;
- dev-only path + mapped production path → mapped focused specs only;
- dev-only path + unknown relevant production path → full;
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

## Deferred

### Stage V2B — visual planner precision

Audit visual relevance, deterministic owner moves, docs/instructions/type-only paths, and remaining broad visual fallbacks separately.

### Stage V3 — CI execution performance

After planner precision is stable, measure CI wall-clock and separately evaluate isolated desktop/mobile E2E jobs and, only if justified, Storybook artifact reuse.

## Forbidden

- Do not turn unknown relevant production source into `skip`.
- Do not use a broad “no E2E impact” allowlist for shared runtime code.
- Do not use filename heuristics such as `*Playground*` to classify dev-only source.
- Do not map dev-only playground source to a production app-E2E spec that cannot execute it.
- Do not add speculative mappings based only on directory proximity.
- Do not classify unit/browser/story proof files as product-source E2E impact merely because they live under a mapped source prefix.
- Do not change or weaken application-E2E assertions.
- Do not change retries, flaky handling, workers, projects, sharding, browser matrix, or CI topology.
- Do not move application-E2E specs.
- Do not touch visual planner behavior in this PR.
- Do not introduce generic impact infrastructure or a second registry.
