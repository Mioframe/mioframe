<script setup lang="ts">
import { ref } from 'vue';
import { ReorderSurface } from '.';
import type { ReorderCommitRequest } from './types';
import ReorderSelfScrollableStoryItem from './ReorderSelfScrollableStoryItem.vue';

const uniqueItemIds = ['alpha', 'bravo', 'charlie'] as const;
const controlledItemIds = ref<string[]>([...uniqueItemIds]);
const renderedItemIds = ref<string[]>([...uniqueItemIds]);
const reorderCount = ref(0);

const useDuplicateIds = () => {
  controlledItemIds.value = ['alpha', 'bravo', 'alpha'];
};

const restoreUniqueIds = () => {
  controlledItemIds.value = [...renderedItemIds.value];
};

const onReorder = (request: ReorderCommitRequest<string>) => {
  controlledItemIds.value = [...request.orderedIds];
  renderedItemIds.value = [...request.orderedIds];
  reorderCount.value += 1;
};
</script>

<template>
  <div class="reorder-activation-story-harness">
    <button type="button" @click="useDuplicateIds">Use duplicate IDs</button>
    <button type="button" @click="restoreUniqueIds">Restore unique IDs</button>
    <output aria-label="Controlled IDs">{{ controlledItemIds.join(',') }}</output>
    <output aria-label="Current order">{{ renderedItemIds.join(',') }}</output>
    <output aria-label="Reorder count">{{ reorderCount }}</output>
    <ReorderSurface :item-ids="controlledItemIds" @reorder="onReorder">
      <div role="list" aria-label="Activation test reorder items">
        <ReorderSelfScrollableStoryItem
          v-for="(id, index) in renderedItemIds"
          :key="id"
          :item-id="id"
          :index="index"
        />
      </div>
    </ReorderSurface>
  </div>
</template>

<style scoped>
.reorder-activation-story-harness {
  display: grid;
  gap: 8px;
  width: 280px;
  font-family: sans-serif;
}
</style>
