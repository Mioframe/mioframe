# DatabaseViewWidget ownership cleanup — architecture handoff

Goal
- Simplify the PR #217 Database screen composition without changing user-visible behavior or virtualization semantics.

Confirmed current behavior / evidence
- `DatabaseViewWidget` owns the screen scroll root, inline-edit arbitration, configuration-surface arbitration, property collection read, and view-selection read.
- `DatabaseViewLayout` independently re-reads the property collection.
- `DatabaseToolbar` independently re-reads both property collection and view selection.
- PR #217 root-to-surface geometry is correct and browser-proved, but its `useElementBounding` + lifecycle machinery is inline in `DatabaseViewWidget.vue`.

Non-goals
- No redesign of inline editing, property persistence, item dialogs, query/filter/sort behavior, TanStack, shared virtualization, or residual Chromium jank.
- No new generic/shared geometry abstraction.
- No new entity mutation API solely for this cleanup.

Affected scenarios
- Empty Database vs table rendering.
- View selection and configuration sheets while an inline edit may be active.
- Property edits emitted from toolbar-owned add/configuration surfaces.
- Top-level Database moving-surface virtualization when preceding content changes.

Boundaries
- Change only the Database widget composition needed to remove duplicate read ownership and isolate DOM measurement lifecycle, plus the exact E2E impact metadata for the new local geometry source.
- Preserve all existing public product behavior, E2E expected values, retry/timeout policy, and geometry formulas/refresh timing.

Ownership matrix
- feature: `databaseInlineValueEdit` remains the sole inline-edit session/persistence-arbitration owner.
- entity: existing databaseProperty/databaseView APIs remain unchanged.
- widget: `DatabaseViewWidget` owns the single screen read of property collection + view selection and owns root-to-surface geometry; children receive narrow controlled state.
- page/pane: unchanged.
- shared: unchanged.
- service/worker: unchanged.

Source of truth / state shape
- Property collection: one `useDatabaseProperties(path, documentId)` instance in `DatabaseViewWidget`.
- View selection: one `useDatabaseViewSelection(path, documentId, stateExplicitViewId)` instance in `DatabaseViewWidget`.
- Configuration surface and inline-edit state remain as currently accepted.
- Geometry remains two derived offsets from the existing root/layout refs; no persisted or parallel geometry state.

Public API / entry points
- No cross-layer public API changes.
- Widget-local child contracts change only as needed: `DatabaseViewLayout` receives property IDs; `DatabaseToolbar` receives `hasProperties`/effective view state and emits property-update intent upward while retaining its controlled explicit-view model and configuration intents.
- Add one widget-local `useDatabaseViewSurfaceGeometry` composable.

Minimum sufficient design
- Remove `useDatabaseProperties` from `DatabaseViewLayout` and `DatabaseToolbar`.
- Remove `useDatabaseViewSelection` from `DatabaseToolbar`; bind its controlled explicit-view model directly to the views sheet and consume parent-provided effective view state.
- Let the existing widget-owned property patch handler service toolbar property-update intent.
- Move the current bounding/lifecycle/formula code unchanged into the local geometry composable.
- Remove confirmed dead scoped selectors in `DatabaseViewWidget.vue`.

Rejected approaches
- New databaseProperty write service/composable only to avoid an emit: unnecessary abstraction.
- Moving geometry to entity/shared/table: wrong owner.
- Changing geometry invalidation timing/formulas during cleanup: unnecessary behavior risk.
- Broadly splitting every widget concern into separate composables: no requirement.

Shared UI blast radius
- None.

Acceptance matrix
- Exactly one property-collection read and one view-selection read exist in this Database widget subtree for the screen-level facts above.
- Toolbar still exposes the same actions/sheets and view-selection outcome.
- Inline edit still resolves before view/configuration changes.
- Empty/content branches remain behaviorally unchanged.
- Property updates from toolbar-owned value fields still persist through the existing widget/entity path.
- Moving-surface geometry produces the same offsets and passes the existing deep browser/product proof.
- No dead `database-view__controls`, `database-view__table`, or `.sheet` scoped CSS remains.

Risk matrix
- Controlled child wiring: component-contract test.
- Geometry extraction: existing real-browser moving-surface application E2E.
- Source-impact ownership for new geometry file: existing explicit E2E registry + resolver unit test.
- No new performance claim or metric.

Required test proof
- Update `DatabaseToolbar.test.ts` for parent-provided state and upward property-update intent.
- Existing `databaseItemFlows.spec.ts` + `databaseVirtualizationFlows.spec.ts` remain the product proof selected for widget/geometry changes.
- Extend `scripts/lib/e2eRisk.test.ts` so the new geometry source resolves to the same focused Database item + virtualization specs.

Required verification
- Focused unit/component feedback for toolbar + E2E resolver.
- Focused verifier-managed application E2E for the affected Database widget sources.
- Final coding-agent gate: `pnpm verify --base origin/develop`.

Forbidden
- Shared virtualization/TanStack changes; `virtualizer.measure()`; cache reset; new geometry state/cache/observer; new timeouts/retries/sleeps; product behavior changes; new entity/shared abstraction; architect-owned doc/review edits; manual version change.

Implementation readiness
- Required decisions resolved: yes.
- Dependencies/inputs/worker boundaries explicit: yes.
- Unresolved blockers: none.
- Verdict: ready.
