# Review

Verdict: blocked

## Scope reviewed

- PR #217 production Database virtualization, root/surface ownership, relation nesting/teleport, inline-edit lifecycle, product proof, and profiling.

## Blockers

### B1 — Nested relation root is not physically owned by the Database widget

Owner: `src/widgets/DocumentView/Database`

Problem: `RelationValueInline` exports its outer DOM element as `scrollRoot`, but recursive preview content is teleported by `MDRichTooltip`; the nested Database table is therefore virtualized against an element that is not its physical scroll ancestor. The same change also leaks Database virtualization topology into entity UI.

Evidence:

- [`../../../entities/databaseRelation/RelationValueInline.vue`](../../../entities/databaseRelation/RelationValueInline.vue) — exports `scrollRoot` from `relationValueEl` through the slot.
- [`DatabaseRelationValueInline.vue`](DatabaseRelationValueInline.vue) — forwards that root to nested `DatabaseViewLayout`.
- [`../../../shared/ui/Tooltips/MDRichTooltip.vue`](../../../shared/ui/Tooltips/MDRichTooltip.vue) — teleports recursive tooltip content.

Basis:

- [`../../../../docs/database-virtualization-simplification-handoff.md`](../../../../docs/database-virtualization-simplification-handoff.md) — final relation-root ownership requires a widget-owned physical root that moves with teleported content.
- [`../../../entities/AGENTS.md`](../../../entities/AGENTS.md) — entity UI remains narrow/domain-display oriented rather than owning upper-layer composition infrastructure.

Risk: deep recursive relation ranges can use incorrect viewport geometry; ownership is difficult to reason about and the current show/hide proof does not cover virtualized recursive scrolling.

Required final state: remove the relation entity DOM-root contract and give each nested Database layout a widget-owned physical root that actually contains its table, including after teleport.

Verification: application E2E with a large recursive relation preview proving root containment, bounded mounted work, and deep row/property reach.

### B2 — User view/configuration changes can bypass unresolved inline-edit gating

Owner: `src/widgets/DocumentView/Database`

Problem: direct explicit view selection resolves the active edit, but view management can be opened while the edit is unresolved and current-view removal can then replace the effective view through `useDatabaseViewSelection` fallback without using that direct-selection handler. Similar configuration surfaces can alter row source/property shape.

Evidence:

- [`DatabaseViewWidget.vue`](DatabaseViewWidget.vue) — `onRequestExplicitViewId` is gated, while edit state machine is embedded locally.
- [`DatabaseToolbar.vue`](DatabaseToolbar.vue) — opens view/filter/sort/property configuration without a parent edit-resolution precondition.
- [`DatabaseViewsSheet.vue`](DatabaseViewsSheet.vue) — removes views directly.

Basis:

- [`../../../../docs/database-virtualization-simplification-handoff.md`](../../../../docs/database-virtualization-simplification-handoff.md) — source/shape-changing configuration requires one resolve-before-open gate and failed resolution must keep the draft recoverable.

Risk: an edited cell can disappear from the active source after a failed/unresolved commit, violating the no-silent-draft-loss contract.

Required final state: localize the widget-owned edit lifecycle and gate source/shape-changing configuration before it can mutate the table source; keep direct view-selection gating.

Verification: product E2E for successful configuration gating/current-view removal plus lowest-faithful deterministic failure proof preserving the draft.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No shared `useVirtualCollection` redesign; the existing API remains sufficient after ownership correction.

## Unresolved questions

None.
