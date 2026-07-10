# Reorder surface

A Vue-reactive reorder primitive for a single bounded vertical list. Reorder is a
reactive list-ordering interaction, not a drag layer: the sortable layer only recognizes
gestures and computes a target index, and the actual reordering happens by changing the
list's order and letting Vue re-render it. There is no lifted overlay, no `cloneNode`
clone, no ghost/placeholder row, and no native browser drag-and-drop.

This module is a `shared/lib` interaction primitive, not a Material List feature:
`MDListItem` and the rest of `shared/ui/Lists` have no reorder knowledge, and reorder
behavior must be composed by the consumer (usually a feature) around the shared list
UI, never inside it. The module does not know anything about database views, sorting
rules, or any other business data.

See `REACTIVE_REORDER_HANDOFF.md` for the full architecture contract.

## Public API

Import through `index.ts`.

```ts
import { useReorderSurface, vReorderItem, vReorderIgnore } from '@shared/lib/sortable';

const { displayItemIdList, draggedId, isDragging, cancel } = useReorderSurface(containerRef, {
  itemIdList, // authoritative ordered ids from the owning entity
  onCommit: ({ orderedIds }) => reorder(orderedIds), // persist through the entity API
  disabled, // optional
});
```

```vue
<MDList ref="containerRef">
  <MDListItem
    v-for="id in displayItemIdList"
    :key="id"
    v-reorder-item="id"
    :dragged="draggedId === id"
  >
    <template #trailingAction>
      <span v-reorder-ignore>…controls that must stay plainly clickable…</span>
    </template>
  </MDListItem>
</MDList>
```

That is the whole production contract. There are no options for activation modes,
interactive strategies, layout hints, scroll containers, animation engines, or render
callbacks — input behavior and container-local auto-scroll are internal policy:

- **Mouse**: press and move; reorder starts after a small movement threshold
  (4&nbsp;px), with no hold delay. A press without movement stays a plain click.
- **Touch / pen**: reorder starts after a long press (180&nbsp;ms). Movement beyond a
  small slop before the long press means scrolling, and the press is abandoned.
- **Ignore zones**: a press inside a `v-reorder-ignore` subtree never starts reorder,
  so trailing actions (menus, delete buttons) stay ordinary controls.

`v-reorder-item` may sit on a plain element or on a component root. Component-root
usage relies on the component keeping a single `HTMLElement` root; a dev warning fires
otherwise. `MDListItem` itself is reorder-agnostic — it only renders the `dragged` prop
it is given.

## How it works

`useReorderSurface` wires a pointer/touch session (`reorderSession.ts`) to optimistic
Vue state (`useReorderSurface.helpers.ts`):

1. A press on a `[data-sortable-id]` item arms a pending press (state machine:
   `idle` → `pendingPress`).
2. Activation gating: movement threshold for mouse, long-press timer for touch/pen. On
   activation the session measures item rects, validates that the DOM order matches the
   caller's `displayItemIdList` (failing closed on any mismatch), and records a drag
   anchor (`pointerY` minus the dragged row's top at activation) — state becomes
   `dragging`.
3. On every move the session computes the dragged item's intended center from the
   anchor and the current pointer position, clamped to the _visible_ interaction bounds
   (see below), and compares it against sibling rects with a hysteresis margin so the
   target index cannot bounce near a boundary.
4. When the target index changes, the session reports the new ordered ids;
   `useReorderSurface` writes them into `displayItemIdList`, and Vue re-renders the list
   in the new order. Rects are refreshed from the DOM afterward (`nextTick`) so further
   movement is evaluated against the current layout.
5. On release, `onCommit` receives the final ordered ids only if the order actually
   changed (state becomes `committing` until it settles). On cancel or commit failure,
   the optimistic order rolls back to the latest known external order.

The active row never leaves the list and is never cloned — it is the same Vue-rendered
row throughout, and its `dragged` visual state is controlled entirely by the consumer
through `draggedId === id`.

### Animation

Because Vue actually reorders the list, `reorderAnimation.ts` applies a small internal
FLIP (First/Last/Invert/Play) transform: it inverts each moved row's travel with an
inline `transform` right after the reactive reorder, then lets the CSS
`transition: transform` already scoped to an active reorder surface (`reorderSurface.css`)
animate it back to identity. This respects `prefers-reduced-motion` and never leaves a
stale inline transform behind.

### Scroll and bounds

Auto-scroll (`reorderAutoScroll.ts`) is container-local only: it scrolls the reorder
surface container itself, never the document, a page, a pane, or a sheet, and there is
no public option to point it at a different element. Edge zones and drag-intent
clamping both use the container's _visible interaction bounds_
(`reorderBounds.ts`) — the intersection of the container's rect with the viewport and
every clipping ancestor — so a container taller than the viewport or clipped by a
parent (a bottom sheet, a scrollable pane) never treats an offscreen edge as active.
Auto-scroll runs through `requestAnimationFrame` with a bounded speed curve and stops
once the container cannot scroll further in that direction.

### Suppression behaviors

- Text selection is suppressed document-wide from the moment a press is armed, and
  cleared if the browser creates one anyway (`useReorderSurface.helpers.ts`).
- The synthetic click browsers fire right after a completed reorder is swallowed, so a
  drop never also activates the row it landed on (`reorderPostDragClick.ts`).
- `dragstart` is prevented on reorder items, so no native browser drag (and no browser
  drag image) can ever start from a row.
- Listeners, timers, pointer capture, auto-scroll, and suppression are all released on
  end, cancel (`Escape`, `pointercancel`, window blur), disable, unmount, and external
  order changes during a pending or active session.

## Module map

| Module                         | Responsibility                                                           |
| ------------------------------ | ------------------------------------------------------------------------ |
| `useReorderSurface.ts`         | public composable: session wiring, optimistic order, commit/rollback     |
| `reorderSession.ts`            | pointer/touch session, activation gating, target-index tracking          |
| `reorderGeometry.ts`           | pure rect math: drag anchor, hysteresis target index, list move          |
| `reorderBounds.ts`             | visible interaction bounds (viewport + clipping ancestors)               |
| `reorderAutoScroll.ts`         | container-local edge auto-scroll                                         |
| `reorderAnimation.ts`          | FLIP transform for reactive reorder moves                                |
| `reorderInput.ts`              | input normalization and gating constants                                 |
| `reorderDirectives.ts`         | `v-reorder-item`, `v-reorder-ignore`                                     |
| `useReorderSurface.helpers.ts` | session state machine, optimistic commit/rollback, selection suppression |
| `reorderPostDragClick.ts`      | post-reorder click suppression rules                                     |

The supported production scenario is a single bounded vertical list. Cross-list drag,
grid/table/tree layouts, and keyboard reorder are explicitly out of scope for this
primitive — see `REACTIVE_REORDER_HANDOFF.md`.
