<script setup lang="ts">
import { ref } from 'vue';
import { ReorderSurface } from '.';
import type { ReorderCommitRequest } from './types';
import ReorderSelfScrollableStoryItem from './ReorderSelfScrollableStoryItem.vue';

defineProps<{ clipped?: boolean }>();

const itemIds = ref<string[]>(Array.from({ length: 20 }, (_, index) => `row-${index}`));

const onReorder = (request: ReorderCommitRequest<string>) => {
  itemIds.value = [...request.orderedIds];
};
</script>

<template>
  <div class="reorder-self-scrollable-story-harness">
    <p>self-scrollable reorder container fixture</p>
    <div
      role="region"
      aria-label="Reorder scroll ancestor"
      class="reorder-self-scrollable-story-harness__ancestor"
    >
      <div
        class="reorder-self-scrollable-story-harness__ancestor-spacer-top"
        :class="{ 'reorder-self-scrollable-story-harness__ancestor-spacer-top_clipped': clipped }"
        aria-hidden="true"
      />
      <ReorderSurface :item-ids="itemIds" @reorder="onReorder">
        <div
          role="list"
          aria-label="Self-scrollable reorder items"
          class="reorder-self-scrollable-story-harness__container"
        >
          <ReorderSelfScrollableStoryItem
            v-for="(id, index) in itemIds"
            :key="id"
            :item-id="id"
            :index="index"
            :snap="!clipped"
          />
        </div>
      </ReorderSurface>
      <div
        class="reorder-self-scrollable-story-harness__ancestor-spacer-bottom"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
/*
 * Sized so the reorder container and its outer ancestor each retain genuine, independent scroll
 * room at once: the container's own content is much taller than its own `max-height`, and the
 * ancestor's spacers plus the container's rendered (capped) height are together much taller than
 * the ancestor's own `max-height`.
 */
.reorder-self-scrollable-story-harness {
  width: 100%;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-self-scrollable-story-harness__ancestor {
  width: 100%;
  max-width: 320px;
  max-height: 260px;
  overflow: auto;
  scroll-behavior: smooth;
  scroll-snap-type: y proximity;
  border: 1px solid #ccc;
}

.reorder-self-scrollable-story-harness__ancestor-spacer-top {
  height: 80px;
  scroll-snap-align: start;
}

.reorder-self-scrollable-story-harness__ancestor-spacer-top_clipped {
  height: 220px;
  scroll-snap-align: none;
}

.reorder-self-scrollable-story-harness__ancestor-spacer-bottom {
  height: 200px;
  scroll-snap-align: start;
}

.reorder-self-scrollable-story-harness__container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  max-height: 140px;
  overflow: auto;
  scroll-behavior: smooth;
  scroll-snap-type: y proximity;
  scroll-padding-block: 8px;
  border: 1px dashed #999;
}
</style>
