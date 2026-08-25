# DatabaseViewWidget ownership cleanup — implementation preflight

Authoring source

- Ready architecture handoff: `docs/database-view-widget-ownership-cleanup-handoff.md`.
- Active findings: `src/widgets/DocumentView/Database/REVIEW.md`.
- Applicable workflow: `vue-component-implementation` + repository verification/testing policy.

Goal / non-goals

- Behavior-preserving ownership cleanup of the Database screen composition.
- Do not redesign product behavior, persistence, inline edit, shared virtualization, TanStack, query logic, or performance scope.

Confirmed current behavior

- `DatabaseViewWidget` and its children duplicate screen-level databaseProperty/databaseView reads.
- Widget-owned top-level geometry is correct, but measurement lifecycle code is embedded directly in `DatabaseViewWidget.vue`.

Owners / entry points

- Widget owner: `src/widgets/DocumentView/Database`.
- Entity APIs remain unchanged.
- Existing feature `useDatabaseInlineEditSession` remains unchanged.

Source of truth / state shape

- One property-collection read and one view-selection read in `DatabaseViewWidget`.
- Children receive narrow props; mutations/requests travel upward through typed emits where parent arbitration is required.
- Geometry remains derived-only offsets from the same root/layout refs.

Minimum implementation design

- `DatabaseViewWidget.vue`
  - retain the existing `useDatabaseProperties` and `useDatabaseViewSelection` instances as the single screen reads;
  - pass `propertiesIdList` to `DatabaseViewLayout`;
  - pass `hasProperties` and `effectiveViewId` to both `DatabaseToolbar` instances;
  - handle one typed toolbar property-update event through the existing `onUpdateProperty` path;
  - consume `useDatabaseViewSurfaceGeometry(...)` instead of owning bounding/lifecycle code inline;
  - remove dead scoped selectors `database-view__controls`, `database-view__table`, and `.sheet`.
- `DatabaseViewLayout.vue`
  - remove `useDatabaseProperties`;
  - accept the parent-owned property ID list and forward it to `DatabaseDataTable`;
  - preserve existing table/slot/action behavior.
- `DatabaseToolbar.vue`
  - remove `useDatabaseProperties` and `useDatabaseViewSelection`;
  - consume parent-provided `hasProperties` and `effectiveViewId` while retaining the controlled `explicitViewId` model;
  - bind the views sheet directly to that controlled model;
  - forward property updates from its value-field surface upward through a typed emit, not a callback prop;
  - preserve add-item local visibility and configuration request/close intents.
- `useDatabaseViewSurfaceGeometry.ts`
  - widget-local composable containing the current two `useElementBounding` instances, current mount/update refresh behavior, and current vertical/horizontal formulas;
  - return only the two reactive offsets needed by the widget;
  - no extra observer/cache/state/protocol.

Simpler alternative considered

- Leaving duplicate reads or keeping lifecycle code inline is smaller diff but fails the active ownership/Vue rules.
- New entity write API is broader and unnecessary; reject it.

Expected changed files

- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`
- `src/widgets/DocumentView/Database/DatabaseViewLayout.vue`
- `src/widgets/DocumentView/Database/DatabaseToolbar.vue`
- `src/widgets/DocumentView/Database/DatabaseToolbar.test.ts`
- new `src/widgets/DocumentView/Database/useDatabaseViewSurfaceGeometry.ts`
- `scripts/lib/e2eRisk.ts`
- `scripts/lib/e2eRisk.test.ts`

Implementation passes

1. Consolidate widget read ownership and child contracts; update toolbar component-contract test.
2. Extract geometry mechanics without changing semantics; remove dead scoped CSS.
3. Add the new geometry source path to the existing `database virtualized table product behavior` E2E mapping and extend the existing resolver test for its exact focused spec set.
4. Focused verification, then cumulative branch gate.

Required removal

- Child `useDatabaseProperties` calls in `DatabaseViewLayout` and `DatabaseToolbar`.
- Child `useDatabaseViewSelection` call in `DatabaseToolbar`.
- Inline `useElementBounding`/lifecycle/formula block in `DatabaseViewWidget` after composable extraction.
- Dead scoped selectors listed above.
- Obsolete imports/types caused by those removals.

TEST IMPACT

- Contract/scenario: controlled Database toolbar state and property-update wiring.
  - Primary proof owner: `src/widgets/DocumentView/Database/DatabaseToolbar.test.ts`.
  - Additional proof: existing application E2E for complete configuration/item behavior.
  - Existing proof: current toolbar component tests and `tests/e2e/databaseVirtualizationFlows.spec.ts` configuration-resolution scenario.
  - New/updated proof: update existing toolbar tests only; no duplicate test suite.
  - Risk or platform matrix: deterministic component contract + existing desktop/mobile application E2E applicability.
  - Durable ownership/impact updates: none for the test itself.
- Contract/scenario: top-level widget root-to-surface geometry remains correct after extraction.
  - Primary proof owner: `tests/e2e/databaseVirtualizationFlows.spec.ts` moving-surface product scenario.
  - Additional proof: existing shared virtualization browser capability remains unchanged.
  - Existing proof: accepted moving-surface deep-range scenario.
  - New/updated proof: no new geometry test; behavior is unchanged.
  - Risk or platform matrix: real browser layout/scrolling, desktop Chromium + Mobile Chrome as already applicable.
  - Durable ownership/impact updates: add `useDatabaseViewSurfaceGeometry.ts` to the existing Database virtualized-table E2E source mapping and resolver test; expected focused specs are `databaseItemFlows.spec.ts` and `databaseVirtualizationFlows.spec.ts`.

Focused verification

- Use the smallest useful unit-tests invocation covering `DatabaseToolbar.vue`, `DatabaseToolbar.test.ts`, `scripts/lib/e2eRisk.ts`, and `scripts/lib/e2eRisk.test.ts`.
- Run type-check if required by the changed Vue/TS contracts.
- Run focused E2E through verifier-managed `pnpm verify --only e2e --files` for the changed Database widget/geometry production sources after mapping is in place.

Final verification

- `pnpm verify --base origin/develop`.
- Retry/flaky classification is failure.

Stop conditions

- If removing child reads requires a new cross-layer/entity API, stop and report instead of inventing it.
- If geometry extraction requires changing formulas, refresh timing, observers, or virtualization semantics, stop and report.
- If branch verification exposes a failure outside this accepted owner/scope, stop and report.
