# @shared/lib/reorder

A thin dnd-kit-based Vue 3 primitive for pointer-driven list reordering. It owns drag interaction
only: sensors, plugins, container-bounds restriction, the Material reorder transition, and
translating a completed drag into a typed reorder request. It owns nothing about persistence.

## Status

This is the **canonical** reorder implementation and the target for incrementally migrating
existing consumers off `@shared/lib/sortable` (legacy, see that module's README). New reorder
consumers must use this module, not `@shared/lib/sortable`.

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ReorderSurface, type ReorderCommitRequest } from '@shared/lib/reorder';
import { MDList } from '@shared/ui/Lists';

const itemIds = ref<MyItemId[]>([...]);

const onReorder = (request: ReorderCommitRequest<MyItemId>) => {
  // Apply request.orderedIds optimistically and persist, guarded by
  // request.expectedOrderedIds. See "Ownership" below.
};
</script>

<template>
  <ReorderSurface :item-ids="itemIds" @reorder="onReorder">
    <MDList>
      <MyRow v-for="(id, index) in itemIds" :key="id" :item-id="id" :index="index" />
    </MDList>
  </ReorderSurface>
</template>
```

Each row registers itself with `useReorderItem`:

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useReorderItem } from '@shared/lib/reorder';

const props = defineProps<{ itemId: MyItemId; index: number }>();
const rootEl = useTemplateRef<HTMLElement>('root');

const { isDragging } = useReorderItem({
  id: () => props.itemId,
  index: () => props.index,
  element: () => rootEl.value ?? undefined,
  handle: () => rootEl.value ?? undefined,
});
</script>

<template>
  <li ref="root" :class="{ dragging: isDragging }">...</li>
</template>
```

`ReorderSurface` is renderless (`DragDropProvider` adds no DOM node) and its default slot has no
slot props: render the list from whatever ids you already own. There are no callback props; the
component emits one typed `reorder` event per completed, changed, valid drag.

## Controlled-list contract

`itemIds` must contain unique values. This is validated at three points, not continuously:

- **Setup**: duplicate initial `itemIds` throw `ReorderSurface: itemIds must contain unique
values.` deterministically when the component is created.
- **Drag start**: the same check runs again before any other drag-start work (snapshot, pointer
  tracking, haptics), so a duplicate introduced by a background mutation since setup or since the
  last drag is rejected before a new drag can activate.
- **Drag end**: a completed drag is ignored, emitting nothing, if either the drag-start snapshot
  or the current controlled `itemIds` contains a duplicate. This never throws — a completion can
  legitimately arrive after external state changed, and the safe response is to ignore it.

`ReorderSurface` does not continuously observe `itemIds` in between these points, and it never
mutates, repairs, or rolls back the caller's list. A consumer that corrects a duplicate before its
next drag attempt resumes normal operation without remounting.

The surface also ignores a completed drag's operation, emitting nothing, if the controlled order
changed during the drag: `itemIds` no longer matches the order observed at drag start, the dragged
item's id no longer matches its drag-start position, or either index is out of range. A later,
consistent drag still emits normally.

## Ownership

- **Shared** (`ReorderSurface`, `useReorderItem`): drag interaction only — activation, transition,
  bounds, touch haptics/cleanup, and translating a drag into a `ReorderCommitRequest`.
- **Feature**: owns the optimistic displayed order, pending state, and rollback/confirmation
  reconciliation for its guarded persistence call. See
  `src/features/databaseViewMapEdit/useDatabaseViewReorderState.ts` for a worked example.
- **Service**: owns the guarded canonical mutation, comparing `expectedOrderedIds` against the
  live document and applying `orderedIds` atomically, returning `'applied'` or `'stale'`.

## Container-boundary contract

Every sortable item root must be a **direct DOM child** of the container that defines its movement
bounds (e.g. `MDList`'s root element). The dragged element cannot visually leave that direct
parent. This is enforced through dnd-kit's `RestrictToElement` modifier, not custom geometry.

## Autoscroll scope

Autoscroll during a drag is scoped to the active reorder container: outer scrollable ancestors
(e.g. a bottom sheet) only scroll while doing so can still reveal more of the container. Once the
container's edge in a given direction is visible, that ancestor stops scrolling in that direction,
even if the pointer is still held near its own edge — top, bottom, left, and right are resolved
independently, and X and Y can move different ancestors within the same drag. The container's own
overflow scrolling, if it has any, keeps standard, unrestricted autoscroll: that is what reveals
hidden sortable items.

dnd-kit 0.5.0's default `AutoScroller` has no notion of the reorder container's bounds, so it keeps
autoscrolling an outer ancestor even once that ancestor can no longer reveal more of the container.
`ReorderAutoScroller` replaces it in `getReorderPlugins` rather than running alongside it.

## Supported scope

- One `ReorderSurface` per screen region.
- Pointer input only (mouse, touch, pen).
- Arbitrary item sizes and layout directions (vertical lists, horizontal layouts, grids,
  flex-wrap).

## Unsupported scope

- Cross-container dragging.
- Nested reorder zones.
- Keyboard reordering.
- Virtualization-specific integration.
