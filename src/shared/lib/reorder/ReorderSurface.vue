<script setup lang="ts" generic="TId extends ReorderItemId">
import { DragDropProvider, type DragEndEvent, type DragStartEvent } from '@dnd-kit/vue';
import { isSortableOperation } from '@dnd-kit/vue/sortable';
import { computed, provide, ref, shallowRef, watch } from 'vue';
import { getReorderPlugins, REORDER_MODIFIERS, REORDER_SENSORS } from './reorderConfig';
import { reorderSurfaceInjectionKey } from './reorderSurfaceContext';
import { attemptTouchHapticFeedback, scheduleTouchDragCleanup } from './touchDragCleanup';
import type { ReorderCommitRequest, ReorderItemId } from './types';
import { assertUniqueItemIds, resolveReorderDragEnd } from './validateReorderSurface';

const props = defineProps<{
  /**
   * The current ordered item ids rendered by the surface. This is the order a drag operates on,
   * not necessarily the canonical persisted order: a caller reconciling optimistic state (see
   * `useDatabaseViewReorderState`) passes its optimistic display order while a reorder is pending.
   */
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

// `flush: 'sync'` so a reactive `itemIds` change that introduces a duplicate throws immediately,
// before any subsequent drag can start or emit from the now-invalid controlled list.
watch(() => props.itemIds, assertUniqueItemIds, { immediate: true, flush: 'sync' });

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

  const request = resolveReorderDragEnd({
    canceled: event.canceled,
    snapshot,
    currentItemIds: props.itemIds,
    source,
  });

  if (request) {
    emit('reorder', request);
  }
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
