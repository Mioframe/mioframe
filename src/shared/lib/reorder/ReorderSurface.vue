<script setup lang="ts" generic="TId extends ReorderItemId">
import { DragDropProvider, type DragEndEvent, type DragStartEvent } from '@dnd-kit/vue';
import { isSortableOperation } from '@dnd-kit/vue/sortable';
import { computed, provide, ref, shallowRef } from 'vue';
import { getReorderPlugins, REORDER_MODIFIERS, REORDER_SENSORS } from './reorderConfig';
import { reorderSurfaceInjectionKey } from './reorderSurfaceContext';
import { moveItem } from './reorderArray';
import { attemptTouchHapticFeedback, scheduleTouchDragCleanup } from './touchDragCleanup';
import type { ReorderCommitRequest, ReorderItemId } from './types';

const props = defineProps<{
  /** Canonical ordered item ids; the only authoritative source of order. */
  itemIds: readonly TId[];
  /** Whether new drag activation must stay disabled, e.g. while a reorder is still pending. */
  disabled?: boolean;
}>();

const emit = defineEmits<{
  /** One completed, changed, valid drag translated into a guarded reorder request. */
  reorder: [request: ReorderCommitRequest<TId>];
}>();

defineSlots<{
  default: () => unknown;
}>();

provide(reorderSurfaceInjectionKey, {
  disabled: computed(() => Boolean(props.disabled)),
});

const dragStartSnapshot = shallowRef<readonly TId[] | null>(null);
const activePointerType = ref<string | undefined>(undefined);

const onDragStart = (event: DragStartEvent) => {
  dragStartSnapshot.value = [...props.itemIds];

  const pointerType =
    event.nativeEvent instanceof PointerEvent ? event.nativeEvent.pointerType : undefined;
  activePointerType.value = pointerType;

  attemptTouchHapticFeedback(pointerType);
};

const onDragEnd = (event: DragEndEvent) => {
  const snapshot = dragStartSnapshot.value;
  const pointerType = activePointerType.value;
  dragStartSnapshot.value = null;
  activePointerType.value = undefined;

  const { operation } = event;
  const source = isSortableOperation(operation) ? operation.source : null;

  scheduleTouchDragCleanup(pointerType, source?.element);

  if (!snapshot || event.canceled || !source) {
    return;
  }

  const fromIndex = source.initialIndex;
  const toIndex = source.index;

  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= snapshot.length ||
    toIndex < 0 ||
    toIndex >= snapshot.length
  ) {
    return;
  }

  emit('reorder', {
    expectedOrderedIds: snapshot,
    orderedIds: moveItem(snapshot, fromIndex, toIndex),
  });
};
</script>

<template>
  <DragDropProvider
    :sensors="REORDER_SENSORS"
    :plugins="getReorderPlugins"
    :modifiers="REORDER_MODIFIERS"
    @drag-start="onDragStart"
    @drag-end="onDragEnd"
  >
    <slot />
  </DragDropProvider>
</template>
