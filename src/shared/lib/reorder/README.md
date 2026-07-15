# @shared/lib/reorder

A thin dnd-kit-based Vue 3 primitive for pointer-driven list reordering. It owns drag interaction
only: sensors, plugins, container-bounds restriction, the Material reorder transition, and
translating a completed drag into a typed reorder request. It owns nothing about persistence.

## Usage

```vue
<script setup lang="ts">
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
