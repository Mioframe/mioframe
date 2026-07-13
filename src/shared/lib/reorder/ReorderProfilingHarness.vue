<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useReorder } from '@shared/lib/reorder';

/**
 * Storybook-only large-list profiling surface: reuses the same public `useReorder` contract as a
 * real consumer so DevTools profiling during a frame reflects production wiring, not a
 * synthetic shortcut. Not part of visual snapshot coverage and carries no timing assertions —
 * see the module README's profiling notes.
 */

const props = defineProps<{
  /** Number of generated items. */
  itemCount: number;
}>();

interface ProfilingItem {
  key: number;
  label: string;
}

const createItems = (count: number): ProfilingItem[] =>
  Array.from({ length: count }, (_, index) => ({ key: index, label: `Item ${index}` }));

const items = ref<ProfilingItem[]>([]);
watch(
  () => props.itemCount,
  (count) => {
    items.value = createItems(count);
  },
  { immediate: true },
);
const keys = computed(() => items.value.map((item) => item.key));

const reorderCount = ref(0);
const reorderItems = (orderedKeys: readonly number[]): void => {
  items.value = orderedKeys
    .map((key) => items.value.find((item) => item.key === key))
    .filter((item): item is ProfilingItem => item !== undefined);
};

const { draggingKey, vReorderContainer, vReorderItem } = useReorder({
  keys,
  onReorder: ({ orderedKeys }) => {
    reorderCount.value += 1;
    reorderItems(orderedKeys);
  },
});
</script>

<template>
  <div class="reorder-profiling-harness">
    <dl class="reorder-profiling-harness__meta">
      <dt>items</dt>
      <dd data-testid="reorder-profiling-item-count">{{ items.length }}</dd>
      <dt>draggingKey</dt>
      <dd data-testid="reorder-profiling-dragging-key">{{ draggingKey ?? '' }}</dd>
      <dt>onReorder calls</dt>
      <dd data-testid="reorder-profiling-reorder-count">{{ reorderCount }}</dd>
    </dl>

    <div v-reorder-container class="reorder-profiling-harness__container">
      <div
        v-for="item in items"
        :key="item.key"
        v-reorder-item="item.key"
        class="reorder-profiling-harness__item"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Story-local presentation only: this profiling harness owns no part of the library's
 * (nonexistent) production visual treatment.
 */
.reorder-profiling-harness {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-profiling-harness__meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 8px;
  margin: 0;
}

.reorder-profiling-harness__meta dt {
  font-weight: 600;
  color: #666;
}

.reorder-profiling-harness__meta dd {
  margin: 0;
  font-family: monospace;
}

.reorder-profiling-harness__container {
  max-height: 480px;
  overflow: auto;
  border: 1px solid #ccc;
}

.reorder-profiling-harness__item {
  padding: 8px 12px;
  box-sizing: border-box;
  background: #eef2ff;
  border-bottom: 1px solid #a5b4fc;
  cursor: grab;
}
</style>
