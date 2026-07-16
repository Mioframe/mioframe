# sortable

Generic reorder primitives for Vue surfaces.

## Status

**Legacy.** `@shared/lib/reorder` is the canonical reorder implementation for new consumers. This
module is retained only for its remaining unmigrated production consumer,
`src/features/databaseItemSorting/DatabaseItemSortingListSection.vue`, plus its own
`ReorderSurfacePlayground.vue` dev playground. It is closed to new consumers and feature
additions, and is planned for removal once that consumer migrates to `@shared/lib/reorder`.

This module is a generic reorder primitive: it does not know anything about database views,
sorting rules, or any other business data. It is not the current shared drag-to-reorder layer —
see the Status section above — but its remaining consumer still relies on this contract:

- the caller provides a stable ordered list of string ids;
- the library renders and previews reorder sessions against those ids;
- the caller persists the new order in `onCommit`.

## Public API

Import through `index.ts`.

### `useReorderSurface(container, options)`

High-level composable for reorderable surfaces.

Inputs:

- `itemIdList`: the authoritative external order.
- `layout`: optional, defaults to `'vertical'`.
- `activation`: optional, defaults to `'immediate'`.
- `density`: optional, defaults to `'comfortable'`.
- `disabled`: disables reordering.
- `interactiveSelector`: selector for controls that should not start drag.
- `scrollContainer`: optional scroll target for auto-scroll.
- `onCommit`: async or sync persistence callback.

Outputs:

- `displayItemIdList`: local display order used during drag preview and optimistic UI.
- `draggedId`: the id currently being dragged.
- `isDragging`: whether a drag is active.
- `isReorderSession`: alias for drag session state.
- `activeProfile`: resolved runtime input profile.
- `suppressNextClick`: whether the next synthetic click is being suppressed.
- `cancel()`: requests rollback of the active drag session.

### `vReorderItem`

Marks an element or component root as a reorderable item and assigns its stable
id through `data-sortable-id`.

### `vReorderIgnore`

Marks a subtree as non-draggable through `data-sortable-ignore`. Use this on
buttons, menu triggers, delete actions, and other controls that should stay
clickable without starting drag.

## Typical Integration

```vue
<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useReorderSurface, vReorderIgnore, vReorderItem } from '@shared/lib/sortable';

const container = useTemplateRef('container');
const itemIdList = computed(() => props.items.map((item) => item.id));

const { displayItemIdList, draggedId } = useReorderSurface(container, {
  itemIdList,
  onCommit: ({ orderedIds }) => persistOrder(orderedIds),
});
</script>

<template>
  <div ref="container">
    <RowComponent
      v-for="itemId in displayItemIdList"
      :key="itemId"
      v-reorder-item="itemId"
      :class="{ 'md-state_drag': draggedId === itemId }"
    >
      <button v-reorder-ignore type="button">delete</button>
    </RowComponent>
  </div>
</template>
```

## Why `displayItemIdList` Exists

The library intentionally does not mutate the caller's source list directly.

Reasons:

- business persistence belongs outside the generic reorder primitive;
- drag preview needs a temporary local order before persistence succeeds;
- optimistic UI should keep working even when external state updates arrive
  asynchronously;
- rollback and cancel flows must be able to restore the correct authoritative
  order.

`itemIdList` is the external source of truth.
`displayItemIdList` is the local render order for the current session.

## Internal Flow

### 1. Markup phase

- every draggable row gets `v-reorder-item="id"`;
- controls that should not start drag get `v-reorder-ignore`;
- `useReorderSurface` receives the same ordered ids through `itemIdList`.

### 2. Input and profile phase

- `useReorderSurface` tracks the most recent input type: pointer, touch, or pen;
- pen input is treated as touch-like input;
- `reorderGestureProfile.ts` resolves runtime behavior such as delay,
  threshold, scroll sensitivity, and animation;
- touch-like input can be upgraded from `immediate` to `longPress` to avoid
  accidental drags on dense mobile surfaces.

### 3. Adapter phase

- `sortableAdapter.ts` creates and owns the `SortableJS` instance;
- runtime options are updated when layout, profile, disabled state, or scroll
  target changes;
- the adapter emits generic `onStart`, `onChange`, and `onEnd` events with
  string ids, not business objects.

### 4. Session phase

During a drag session, `useReorderSurface.ts` keeps local session state:

- the dragged id;
- the order at drag start;
- the latest external order;
- the current optimistic order, if a commit is in flight.

This is what allows the library to separate drag preview from persistence.

### 5. Commit phase

When drag ends:

- unchanged order becomes a no-op;
- changed order updates `displayItemIdList` immediately;
- `onCommit` receives `orderedIds`, `movedId`, indices, and the runtime input
  profile.

The caller is responsible for persisting the new order and eventually emitting
the updated `itemIdList`.

## External Sync Rules

These rules explain the behavior that is easiest to miss when reading the code.

### External update during drag

If the external list changes while drag is active, the session is marked for
rollback. At drag end, the UI returns to the latest external order rather than
the stale order from drag start.

### Optimistic commit confirmation

If the external list later matches the optimistic order, the optimistic session
is considered confirmed and local optimistic state is cleared.

### Temporary old-order re-emission

If the external list temporarily re-emits the pre-drag order while the
optimistic commit is still pending, the library ignores that single rollback to
avoid visible flicker.

### Competing external reorder

If the external list emits a different order with the same set of ids, that
order is treated as authoritative. The UI follows it and any later rejection
from the older commit must not overwrite it.

## File Map

- `useReorderSurface.ts`: public composable, session state, DOM event wiring.
- `sortableAdapter.ts`: `SortableJS` bridge and lifecycle ownership.
- `reorderDirectives.ts`: item and ignore directives.
- `reorderGestureProfile.ts`: platform and input heuristics.
- `reorderPostDragClick.ts`: synthetic click suppression rules after drag.
- `constants.ts`: shared attributes, class names, and selectors.
- `reorderSurface.css`: drag-session CSS overrides.
- `ReorderSurfacePlayground.vue`: manual playground for behavior checks.
- `*.test.ts`: focused unit coverage for the touched invariants.

## Invariants

- Item ids must be stable, unique strings for the current surface.
- The library is generic over item shape; only ids cross the public contract.
- Business persistence must stay in `onCommit`, not inside shared reorder code.
- Import the module through `@shared/lib/sortable`.
