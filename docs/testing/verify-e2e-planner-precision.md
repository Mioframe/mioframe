# Verify V2A — application E2E planner precision

Status: architecture ready for implementation correction.

This document is the implementation handoff for Stage V2A of verify modernization. `docs/testing/architecture.md` remains the canonical testing policy, and `docs/testing/migration-plan.md` remains the source of truth for the currently executable repository state.

Stage V1 was merged in PR #197. V2A changes only application-E2E impact planning. Visual planner precision and CI execution topology remain separate later stages.

## Goal

Reduce avoidable full application-E2E runs when the repository already has a stable source-to-product-scenario relation, without weakening product-scenario coverage or the fail-closed rule for unknown relevant impact.

The desired result is not “run fewer tests whenever possible”. The desired result is: known impact selects the smallest complete scenario set; unknown relevant impact still selects full application E2E.

## Non-goals

- Do not change application E2E scenarios or move specs.
- Do not change Playwright projects, workers, retries, sharding, or desktop/mobile applicability.
- Do not change Storybook behavior or visual planning.
- Do not change release verification, unit selection, mutation selection, or proof ownership.
- Do not introduce a dependency graph, import-graph resolver, generic impact DSL, production annotations, or a second scenario registry.
- Do not create broad “safe to skip E2E” allowlists for shared code.
- Do not claim wall-clock improvement from this resolver PR itself; the PR necessarily changes `e2eRisk.ts`, which remains full-E2E infrastructure impact.

## Confirmed current state

`scripts/lib/e2eRisk.ts` owns one explicit application-E2E scenario registry, `E2E_SCENARIO_SCOPES`, and validates that every centralized application-E2E spec is covered by that registry or an explicitly justified standalone entry.

Current resolution is fail closed, but the pre-V2A broad low-level classification conflates two different concepts:

1. a source domain is relevant to application E2E;
2. every change under that domain necessarily requires the complete application-E2E lane.

The broad domains include all of `src/app/`, `src/shared/service/`, `src/shared/serviceClient/`, `src/shared/lib/`, and `src/shared/ui/`. A path under one of those domains used to become `full` before an explicit scenario mapping could help.

At the same time, unmapped `src/**/*.ts` and `src/**/*.vue` already fail closed to full application E2E. Therefore broad shared prefixes are not required to preserve fail-closed behavior for TypeScript/Vue source; they mainly prevent known lower-level ownership from becoming focused. V2A must separately preserve the old protection for non-TypeScript/Vue files under those broad app/shared domains.

Confirmed examples and ownership evidence:

