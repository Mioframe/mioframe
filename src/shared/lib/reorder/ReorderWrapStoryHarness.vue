<script setup lang="ts">
import { ref } from 'vue';
import { ReorderSurface } from '.';
import type { ReorderCommitRequest } from './types';
import ReorderWrapStoryItem from './ReorderWrapStoryItem.vue';

// Deliberately uneven widths/heights so a narrow flex-wrap container renders them across
// multiple rows, exercising the README's advertised "arbitrary item sizes and layout
// directions (vertical lists, horizontal layouts, grids, flex-wrap)" and "no configured axis"
// scope with real cross-row geometry instead of a uniform vertical list.
const ITEM_SIZES: Record<string, { width: number; height: number }> = {
  'wrap-item-0': { width: 100, height: 40 },
  'wrap-item-1': { width: 140, height: 60 },
  'wrap-item-2': { width: 80, height: 50 },
  'wrap-item-3': { width: 120, height: 40 },
  'wrap-item-4': { width: 100, height: 60 },
  'wrap-item-5': { width: 140, height: 50 },
};

const getItemSize = (id: string) => ITEM_SIZES[id] ?? { width: 100, height: 40 };

const itemIds = ref<string[]>(Object.keys(ITEM_SIZES));

const onReorder = (request: ReorderCommitRequest<string>) => {
  itemIds.value = [...request.orderedIds];
};
</script>

<template>
  <div class="reorder-wrap-story-harness">
    <p>wrapping/grid reorder fixture: mixed item sizes, movement across rows</p>
    <ReorderSurface :item-ids="itemIds" @reorder="onReorder">
      <div
        role="list"
        aria-label="Wrapping reorder items"
        class="reorder-wrap-story-harness__container"
      >
        <ReorderWrapStoryItem
          v-for="(id, index) in itemIds"
          :key="id"
          :item-id="id"
          :index="index"
          :width="getItemSize(id).width"
          :height="getItemSize(id).height"
        />
      </div>
    </ReorderSurface>
  </div>
</template>

<style scoped>
.reorder-wrap-story-harness {
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-wrap-story-harness__container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 260px;
  padding: 8px;
  border: 1px dashed #999;
}
</style>
