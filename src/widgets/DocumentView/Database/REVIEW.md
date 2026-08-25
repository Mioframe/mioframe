# Review

Verdict: blocked

## Scope reviewed

- `DatabaseViewWidget.vue` as the Database screen-composition owner after PR #217 virtualization changes.
- Direct child contracts in `DatabaseViewLayout.vue` and `DatabaseToolbar.vue`.
- Existing inline-edit feature ownership and top-level virtualization surface-offset contract.

## Blockers

None.

## Major issues

### M1 — Database widget subtree duplicates entity read ownership

Owner: `src/widgets/DocumentView/Database`

Problem: `DatabaseViewWidget` already owns `useDatabaseProperties(...)` and `useDatabaseViewSelection(...)`, while `DatabaseViewLayout` re-reads the Database property collection and `DatabaseToolbar` re-reads both the property collection and view selection. The current widget subtree therefore has more than one read-model owner for the same screen facts.

Evidence:

- [DatabaseViewWidget.vue](./DatabaseViewWidget.vue) — owns `useDatabaseProperties(...)` and `useDatabaseViewSelection(...)`.
- [DatabaseViewLayout.vue](./DatabaseViewLayout.vue) — independently calls `useDatabaseProperties(...)`.
- [DatabaseToolbar.vue](./DatabaseToolbar.vue) — independently calls `useDatabaseProperties(...)` and `useDatabaseViewSelection(...)`.

Basis:

- [widget rules](../../AGENTS.md) — keep one source for each read model inside a widget and pass owned state down instead of duplicating the same observable/entity read.
- [Database widget rules](./AGENTS.md) — this directory is composition, not a domain layer; use explicit props/emits and route mutations through entity/feature APIs.

Risk: duplicate subscriptions and repeated derivation obscure the actual source of truth, make controlled view/configuration behavior harder to reason about, and add unnecessary reactive work in a performance-sensitive screen.

Required final state: `DatabaseViewWidget` is the single owner of the Database property-collection and view-selection read models for this screen. `DatabaseViewLayout` and `DatabaseToolbar` receive only the narrow state they render. Property-update intent from toolbar-owned child surfaces flows upward through a typed emit to the widget's existing entity mutation path. Do not add a new entity/shared abstraction solely for this cleanup.

Verification: update `DatabaseToolbar` component-contract tests for the controlled props/emits, then run the existing Database application E2E scenarios that protect item/configuration and virtualization behavior.

### M2 — DOM measurement lifecycle is embedded in the screen component body

Owner: `src/widgets/DocumentView/Database`

Problem: PR #217 added two `useElementBounding(...)` instances plus `onMounted`/`onUpdated` refresh and root-to-surface formulas directly inside `DatabaseViewWidget.vue`. The geometry ownership is correct at widget level, but lifecycle-managed DOM mechanics are mixed into the composition component instead of being owned by a composable.

Evidence:

- [DatabaseViewWidget.vue](./DatabaseViewWidget.vue) — `databaseViewBounds`, `databaseViewLayoutBounds`, `updateDatabaseSurfaceBounds`, lifecycle hooks, and the two surface-offset computed values are inline in the screen component.
- [database virtualization architecture](../../../../docs/database-virtualization.md) — the widget remains the physical-root/root-to-surface geometry owner.

Basis:

- [Vue component implementation skill](../../../../.agents/skills/vue-component-implementation/SKILL.md) — lifecycle-managed side effects belong in composables that own setup and cleanup; template refs/direct DOM access are valid for real measurement needs.

Risk: product orchestration and low-level DOM lifecycle concerns are coupled in one component, making future changes harder to review and increasing the chance that geometry mechanics drift into unrelated screen state handling.

Required final state: keep exactly the same widget-owned root-to-surface geometry contract and formulas, but move the measurement/lifecycle machinery into one local `useDatabaseViewSurfaceGeometry` composable under this widget directory. Do not change geometry semantics, invalidation behavior, TanStack/shared virtualization, or add another geometry state/cache.

Verification: existing moving-surface Database E2E remains the primary real-browser proof; no happy-dom geometry test is required.

## Minor issues

- `DatabaseViewWidget.vue` still contains scoped selectors for `database-view__controls`, `database-view__table`, and `.sheet` that have no matching template nodes in the component. Remove them during the same local cleanup.

## Accepted risks

None.

## Items not required

- Refactoring pre-existing item context actions or edit-dialog ownership.
- New databaseProperty write APIs solely to avoid passing an upward mutation intent.
- Changing inline-edit feature ownership or persistence behavior.
- Changing the current `onMounted`/`onUpdated` geometry refresh semantics during this behavior-preserving cleanup.
- Shared virtualization or TanStack changes.

## Unresolved questions

None.
