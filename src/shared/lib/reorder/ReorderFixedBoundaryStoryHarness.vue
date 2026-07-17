<script setup lang="ts">
import { ref } from 'vue';
import { ReorderSurface } from '.';
import type { ReorderCommitRequest } from './types';
import ReorderSelfScrollableStoryItem from './ReorderSelfScrollableStoryItem.vue';

const itemIds = ref<string[]>(Array.from({ length: 10 }, (_, index) => `row-${index}`));

const onReorder = (request: ReorderCommitRequest<string>) => {
  itemIds.value = [...request.orderedIds];
};
</script>

<template>
  <div class="reorder-fixed-boundary-story-harness">
    <p>
      position: fixed reorder surface fixture whose containing block is a transformed ancestor, not
      the browser viewport — the ancestor's own scroll must still be able to participate in
      autoscroll
    </p>
    <div
      role="region"
      aria-label="Reorder scroll ancestor"
      class="reorder-fixed-boundary-story-harness__ancestor"
    >
      <div class="reorder-fixed-boundary-story-harness__ancestor-spacer-top" aria-hidden="true" />
      <div class="reorder-fixed-boundary-story-harness__fixed-surface">
        <ReorderSurface :item-ids="itemIds" @reorder="onReorder">
          <div
            role="list"
            aria-label="Fixed boundary reorder items"
            class="reorder-fixed-boundary-story-harness__container"
          >
            <ReorderSelfScrollableStoryItem
              v-for="(id, index) in itemIds"
              :key="id"
              :item-id="id"
              :index="index"
              :snap="false"
            />
          </div>
        </ReorderSurface>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * `transform` on `.ancestor` establishes the containing block for its `position: fixed`
 * descendant, so `.fixed-surface`'s `top: 0` is resolved against `.ancestor`'s own padding box
 * (its un-scrolled, on-page geometry) rather than the viewport. `.fixed-surface` is out of flow,
 * so `.ancestor-spacer-top` alone defines `.ancestor`'s scrollable extent, giving it real scroll
 * room independent of `.fixed-surface`'s own size. Because the containing block is a scrolling
 * box, `.fixed-surface`'s rendered screen position still shifts by `-scrollTop` as `.ancestor`
 * scrolls, exactly like the content position it's anchored relative to: at `scrollTop: 0` only
 * `.fixed-surface`'s first rows fit inside `.ancestor`'s own visible height, and scrolling
 * `.ancestor` toward its native limit reveals its later rows.
 */
.reorder-fixed-boundary-story-harness {
  width: 100%;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-fixed-boundary-story-harness__ancestor {
  position: relative;
  transform: translateZ(0);
  width: 300px;
  height: 260px;
  overflow: auto;
  border: 1px solid #ccc;
}

.reorder-fixed-boundary-story-harness__ancestor-spacer-top {
  height: 550px;
}

.reorder-fixed-boundary-story-harness__fixed-surface {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-bottom: 1px dashed #999;
}

.reorder-fixed-boundary-story-harness__container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
}
</style>
