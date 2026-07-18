<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useReorderItem } from './useReorderItem';

const props = defineProps<{
  itemId: string;
  index: number;
  width: number;
  height: number;
}>();

const rootRef = useTemplateRef<HTMLDivElement>('root');

const { isDragging } = useReorderItem({
  id: () => props.itemId,
  index: () => props.index,
  element: () => rootRef.value ?? undefined,
  handle: () => rootRef.value ?? undefined,
});
</script>

<template>
  <div
    ref="root"
    role="listitem"
    :aria-label="itemId"
    class="reorder-wrap-story-item"
    :class="{ 'reorder-wrap-story-item_dragging': isDragging }"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    {{ itemId }}
  </div>
</template>

<style scoped>
.reorder-wrap-story-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: #eef2ff;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
  cursor: grab;
}

.reorder-wrap-story-item_dragging {
  cursor: grabbing;
}
</style>
