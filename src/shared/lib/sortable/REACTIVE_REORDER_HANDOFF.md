# Reactive reorder architecture handoff

This document is the implementation contract for the PR 138 sortable/reorder rewrite.

The target is not a generic drag-and-drop system. The target is a bounded, vertical, Vue-reactive list ordering interaction for Mioframe production lists.

## Goal

Implement a simple Vue-first reorder primitive in `shared/lib/sortable`:

- Full-row reorder for list rows.
- Touch/pen activation through long press.
- Mouse activation through press plus a small movement threshold.
- Reorder changes the optimistic `displayItemIdList` reactively.
- Vue renders the new order and owns row rendering.
- The shared sortable layer owns gesture recognition, target-index calculation, optimistic order, cancellation, click/selection suppression, and container-local auto-scroll.
- Features persist the final order through their existing entity APIs.

## Non-goals

Do not implement:

- A generic drag-and-drop framework.
- Native browser drag-and-drop.
- DOM snapshots or `cloneNode` overlays.
- Vue Teleport overlays for lifted rows.
- SortableJS fallback clones.
- Manual DOM reparenting to `document.body`.
- Public reorder wrapper components such as `<ReorderSurface>` or `<ReorderItem>`.
- Cross-list drag.
- Grid, table, tree, or wrapped-layout support.
- Feature-specific persistence or business behavior inside `shared/lib/sortable`.
- Keyboard reorder in this PR. Escape-to-cancel remains required for active pointer/touch sessions.

## Architecture decision

Reorder is a reactive ordering interaction, not a drag-layer.

The reorder flow is:

1. A consumer marks row roots with `v-reorder-item="id"`.
2. A consumer marks controls or control subtrees with `v-reorder-ignore`.
3. `useReorderSurface` tracks one pointer/touch session inside the surface container.
4. On activation, the sortable layer records the dragged id, starting order, row rects, pointer anchor, and input mode.
5. During drag, the sortable layer computes target index from geometry.
6. When target index changes, the sortable layer updates `displayItemIdList`.
7. Vue rerenders the list in the optimistic order.
8. CSS or an internal FLIP helper may animate movement with transforms.
9. On release, `onCommit` receives the final ordered ids.
10. On cancel or commit failure, the optimistic order rolls back.

The sortable layer must not create a lifted visual overlay. The active row remains a normal Vue-rendered row in the list and receives a dragged visual state through `draggedId`.

## Ownership matrix

| Layer                 | Ownership                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/lib/sortable` | Gesture recognition, activation gating, target-index calculation, optimistic display order, cancellation, rollback, click suppression, selection suppression, container-local auto-scroll, reorder directives, low-level tests. |
| `shared/ui/Lists`     | Material list visuals only. It must not know about reorder, sortable sessions, persistence, or feature-specific behavior.                                                                                                       |
| Feature               | Row scenarios, `v-reorder-item`, `v-reorder-ignore`, id validation, and calling the correct entity reorder API.                                                                                                                 |
| Entity                | Domain order state and persistence operations.                                                                                                                                                                                  |
| Widget/page           | Composition only. No reorder state, persistence, or business rules.                                                                                                                                                             |
| Service/worker        | Unchanged for this PR.                                                                                                                                                                                                          |

## Public API

Keep the consumer API narrow:

```ts
const { displayItemIdList, draggedId, isDragging, cancel } = useReorderSurface(containerRef, {
  itemIdList,
  disabled,
  onCommit,
});
```

The public directives are:

```vue
v-reorder-item="id" v-reorder-ignore
```

Production consumers should look like this shape:

```vue
<MDList ref="listRef">
  <DatabaseSortingListItem
    v-for="id in displayItemIdList"
    :key="id"
    v-reorder-item="id"
    :property-id="id"
    :dragged="draggedId === id"
  />
</MDList>
```

Do not add public options for activation modes, interactive strategies, layout hints, scroll containers, animation engines, or engine tuning. Input behavior and container-local scroll behavior are internal policy.

## State model

Use an explicit state machine rather than unrelated flags:

```ts
type ReorderPhase = 'idle' | 'pendingPress' | 'dragging' | 'committing';

