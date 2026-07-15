<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useReorderItem } from './useReorderItem';

const props = defineProps<{
  itemId: string;
  index: number;
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
    class="reorder-self-scrollable-story-item"
    :class="{ 'reorder-self-scrollable-story-item_dragging': isDragging }"
  >
    {{ itemId }}
  </div>
</template>

<style scoped>
.reorder-self-scrollable-story-item {
  box-sizing: border-box;
  height: 40px;
  padding: 8px 12px;
  background: #eef2ff;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
  cursor: grab;
}

.reorder-self-scrollable-story-item_dragging {
  cursor: grabbing;
}
</style>
