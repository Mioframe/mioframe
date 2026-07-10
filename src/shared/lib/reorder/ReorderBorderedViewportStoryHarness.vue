<script setup lang="ts">
import { computed, ref } from 'vue';
import { useReorder } from '@shared/lib/reorder';

const items = ref<string[]>(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']);
const keys = computed(() => items.value);

const { vReorderContainer, vReorderItem } = useReorder({
  keys,
  onReorder: ({ fromIndex, toIndex }) => {
    const next = [...items.value];
    const [moved] = next.splice(fromIndex, 1);
    if (moved) next.splice(toIndex, 0, moved);
    items.value = next;
  },
});
</script>

<template>
  <div
    v-reorder-container
    class="reorder-bordered-viewport-harness__container"
    data-testid="reorder-bordered-viewport-container"
  >
    <div
      v-for="item in items"
      :key="item"
      v-reorder-item="item"
      class="reorder-bordered-viewport-harness__item"
      :data-testid="`reorder-bordered-viewport-item-${item}`"
    >
      {{ item }}
    </div>
  </div>
</template>

<style scoped>
/*
 * Deliberately isolated from ReorderStoryHarness with a thick border, so a Playwright test can
 * prove autoscroll edge detection is measured from the container's client (content) viewport,
 * excluding the border, without perturbing any other story's geometry.
 */
.reorder-bordered-viewport-harness__container {
  box-sizing: content-box;
  width: 240px;
  height: 200px;
  overflow: auto;
  overflow-x: hidden;
  border: 100px solid #ddd;
  padding: 0;
  background: #fff;
}

.reorder-bordered-viewport-harness__item {
  height: 60px;
  box-sizing: border-box;
  padding: 8px;
  background: #eef2ff;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
  cursor: grab;
}
</style>