type ReorderSession = {
  draggedId: string;
  startOrderedIds: string[];
  currentOrderedIds: string[];
  fromIndex: number;
  targetIndex: number;
  input: 'pointer' | 'touch';
  pointerId: number;
  pointerAnchorY: number;
};
```

State rules:

- `itemIdList` from the caller is the source of truth while idle.
- `displayItemIdList` is the optimistic render order.
- DOM order is never the source of truth.
- Shared sortable never mutates entity state directly.
- `onCommit` is called only after release and only when order actually changed.
- If `onCommit` fails, rollback to the start order.
- If `disabled` becomes true, cancel pending or active sessions and clean up.
- Empty or single-item surfaces do not activate reorder.

## External update policy

Use deterministic cancellation instead of merge logic:

- In `idle`, external `itemIdList` updates sync `displayItemIdList`.
- In `pendingPress`, external `itemIdList` updates cancel pending state and sync.
- In `dragging`, external `itemIdList` updates cancel the drag and sync.
- In `committing`, external `itemIdList` remains the source of truth after the commit settles. Do not try to merge the active optimistic order with external changes.

## Input behavior

### Mouse

- Left button only.
- A press without meaningful movement stays a click.
- Reorder starts after a small movement threshold.
- Text selection must be suppressed during pending/active reorder where needed.
- Native browser dragstart must be prevented for reorder items.
- The synthetic click after a completed drag must be swallowed once inside the surface.

### Touch and pen

- Tap remains tap and must trigger the row action normally.
- Reorder starts only after long press.
- Movement beyond touch slop before long press is treated as scroll intent and cancels pending reorder.
- After activation, native scrolling must not compete with active reorder.
- Best-effort short haptic feedback is allowed on activation when supported.
- Multi-touch must ignore pointers other than the original active pointer.

### Cancellation

Cancel on:

- Escape.
- `pointercancel`.
- lost pointer capture when applicable.
- window blur.
- component unmount.
- `disabled` becoming true.
- external order changes during pending or active drag.

All cancellation paths must release timers, listeners, selection suppression, click suppression state when appropriate, animation state, and auto-scroll loops.

## Target-index calculation

The sortable layer should calculate target index from vertical list geometry.

Required rules:

- Capture row rects on activation.
- Store a pointer anchor, for example `pointerAnchorY = pointerY - draggedRowRect.top`.
- Compute intent from the anchored dragged row position, not from raw pointer Y alone.
- Clamp drag intent to the visible interaction bounds.
- Use hysteresis so target index does not bounce when the pointer is near a boundary.
- Do not update `displayItemIdList` when target index did not change.
- After a reactive reorder, wait for Vue to render and refresh rect cache on `nextTick`.
- Refresh or compensate rects after container-local auto-scroll steps.
- If DOM/id geometry is inconsistent, cancel without commit.

## Scroll and bounds

Auto-scroll is required, but only inside the reorder container.

There are two different boundaries:

| Boundary                   | Meaning                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Logical reorder bounds     | The full reorder container and its item range. Items cannot move outside this order.                                  |
| Visible interaction bounds | The visible intersection of the container with the viewport and clipping ancestors. Edge zones use this visible area. |

Rules:

- Do not scroll the document, page, pane, sheet, or parent ancestors.
- Do not expose `scrollContainer` as a public option.
- If the container itself is not scrollable, auto-scroll does nothing.
- If the container is taller than the viewport or clipped by a parent, edge zones are based on the visible clipped area, not the full container rect.
- Pointer intent is clamped to the visible interaction bounds.
- Target index remains within the logical item range of the container.
- Auto-scroll must run with `requestAnimationFrame`, not `setInterval`.
- Scroll speed should use a bounded curve based on distance into the edge zone.
- Stop auto-scroll when the container cannot scroll further in that direction.

## Animation policy

Vue owns rendering. The sortable layer may provide only a small internal animation helper.

Acceptable approaches:

- CSS move transitions on list items.
- A small internal FLIP helper that measures before/after rects and temporarily applies transform-based movement.

Rules:

- Use transform-based animation, not height/layout animation.
- Respect `prefers-reduced-motion`.
- Do not keep stale inline transforms after animation ends.
- Do not write inline styles to every row on every pointermove.
- Do not turn animation into an overlay, ghost, or DOM reparenting system.

## Visual contract

- The active row remains the same Vue-rendered row in the list.
- Consumers pass `draggedId === id` into their row or `MDListItem.dragged`.
- `shared/ui/Lists` remains reorder-agnostic.
- No visible clone, ghost, browser drag image, or body overlay.
- Trailing controls marked with `v-reorder-ignore` remain ordinary controls.
- If Material shadow clipping appears in a specific list variant, treat it as a separate visual issue, not as a reason to reintroduce overlay architecture.

## Accessibility minimum

Keyboard reorder is not part of this PR, so do not add ARIA drag-and-drop semantics that imply keyboard support.

Required behavior:

- Escape cancels active reorder.
- Ignored controls remain focusable and clickable.
- Focus should not be lost after cancel/drop.
- No duplicate accessible content is created.
- Existing list/item roles must not be broken.

## Consistency checks

On activation, validate the surface model:

- Every reorder item has a stable non-empty id.
- Ids are unique.
- DOM reorder ids correspond to the current `displayItemIdList`.
- Ignored controls are not treated as reorder items.
- Unknown extra reorder items cause cancellation rather than repair.

Shared sortable should fail closed by cancelling the session. It should not guess feature intent.

## Acceptance matrix

| Scenario                                  | Expected behavior                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Desktop row click                         | Row action fires; reorder does not start.                                                      |
| Desktop press plus threshold movement     | Reorder starts.                                                                                |
| Desktop release after movement            | `onCommit` receives final ordered ids if order changed.                                        |
| Desktop drag ending at original position  | No commit.                                                                                     |
| Post-drag synthetic click                 | Suppressed once inside the surface.                                                            |
| Touch tap                                 | Row action fires; reorder does not start.                                                      |
| Touch vertical movement before long press | Treated as scroll intent; pending reorder is cancelled.                                        |
| Touch long press                          | Reorder starts and row enters dragged visual state.                                            |
| Drag crosses another row                  | `displayItemIdList` updates reactively.                                                        |
| Drag hovers near boundary                 | Hysteresis prevents index bouncing.                                                            |
| Drag near visible top/bottom edge         | The reorder container auto-scrolls if it can scroll.                                           |
| Container taller than viewport            | Edge zones use visible bounds, not offscreen container edges.                                  |
| Container clipped by parent               | Edge zones use clipped visible bounds.                                                         |
| Parent/page is scrollable                 | Parent/page does not scroll because of active reorder.                                         |
| Escape or pointercancel                   | Reorder cancels and optimistic order rolls back.                                               |
| Commit failure                            | Optimistic order rolls back.                                                                   |
| External order update during drag         | Drag cancels and syncs to external order.                                                      |
| Trailing action press                     | Reorder does not start; control remains usable.                                                |
| Component-root directive                  | `v-reorder-item` works only when the component resolves to a stable single `HTMLElement` root. |

## Required verification

Focused unit tests:

- state machine transitions;
- mouse threshold;
- touch long press;
- touch slop cancellation;
- pointer id ownership;
- target-index calculation;
- drag anchor calculation;
- hysteresis;
- optimistic order updates;
- no-op reorder no commit;
- cancel rollback;
- commit failure rollback;
- external update cancellation;
- model consistency validation;
- visible interaction bounds;
- container-local auto-scroll speed/stop behavior;
- post-drag click suppression;
- selection suppression cleanup.

Component tests:

- `DatabaseViewListEdit` uses the simple reorder contract.
- `DatabaseItemSortingListSection` uses the simple reorder contract.
- Production consumers do not pass activation/layout/scroll tuning options.
- Trailing actions are under `v-reorder-ignore`.
- `v-reorder-item` lands on a stable rendered row root.

Browser/e2e tests:

- desktop full-row reorder for database views;
- desktop full-row reorder for sorting rows;
- desktop click remains click;
- touch/mobile tap remains tap;
- touch/mobile no reorder before long press;
- touch/mobile long-press reorder smoke;
- trailing action click does not reorder;
- post-drag click suppression;
- container-local auto-scroll near visible edge.

Visual checks:

- dragged Material state remains correct;
- no overlay, clone, ghost, or browser drag image appears;
- list row movement is stable and not jumpy;
- reduced-motion behavior is acceptable.

Final verification must still follow repository verification policy. Green verification is not architecture approval; review the implementation against this handoff.

## Forbidden

- Do not use `cloneNode`.
- Do not use SortableJS fallback clones.
- Do not use native browser drag-and-drop.
- Do not introduce public reorder wrapper components.
- Do not introduce public render callbacks for row rendering.
- Do not use Vue private vnode/component internals.
- Do not manually reparent live row DOM nodes to `body`.
- Do not create an overlay, ghost row, or cursor-following clone.
- Do not move reorder behavior into `MDListItem` or `shared/ui/Lists`.
- Do not add `scrollContainer` as public API.
- Do not scroll document, page, pane, sheet, or parent ancestors.
- Do not use raw `container.getBoundingClientRect()` as the only auto-scroll boundary.
- Do not assume the whole container is visible.
- Do not allow offscreen container edges to define active edge zones.
- Do not reorder DOM manually.
- Do not commit on every target-index change.
- Do not update Vue state on every pointermove when target index did not change.
- Do not merge external updates into an active drag.
- Do not keep stale rects after reactive reorder or container scroll.
- Do not add keyboard ARIA drag-and-drop semantics without real keyboard reorder support.
- Do not put feature persistence or business logic into `shared/lib/sortable`.
- Do not treat `pnpm verify` as architecture approval.
