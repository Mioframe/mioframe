<script setup lang="ts">
import { ref } from 'vue';
import { ReorderSurface } from '.';
import type { ReorderCommitRequest } from './types';
import ReorderSelfScrollableStoryItem from './ReorderSelfScrollableStoryItem.vue';

const itemIds = ref<string[]>(Array.from({ length: 20 }, (_, index) => `row-${index}`));

const onReorder = (request: ReorderCommitRequest<string>) => {
  itemIds.value = [...request.orderedIds];
};
</script>

<template>
  <div class="reorder-document-viewport-story-harness">
    <p>document viewport autoscroll fallback fixture</p>

    <div class="reorder-document-viewport-story-harness__page-spacer-top" aria-hidden="true" />

    <div
      role="region"
      aria-label="Reorder scroll ancestor"
      class="reorder-document-viewport-story-harness__ancestor"
    >
      <div
        class="reorder-document-viewport-story-harness__ancestor-spacer-top"
        aria-hidden="true"
      />
      <ReorderSurface :item-ids="itemIds" @reorder="onReorder">
        <div
          role="list"
          aria-label="Document viewport reorder items"
          class="reorder-document-viewport-story-harness__container"
        >
          <ReorderSelfScrollableStoryItem
            v-for="(id, index) in itemIds"
            :key="id"
            :item-id="id"
            :index="index"
          />
        </div>
      </ReorderSurface>
    </div>

    <div class="reorder-document-viewport-story-harness__page-spacer-bottom" aria-hidden="true" />
  </div>
</template>

<style scoped>
/*
 * Three independently exhaustible scroll levels for the same drag, each genuinely required in
 * turn:
 *
 * 1. The container's own overflow (many items in a short box) reveals hidden rows.
 * 2. The container's own box (500px) is deliberately taller than the ancestor's own box (350px)
 *    and there is no ancestor content after it, so the ancestor's native scroll limit and "the
 *    container is now fully revealed within me" coincide exactly: the ancestor drains its own
 *    real scroll room to reveal the rest of the container.
 * 3. The page spacer above the ancestor leaves only part of the ancestor's own box inside the
 *    browser viewport on load. The ancestor's own on-page position never changes as it scrolls
 *    internally, so fully revealing it (and the container inside it) needs the real document to
 *    scroll too. The ancestor's own box is tall enough that revealing it fully takes a second or
 *    more of real document scrolling, leaving a comfortable margin to sample active autoscroll
 *    before it converges on its native limit.
 */
.reorder-document-viewport-story-harness {
  width: 100%;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-document-viewport-story-harness__page-spacer-top {
  height: calc(100vh - 80px);
}

.reorder-document-viewport-story-harness__page-spacer-bottom {
  height: 300px;
}

.reorder-document-viewport-story-harness__ancestor {
  width: 100%;
  max-width: 320px;
  max-height: 350px;
  overflow: auto;
  scroll-behavior: smooth;
  border: 1px solid #ccc;
}

.reorder-document-viewport-story-harness__ancestor-spacer-top {
  height: 10px;
}

.reorder-document-viewport-story-harness__container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  max-height: 500px;
  overflow: auto;
  scroll-behavior: smooth;
  border: 1px dashed #999;
}
</style>
