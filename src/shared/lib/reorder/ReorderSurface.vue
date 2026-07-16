<script setup lang="ts" generic="TId extends ReorderItemId">
import {
  type BeforeDragStartEvent,
  DragDropProvider,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/vue';
import { isSortableOperation } from '@dnd-kit/vue/sortable';
import { computed, provide, ref, shallowRef } from 'vue';
import { getReorderPlugins, REORDER_MODIFIERS, REORDER_SENSORS } from './reorderConfig';
import { reorderSurfaceInjectionKey } from './reorderSurfaceContext';
import { attemptTouchHapticFeedback, scheduleTouchDragCleanup } from './touchDragCleanup';
import type { ReorderCommitRequest, ReorderItemId } from './types';
import {
  assertUniqueItemIds,
  hasUniqueItemIds,
  resolveReorderDragEnd,
} from './validateReorderSurface';

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

// eslint-disable-next-line vue/no-setup-props-reactivity-loss -- one-shot setup-time validation call, not a stored or reactive snapshot of `itemIds`
assertUniqueItemIds(props.itemIds);

const dragStartSnapshot = shallowRef<readonly TId[] | null>(null);
const activePointerType = ref<string | undefined>(undefined);

const onBeforeDragStart = (event: BeforeDragStartEvent) => {
  if (!hasUniqueItemIds(props.itemIds)) {
    event.preventDefault();
  }
};

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
    @before-drag-start="onBeforeDragStart"
    @drag-start="onDragStart"
    @drag-end="onDragEnd"
  >
    <slot />
  </DragDropProvider>
</template>
