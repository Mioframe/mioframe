# Review

Verdict: blocked

## Scope reviewed

- Final PR #217 Database widget ownership-cleanup implementation.
- `DatabaseViewWidget.vue`, `DatabaseViewLayout.vue`, `DatabaseToolbar.vue`, `DatabaseRelationValueInline.vue`, and `useDatabaseViewSurfaceGeometry.ts`.
- Toolbar component-contract proof, Database E2E impact mapping, and preserved nested-relation/virtualization behavior.

## Blockers

None.

## Major issues

### M1 — toolbar property persistence Promise is detached at the widget boundary

Owner: `src/widgets/DocumentView/Database`

Problem: the cleanup correctly routes toolbar property updates upward, but `DatabaseViewWidget.onUpdateToolbarProperty(...)` is synchronous and calls the async `onUpdateProperty(...)` without returning or awaiting its Promise. `useDatabaseProperties.patch(...)` forwards the asynchronous service mutation directly, so this wrapper changes the previous awaited property-update path into detached fire-and-forget work.

Evidence:

- [DatabaseViewWidget.vue](./DatabaseViewWidget.vue) — `onUpdateProperty(...)` is async and awaits `putProperty(...)`, while `onUpdateToolbarProperty(...)` invokes it without `return`/`await`.
- [database property entity API](../../../entities/databaseProperty/useDatabaseProperties.ts) — `patch(...)` returns the underlying asynchronous service mutation.
- [ownership-cleanup handoff](../../../../docs/database-view-widget-ownership-cleanup-handoff.md) — the pass is behavior-preserving and requires the widget's existing property mutation path to service toolbar property-update intent.

Basis:

- [root repository rules](../../../../AGENTS.md) — preserve existing user scenarios unless the task explicitly changes them.
- [ownership-cleanup handoff](../../../../docs/database-view-widget-ownership-cleanup-handoff.md) — property persistence behavior is explicitly outside the redesign scope and must remain preserved.

Risk: if the property mutation rejects, the wrapper no longer propagates that Promise through the Vue event-handler boundary. Failure handling therefore differs from the pre-cleanup awaited toolbar mutation path and can surface as an untracked asynchronous rejection rather than the normal component/event error path.

Required final state: toolbar property-update forwarding must preserve the asynchronous mutation chain. The widget handler must return or await the existing `onUpdateProperty(...)` Promise; do not add another mutation API, local error recovery, notification path, retry, or state.

Verification: focused static/type/unit feedback for the touched widget/toolbar scope as useful, then rerun the required `pnpm verify --base origin/develop` branch gate. Existing successful Database E2E remains sufficient for the unchanged success-path product behavior; no new broad test abstraction is required for this one-line async forwarding correction.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Reworking the accepted `useDatabaseViewSurfaceGeometry` extraction or its `onMounted`/`onUpdated` timing.
- Moving relation-scoped property reads back into `DatabaseViewLayout`; `DatabaseRelationValueInline` is the correct composition owner for the different relation document consumed by its nested layout.
- New entity/shared APIs.
- Refactoring pre-existing item context actions, edit-dialog ownership, or inline-edit behavior.
- Shared virtualization/TanStack changes.

## Unresolved questions

None.