- `src/app/playgroundPages.ts` is dev-only playground registration loaded by `setupApp()` only under `import.meta.env.DEV`; application startup smoke is its narrow app-E2E integration proof.
- `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` is not only the basic view-settings surface. All five `tests/e2e/reorderSurface*.spec.ts` scenarios open and operate through the database views sheet, so changes to that widget can affect the complete existing database-views + reorder scenario set.
- `src/shared/lib/sortable/` is the legacy SortableJS implementation. Its nested rules and README confirm its sole remaining production consumer is `src/features/databaseItemSorting/DatabaseItemSortingListSection.vue`, rendered by `DatabaseSortSheet.vue`. `tests/e2e/databaseViewsAndQueryFlows.spec.ts` exercises that sorting surface. The five `reorderSurface*.spec.ts` scenarios do **not** exercise this module; the database-view reorder surface uses the separate canonical `@shared/lib/reorder` implementation.
- `src/shared/ui/Query/` has its production use in the database-filter/query flow (with a separate playground consumer), which is exercised by `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.
- Existing directory-prefix scenario matching must not make a changed `*.test.ts`, `*.spec.ts`, `*.testUtils.ts`, or `*.stories.*` file select application E2E merely because it sits under a mapped source directory. Those files are not product-source impact for this lane.

## Architecture decision

### 1. Keep one scenario mapping owner

`E2E_SCENARIO_SCOPES` remains the only explicit source-to-application-E2E mapping registry.

Do not add a second mapping table for shared code. Shared, widget, feature, entity, or app paths with stable scenario ownership belong in the same existing registry.

### 2. Separate relevance from mandatory full-lane impact

Use two distinct classifications:

- **full-lane infrastructure impact**: configuration/tooling/bootstrap infrastructure whose consumer set is intentionally the complete application-E2E lane;
- **application-E2E-relevant product/source domains**: source that must never be silently skipped, but may select focused scenarios when an explicit mapping exists.

A mapped path in a relevant source domain must be allowed to resolve to its mapped specs. An unmapped relevant path must still resolve to `full`.

Do not implement this by checking “mapping first, low-level second” against a classification that still semantically means mandatory full-lane impact. The classifications themselves must remain truthful.

### 3. Preserve fail-closed relevance for non-TypeScript runtime sources

The old broad prefixes also catch runtime/support files other than `.ts`/`.vue` under app/shared domains. V2A must not accidentally turn those into `skip` merely because broad full prefixes are narrowed.

The relevant-source classification must preserve current protection for files under the affected app/shared domains. Known mapped runtime files may focus; unknown relevant files there must still fall back to full application E2E.

Stories and test-only files remain outside application-E2E product-source relevance. Storybook behavior, visual, and release paths remain independently owned.

### 4. Preserve canonical resolution order

Application E2E resolution remains consistent with `docs/testing/architecture.md`:

1. full-lane infrastructure path → full lane;
2. added/modified existing app-E2E spec → that focused spec unless another full condition applies;
3. removed/renamed app-E2E spec → full lane;
4. explicit product/source mapping → union of mapped specs;
5. unmapped relevant product/source → full lane;
6. path outside application-E2E relevance → no selection.

Registry validation remains blocking/fail-closed.

Before explicit source-prefix matching, stories and test-only files must be excluded from product-source scenario matching. A mapped directory does not turn its unit/browser/story proof files into app-E2E source impact.

### 5. Add only confirmed V2A mappings

Add the smallest mappings justified by current repository evidence:

- `src/app/playgroundPages.ts` → `tests/e2e/appSmoke.spec.ts`;
- `src/shared/lib/playground/` → `tests/e2e/appSmoke.spec.ts` for dev bootstrap/runtime integration;
- `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` → the existing **database views and query flows** scenario set: `tests/e2e/databaseViewsAndQueryFlows.spec.ts` plus the five existing `tests/e2e/reorderSurface*.spec.ts` files;
- `src/shared/lib/sortable/` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` only; its sole production consumer is the database sorting surface, and the five reorder-surface E2E specs exercise `@shared/lib/reorder`, not this legacy module;
- `src/shared/ui/Query/` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts` only.

Do not broaden these mappings to neighboring directories merely to reduce execution. A wider prefix is valid only if its complete production consumer/scenario set is confirmed from the repository.

### 6. Unknown shared code stays full

After separating relevance from mandatory full impact, an unmapped relevant path under `src/shared/ui/`, `src/shared/lib/`, `src/shared/service/`, or `src/shared/serviceClient/` must still select full application E2E.

For example, an unmapped shared UI primitive or `src/shared/lib/automerge/**` change must not become `skip` simply because the old broad full prefix was removed.

This is the central safety invariant of V2A.

## Expected plan changes

Representative expected results after V2A:

| Changed path                                               | Pre-V2A                                       | V2A target                                                                    |
| ---------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/app/playgroundPages.ts`                               | full                                          | focused `appSmoke.spec.ts`                                                    |
| `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` | full                                          | focused `databaseViewsAndQueryFlows.spec.ts` + five `reorderSurface*.spec.ts` |
| `src/shared/lib/sortable/useReorderSurface.ts`             | full                                          | focused `databaseViewsAndQueryFlows.spec.ts`                                  |
| `src/shared/ui/Query/QueryRoot.vue`                        | full                                          | focused `databaseViewsAndQueryFlows.spec.ts`                                  |
| mapped feature/entity paths                                | focused                                       | unchanged                                                                     |
| mapped `*.test.ts` / `*.spec.ts` / story path              | may currently over-select due prefix matching | skip app E2E unless independently relevant as a direct app-E2E spec           |
| `src/entities/googleSession/index.ts` (unmapped relevant)  | full                                          | full                                                                          |
| unmapped `src/shared/ui/**` runtime source                 | full                                          | full                                                                          |
| unmapped `src/shared/lib/**` runtime source                | full                                          | full                                                                          |
| true E2E infrastructure/config                             | full                                          | full                                                                          |
| Storybook/visual/release-only paths                        | independent/skip for app E2E                  | unchanged                                                                     |

When several changed product/source paths map to different scenarios, focused specs continue to union and deduplicate. Any simultaneous true-full or unknown-relevant hit still upgrades the plan to full.

## State and ownership

No application state, persisted verifier state, or public product API changes.

Ownership remains:

- `docs/testing/architecture.md`: canonical testing and fail-closed policy;
- `scripts/lib/e2eRisk.ts`: application-E2E relevance, mapping validation, and plan resolution;
- `E2E_SCENARIO_SCOPES`: explicit centralized product-scenario impact facts;
- application E2E specs: existing product-scenario proof owners.

No ownership moves into product code.

## Acceptance criteria

1. Known scenario mappings can focus even when the source lives under `src/app`, `src/shared/lib`, or `src/shared/ui`.
2. Unknown relevant product/runtime source still selects full application E2E.
3. Runtime non-TS/Vue source under affected broad app/shared domains is not silently dropped.
4. True shared E2E infrastructure/configuration continues to select full.
5. Existing scenario mappings and direct-spec behavior remain unchanged except for the deliberate test/story product-source exclusion described here.
6. Removed/renamed app-E2E specs remain fail-closed to full.
7. Registry validation remains blocking and covers every application-E2E spec.
8. `DatabaseViewsSheet.vue` retains all six confirmed product scenarios that operate through that surface.
9. `src/shared/lib/sortable/` does not select the unrelated `reorderSurface*.spec.ts` scenarios owned by canonical `@shared/lib/reorder`; it selects only the database sorting consumer scenario in `databaseViewsAndQueryFlows.spec.ts`.
10. Test/story-only files under mapped product source directories do not select application E2E merely through prefix matching.
11. Storybook behavior, visual, release, unit, mutation, Playwright project matrix, and CI topology are unchanged.
12. No second mapping registry, dependency graph, skip DSL, or generic planner abstraction is introduced.
13. The implementation PR uses the repository PATCH version policy for tooling-only changes.

## Required proof

Update `scripts/lib/e2eRisk.test.ts` with table-driven coverage for:

- `src/app/playgroundPages.ts` and representative `src/shared/lib/playground/` source → focused `appSmoke.spec.ts`;
- `DatabaseViewsSheet.vue` → exactly `databaseViewsAndQueryFlows.spec.ts` plus the five current `reorderSurface*.spec.ts` files;
- representative `src/shared/lib/sortable/` source → exactly `databaseViewsAndQueryFlows.spec.ts` and no reorder-surface specs;
- representative `src/shared/ui/Query/` source → exactly `databaseViewsAndQueryFlows.spec.ts`;
- mapped test/spec/story paths under a newly mapped directory → no app-E2E selection;
- at least one mapped test-only path under an existing scenario prefix → no app-E2E selection, proving the exclusion belongs at the mapping seam rather than only in the new entries;
- unknown relevant app/shared TypeScript/Vue source remaining full;
- unknown relevant non-TS/Vue source remaining full where current broad-domain behavior protects it;
- mapped + mapped changes unioning focused specs;
- mapped + unknown relevant changes resolving full;
- existing direct app-E2E spec selection;
- removed/renamed app-E2E spec full fallback;
- Storybook/visual/release exclusions remaining unchanged;
- scenario registry validation remaining valid.

Keep the proof at the resolver/unit level unless a changed contract genuinely requires browser execution. The coding agent should use verifier-managed focused format, Oxlint, ESLint, type-check, and unit checks. A representative verifier-managed E2E invocation may be used when useful to prove command wiring, but broad local browser execution is not required merely to hand the implementation back for exact-head CI.

Because `scripts/lib/e2eRisk.ts` is itself application-E2E infrastructure, exact-head PR CI is expected to run the complete application-E2E lane for this PR. That is the final repository execution gate; it is not evidence of the future focused savings.

## Deferred

### V2B — visual planner precision

Audit visual relevance, deterministic owner moves, docs/instructions/type-only paths, and remaining broad visual fallbacks separately. Do not combine with V2A.

### V3 — CI execution performance

After V2A/V2B planner precision is stable, measure CI wall-clock and separately evaluate isolated desktop/mobile E2E jobs and, only if still justified, Storybook artifact reuse.

## Forbidden

- Do not turn unknown relevant source into `skip`.
- Do not use a broad “no E2E impact” allowlist for shared runtime code.
- Do not add speculative mappings based only on directory proximity.
- Do not map an entire widget/shared directory when only one file/submodule has confirmed scenario ownership.
- Do not classify unit/browser/story proof files as product-source E2E impact merely because they live under a mapped source prefix.
- Do not change or weaken application-E2E assertions to make focused selection pass.
- Do not change retries, flaky handling, workers, projects, sharding, browser matrix, or CI topology.
- Do not move application-E2E specs.
- Do not touch visual planner behavior in this PR.
- Do not introduce generic impact infrastructure or a second registry.
