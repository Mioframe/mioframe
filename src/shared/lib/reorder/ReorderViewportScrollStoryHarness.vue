<script setup lang="ts">
import { computed, ref } from 'vue';
import { useReorder } from '@shared/lib/reorder';

const items = ref<string[]>(['one', 'two', 'three', 'four', 'five', 'six']);
const keys = computed(() => items.value);

const { vReorderContainer, vReorderItem } = useReorder({
  keys,
  onReorder: ({ orderedKeys }) => {
    items.value = [...orderedKeys];
  },
});
</script>

<template>
  <div class="reorder-viewport-scroll-harness">
    <p>viewport autoscroll fallback fixture</p>
    <div
      role="region"
      aria-label="Reorder scroll ancestor"
      class="reorder-viewport-scroll-harness__ancestor"
    >
      <div class="reorder-viewport-scroll-harness__ancestor-spacer" aria-hidden="true" />
      <div
        v-reorder-container
        role="list"
        aria-label="Reorder items"
        class="reorder-viewport-scroll-harness__container"
      >
        <div
          v-for="item in items"
          :key="item"
          v-reorder-item="item"
          role="listitem"
          :aria-label="item"
          class="reorder-viewport-scroll-harness__item"
        >
          {{ item }}
        </div>
      </div>
      <div class="reorder-viewport-scroll-harness__ancestor-spacer-bottom" aria-hidden="true" />
    </div>
    <div class="reorder-viewport-scroll-harness__page-filler" aria-hidden="true" />
  </div>
</template>

<style>
/*
 * Global and unscoped, deliberately: the product app shell (imported globally into Storybook for
 * design tokens) fixes html/body to a bounded height, which turns body into its own internal
 * scroll container and leaves window.scrollY permanently at 0. This dedicated story owns
 * overriding that constraint for its own page load only — each Storybook story is a fresh
 * iframe.html navigation, so this never leaks into another story's page.
 */
html,
body {
  height: auto;
  min-height: 100%;
  overflow: visible;
}
</style>

<style scoped>
/*
 * Story-local presentation only: sized so that, at the 500x320 viewport this fixture is verified
 * against, the reorder container, its scroll ancestor, and the document itself all retain genuine
 * scroll room at once.
 */
.reorder-viewport-scroll-harness {
  width: 100%;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-viewport-scroll-harness__ancestor {
  width: 100%;
  max-width: 320px;
  max-height: 180px;
  overflow: auto;
  border: 1px solid #ccc;
}

.reorder-viewport-scroll-harness__ancestor-spacer {
  height: 30px;
}

.reorder-viewport-scroll-harness__ancestor-spacer-bottom {
  height: 200px;
}

.reorder-viewport-scroll-harness__container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  max-height: 100px;
  overflow: auto;
  border: 1px dashed #999;
}

.reorder-viewport-scroll-harness__item {
  height: 50px;
  box-sizing: border-box;
  padding: 6px;
  background: #eef2ff;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
  cursor: grab;
}

.reorder-viewport-scroll-harness__page-filler {
  height: 250px;
}
</style>
