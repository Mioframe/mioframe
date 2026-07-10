<script setup lang="ts">
import { computed, ref } from 'vue';
import { useReorder } from '@shared/lib/reorder';

interface HarnessItem {
  id: string;
  label: string;
  width: number;
  height: number;
}

const items = ref<HarnessItem[]>([
  { id: 'alpha', label: 'Alpha', width: 120, height: 60 },
  { id: 'bravo', label: 'Bravo', width: 200, height: 100 },
  { id: 'charlie', label: 'Charlie', width: 80, height: 140 },
  { id: 'delta', label: 'Delta', width: 160, height: 60 },
  { id: 'scrollable', label: 'Scrollable', width: 160, height: 100 },
  { id: 'echo', label: 'Echo', width: 100, height: 80 },
  { id: 'foxtrot', label: 'Foxtrot', width: 140, height: 60 },
  { id: 'golf', label: 'Golf', width: 120, height: 120 },
]);

const keys = computed(() => items.value.map((item) => item.id));

const dragStartCount = ref(0);
const reorderCount = ref(0);
const dragEndCount = ref(0);
const interactiveClickCount = ref(0);
const ignoreClickCount = ref(0);

const { draggingKey, vReorderContainer, vReorderItem, vReorderIgnore } = useReorder({
  keys,
  onReorder: ({ fromIndex, toIndex }) => {
    reorderCount.value += 1;
    const next = [...items.value];
    const [moved] = next.splice(fromIndex, 1);
    if (moved) next.splice(toIndex, 0, moved);
    items.value = next;
  },
  onDragStart: () => {
    dragStartCount.value += 1;
  },
  onDragEnd: () => {
    dragEndCount.value += 1;
  },
});

const onInteractiveClick = () => {
  interactiveClickCount.value += 1;
};

const onIgnoreClick = () => {
  ignoreClickCount.value += 1;
};
</script>

<template>
  <div class="reorder-story-harness">
    <dl class="reorder-story-harness__meta">
      <dt>order</dt>
      <dd data-testid="reorder-order">{{ keys.join(',') }}</dd>
      <dt>draggingKey</dt>
      <dd data-testid="reorder-dragging-key">{{ draggingKey ?? '' }}</dd>
      <dt>onDragStart</dt>
      <dd data-testid="reorder-drag-start-count">{{ dragStartCount }}</dd>
      <dt>onReorder</dt>
      <dd data-testid="reorder-reorder-count">{{ reorderCount }}</dd>
      <dt>onDragEnd</dt>
      <dd data-testid="reorder-drag-end-count">{{ dragEndCount }}</dd>
      <dt>interactive clicks</dt>
      <dd data-testid="reorder-interactive-click-count">{{ interactiveClickCount }}</dd>
      <dt>ignored clicks</dt>
      <dd data-testid="reorder-ignore-click-count">{{ ignoreClickCount }}</dd>
    </dl>

    <div class="reorder-story-harness__scroll-ancestor" data-testid="reorder-scroll-ancestor">
      <div class="reorder-story-harness__scroll-ancestor-spacer" aria-hidden="true" />
      <div
        v-reorder-container
        class="reorder-story-harness__container"
        data-testid="reorder-container"
      >
        <div
          v-for="item in items"
          :key="item.id"
          v-reorder-item="item.id"
          class="reorder-story-harness__item"
          :data-testid="`reorder-item-${item.id}`"
          :style="{ width: `${item.width}px`, height: `${item.height}px` }"
        >
          <span class="reorder-story-harness__item-label">{{ item.label }}</span>
          <button
            type="button"
            class="reorder-story-harness__interactive"
            data-testid="reorder-interactive-button"
            @click="onInteractiveClick"
          >
            action
          </button>
          <div
            v-reorder-ignore
            class="reorder-story-harness__ignore"
            data-testid="reorder-ignore-zone"
            @click="onIgnoreClick"
          >
            ignore
          </div>
          <div
            v-if="item.id === 'scrollable'"
            class="reorder-story-harness__nested-scroll"
            data-testid="reorder-nested-scroll"
          >
            <div class="reorder-story-harness__nested-scroll-content">
              nested scroll content line 1<br />
              nested scroll content line 2<br />
              nested scroll content line 3<br />
              nested scroll content line 4<br />
              nested scroll content line 5
            </div>
          </div>
        </div>
        <div class="reorder-story-harness__spacer" aria-hidden="true" />
      </div>
      <div class="reorder-story-harness__scroll-ancestor-spacer-bottom" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
/*
 * Story-local presentation only: this harness demonstrates the reorder library's public
 * contract and owns no part of the library's (nonexistent) production visual treatment.
 */
.reorder-story-harness {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-story-harness__meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 8px;
  margin: 0;
}

.reorder-story-harness__meta dt {
  font-weight: 600;
  color: #666;
}

.reorder-story-harness__meta dd {
  margin: 0;
  font-family: monospace;
}

.reorder-story-harness__scroll-ancestor {
  width: 420px;
  max-height: 360px;
  overflow: auto;
  border: 1px solid #ccc;
}

.reorder-story-harness__scroll-ancestor-spacer {
  height: 80px;
}

/*
 * Deliberately much taller than the top spacer so the container's own bottom edge does not
 * coincide with the ancestor's bottom edge, and the ancestor keeps ample scroll range left over
 * after the inner container's own autoscroll (used by autoscroll fallthrough coverage).
 */
.reorder-story-harness__scroll-ancestor-spacer-bottom {
  height: 400px;
}

.reorder-story-harness__container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  max-height: 280px;
  overflow: auto;
  border: 1px dashed #999;
}

.reorder-story-harness__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 6px;
  box-sizing: border-box;
  background: #eef2ff;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
}

.reorder-story-harness__item-label {
  font-weight: 600;
}

.reorder-story-harness__interactive {
  cursor: pointer;
}

.reorder-story-harness__ignore {
  padding: 2px 6px;
  background: #fef3c7;
  border: 1px dashed #d97706;
  cursor: default;
}

.reorder-story-harness__nested-scroll {
  width: 100%;
  max-height: 40px;
  overflow: auto;
  background: #fff;
  border: 1px solid #ddd;
}

.reorder-story-harness__nested-scroll-content {
  padding: 4px;
}

.reorder-story-harness__spacer {
  flex-basis: 100%;
  height: 120px;
}
</style>
