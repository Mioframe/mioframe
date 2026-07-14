<script setup lang="ts">
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/vue';
import { isSortableOperation } from '@dnd-kit/vue/sortable';
import { computed, provide } from 'vue';
import { getReorderPlugins, REORDER_SENSORS } from './reorderConfig';
import { reorderSurfaceInjectionKey } from './reorderSurfaceContext';
import { useReorderCommit } from './useReorderCommit';
import type { ReorderCommitRequest, ReorderCommitResult } from './types';

const props = defineProps<{
  /** Canonical ordered item ids; the only authoritative source of order. */
  itemIds: readonly string[];
  /** Guarded persistence callback invoked once per completed, changed, valid drag. */
  commit: (request: ReorderCommitRequest<string>) => Promise<ReorderCommitResult>;
}>();

defineSlots<{
  default: (scope: { displayItemIds: readonly string[] }) => unknown;
}>();

const itemIds = computed(() => props.itemIds);

const { displayItemIds, isCommitPending, onDragStart, onDragEnd } = useReorderCommit(
  itemIds,
  (request) => props.commit(request),
);

provide(reorderSurfaceInjectionKey, {
  disabled: isCommitPending,
});

const onDndKitDragEnd = (event: DragEndEvent) => {
  const { operation } = event;
  const source = isSortableOperation(operation) ? operation.source : null;

  onDragEnd({
    canceled: event.canceled,
    isSortableSource: Boolean(source),
    fromIndex: source?.initialIndex ?? 0,
    toIndex: source?.index ?? 0,
  });
};
</script>

<template>
  <DragDropProvider
    :sensors="REORDER_SENSORS"
    :plugins="getReorderPlugins"
    @drag-start="onDragStart"
    @drag-end="onDndKitDragEnd"
  >
    <slot :display-item-ids="displayItemIds" />
  </DragDropProvider>
</template>
