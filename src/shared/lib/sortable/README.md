# Reorder surface

A geometry-based reorder engine for bounded collections. It implements the
native-feeling reorder interaction (Android/Windows style): the pointer changes an
item's position **inside** its collection. It is not browser drag-and-drop — there is
no native drag image, no ghost/placeholder row, and no free-floating clone following
the cursor.

This module is a `shared/lib` interaction primitive, not a Material List feature:
`MDListItem` and the rest of `shared/ui/Lists` have no reorder knowledge, and reorder
behavior must be composed by the consumer (usually a feature) around the shared list
UI, never inside it. The module does not know anything about database views, sorting
rules, or any other business data.

## Public API

Import through `index.ts`.

```ts
import { useReorderSurface, vReorderItem, vReorderIgnore } from '@shared/lib/sortable';

const { displayItemIdList, draggedId } = useReorderSurface(containerRef, {
  itemIdList, // authoritative ordered ids from the owning entity
  onCommit: ({ orderedIds }) => reorder(orderedIds), // persist through the entity API
  disabled, // optional
  scrollContainer, // optional scrollable ancestor for edge auto-scroll
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

That is the whole production contract. Consumers do not configure activation modes,
interactive strategies, or layout — input behavior is inferred internally:

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

The engine (`reorderEngine.ts`) owns one Pointer Events session per gesture:

1. `pointerdown` on a `[data-sortable-id]` item arms a pending press
   (`setPointerCapture` is acquired once the session activates).
2. Activation gating: movement threshold for mouse, long-press timer for touch/pen.
3. At activation it measures the item rects once (`reorderGeometry.ts`), detects the
   collection axis from those rects, and locks the session's geometry.
4. On every move it computes the **target index** by comparing the dragged item's
   clamped center against the session-start midpoints of the other items, and shifts
   the affected siblings by one slot step with a CSS transform transition.
5. On release it reports the final order; `useReorderSurface` applies it optimistically
   and persists through `onCommit`, rolling back if persistence fails.

Ordering changes through this collection geometry — never by dropping a DOM node where
the cursor happens to be.

### Lifted presentation layer

During an active session the engine renders the dragged row in `.reorder-overlay`
(`reorderOverlay.ts`): a fixed-position clone mounted on `document.body`. It exists so
the lifted row's Material elevation shadow is never clipped by the list or any
`overflow` container. The overlay travel is clamped to the collection's own bounds and
locked on the cross axis, so it reads as a lifted list row, not a cursor-following DnD
clone. The in-list original becomes the invisible `.reorder-item_slot`: it keeps its
layout box (the open slot the row will land in) but renders nothing, so there is no
visible ghost row.

### Shared visual states

Product-state classes, all owned by `reorderSurface.css`:

| Class                        | Where                | Meaning                                        |
| ---------------------------- | -------------------- | ---------------------------------------------- |
| `reorder-surface_activating` | container            | press is armed, activation gate not passed yet |
| `reorder-surface_active`     | container            | a reorder session is running                   |
| `reorder-item_slot`          | in-list original     | invisible open slot of the lifted item         |
| `reorder-overlay`            | body-mounted overlay | the lifted row surface                         |

### Suppression behaviors

- Text selection is suppressed document-wide from the moment a press is armed, and
  cleared if the browser creates one anyway (`useReorderSurface.helpers.ts`).
- The synthetic click browsers fire right after a completed reorder is swallowed, so a
  drop never also activates the row it landed on (`reorderPostDragClick.ts`).
- `dragstart` is prevented on reorder items, so no native browser drag (and no browser
  drag image) can ever start from a row.
- Listeners, timers, pointer capture, overlay, transforms, and suppression are all
  released on end, cancel (`Escape`, `pointercancel`), disable, and unmount.

## Module map

| Module                         | Responsibility                                             |
| ------------------------------ | ---------------------------------------------------------- |
| `useReorderSurface.ts`         | public composable: optimistic order state, commit/rollback |
| `reorderEngine.ts`             | pointer session, activation gating, DOM writes             |
| `reorderGeometry.ts`           | pure rect math: axis, target index, shifts, clamping       |
| `reorderOverlay.ts`            | lifted presentation layer                                  |
| `reorderAutoScroll.ts`         | edge auto-scroll inside `scrollContainer`                  |
| `reorderInput.ts`              | input normalization and gating constants                   |
| `reorderDirectives.ts`         | `v-reorder-item`, `v-reorder-ignore`                       |
| `useReorderSurface.helpers.ts` | session state machine, selection suppression               |
| `reorderPostDragClick.ts`      | post-reorder click suppression rules                       |

The geometry layer works on item rects and pointer coordinates, not on a hard-coded
vertical model, so horizontal or wrapped collections can be supported later without
changing the consumer API. Vertical lists are the supported production scenario today.
