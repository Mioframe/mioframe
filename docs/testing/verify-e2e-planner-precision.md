# Verify V2A — application E2E planner precision

Status: architecture ready for implementation.

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

`scripts/lib/e2eRisk.ts` already owns one explicit application-E2E scenario registry, `E2E_SCENARIO_SCOPES`, and validates that every centralized application-E2E spec is covered by that registry or an explicitly justified standalone entry.

Current resolution is fail closed, but `LOW_LEVEL_E2E_PREFIXES` conflates two different concepts:

1. a source domain is relevant to application E2E;
2. every change under that domain necessarily requires the complete application-E2E lane.

The current broad prefixes include all of `src/app/`, `src/shared/service/`, `src/shared/serviceClient/`, `src/shared/lib/`, and `src/shared/ui/`. A path under one of those prefixes becomes `full` before an explicit scenario mapping can help.

At the same time, unmapped `src/**/*.ts` and `src/**/*.vue` already fail closed to full application E2E. Therefore broad shared prefixes are not required to preserve fail-closed behavior for TypeScript/Vue source; they mainly prevent known lower-level ownership from becoming focused.

Confirmed examples:

- `src/app/playgroundPages.ts` is dev-only playground registration loaded by `setupApp()` only under `import.meta.env.DEV`; it currently selects full application E2E because all `src/app/` is low-level.
- `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` owns the view-settings surface exercised directly by `tests/e2e/databaseViewsAndQueryFlows.spec.ts`, but is currently unmapped and therefore selects full application E2E.
- `src/shared/lib/sortable/` is a legacy generic reorder primitive whose documented sole remaining production consumer is `src/features/databaseItemSorting/DatabaseItemSortingListSection.vue`; the existing database-views/query scenario already owns the corresponding reorder product scenarios.
- `src/shared/ui/Query/` has its production use in the database-filter/query flow (with a separate playground consumer), which is already owned by `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.

## Architecture decision

### 1. Keep one scenario mapping owner

`E2E_SCENARIO_SCOPES` remains the only explicit source-to-application-E2E mapping registry.

Do not add a second mapping table for shared code. Shared, widget, feature, entity, or app paths with stable scenario ownership belong in the same existing registry.

### 2. Separate relevance from mandatory full-lane impact

Replace the current conceptual use of `LOW_LEVEL_E2E_PREFIXES` with two distinct classifications:

- **full-lane infrastructure impact**: configuration/tooling/bootstrap infrastructure whose consumer set is intentionally the complete application-E2E lane;
- **application-E2E-relevant product/source domains**: source that must never be silently skipped, but may select focused scenarios when an explicit mapping exists.

A mapped path in a relevant source domain must be allowed to resolve to its mapped specs. An unmapped relevant path must still resolve to `full`.

Do not implement this by checking “mapping first, low-level second” against a prefix that still semantically means mandatory full-lane impact. Make the classification itself truthful.

### 3. Preserve fail-closed relevance for non-TypeScript runtime sources

The current broad prefixes also catch runtime files other than `.ts`/`.vue` (for example CSS/assets under app/shared runtime domains). V2A must not accidentally turn those into `skip` merely because broad full prefixes are narrowed.

The relevant-source classification must preserve current protection for runtime source under the affected app/shared domains. Known mapped runtime files may focus; unknown relevant runtime files must still fall back to full application E2E.

Stories and test-only files remain outside application-E2E product-source relevance as today. Storybook behavior, visual, and release paths remain independently owned.

### 4. Preserve canonical resolution order

Application E2E resolution remains consistent with `docs/testing/architecture.md`:

1. true full-lane infrastructure path → full;
2. directly changed existing app-E2E spec → focused spec;
3. removed/renamed app-E2E spec → full;
4. explicit source mapping → union of mapped specs;
5. unmapped relevant source → full;
6. path outside application-E2E relevance → no selection.

Registry validation remains blocking/fail-closed.

### 5. Add only confirmed V2A mappings

Add the smallest mappings justified by current repository evidence:

- `src/app/playgroundPages.ts` → `tests/e2e/appSmoke.spec.ts`;
- `src/shared/lib/playground/` → `tests/e2e/appSmoke.spec.ts` when changing playground bootstrap/runtime integration;
- `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts`;
- `src/shared/lib/sortable/` → the existing **database views and query flows** scenario and its existing reorder specs;
- `src/shared/ui/Query/` → `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.

Do not broaden these mappings to neighboring directories merely to reduce execution. A wider prefix is valid only if its complete production consumer/scenario set is confirmed from the repository.

### 6. Unknown shared code stays full

After separating relevance from mandatory full impact, an unmapped relevant path under `src/shared/ui/`, `src/shared/lib/`, `src/shared/service/`, or `src/shared/serviceClient/` must still select full application E2E.

For example, an unmapped shared UI primitive or `src/shared/lib/automerge/**` change must not become `skip` simply because the old broad prefix was removed or narrowed.

This is the central safety invariant of V2A.

## Expected plan changes

Representative expected results after V2A:

| Changed path                                               | Current                      | V2A target                                                     |
| ---------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| `src/app/playgroundPages.ts`                               | full                         | focused `appSmoke.spec.ts`                                     |
| `src/widgets/DocumentView/Database/DatabaseViewsSheet.vue` | full                         | focused `databaseViewsAndQueryFlows.spec.ts`                   |
| `src/shared/lib/sortable/useReorderSurface.ts`             | full                         | focused existing database views/query + reorder scenario specs |
| `src/shared/ui/Query/QueryRoot.vue`                        | full                         | focused `databaseViewsAndQueryFlows.spec.ts`                   |
| mapped feature/entity paths                                | focused                      | unchanged                                                      |
| `src/entities/googleSession/index.ts` (unmapped relevant)  | full                         | full                                                           |
| unmapped `src/shared/ui/**` runtime source                 | full                         | full                                                           |
| unmapped `src/shared/lib/**` runtime source                | full                         | full                                                           |
| true E2E infrastructure/config                             | full                         | full                                                           |
| Storybook/visual/release-only paths                        | independent/skip for app E2E | unchanged                                                      |

When several changed paths map to different scenarios, focused specs continue to union and deduplicate. Any simultaneous true-full or unknown-relevant hit still upgrades the plan to full.

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
5. Existing scenario mappings and direct-spec behavior remain unchanged.
6. Removed/renamed app-E2E specs remain fail-closed to full.
7. Registry validation remains blocking and covers every application-E2E spec.
8. Storybook behavior, visual, release, unit, mutation, Playwright project matrix, and CI topology are unchanged.
9. No second mapping registry, dependency graph, skip DSL, or generic planner abstraction is introduced.
10. The implementation PR uses the repository PATCH version policy for tooling-only changes.

## Required proof

Update `scripts/lib/e2eRisk.test.ts` with table-driven coverage for:

- every representative full → focused transition listed above;
- unknown relevant app/shared TypeScript/Vue source remaining full;
- unknown relevant non-TS/Vue runtime source remaining full where current broad-prefix behavior protected it;
- mapped + mapped changes unioning focused specs;
- mapped + unknown relevant changes resolving full;
- existing direct app-E2E spec selection;
- removed/renamed app-E2E spec full fallback;
- Storybook/visual/release/test-only exclusion remaining unchanged;
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
- Do not change or weaken application-E2E assertions to make focused selection pass.
- Do not change retries, flaky handling, workers, projects, sharding, browser matrix, or CI topology.
- Do not move application-E2E specs.
- Do not touch visual planner behavior in this PR.
- Do not introduce generic impact infrastructure or a second registry.
