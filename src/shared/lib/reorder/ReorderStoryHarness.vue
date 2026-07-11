<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { useReorder, type ReorderDragEndEvent } from '@shared/lib/reorder';

/**
 * Test-fixture-only synchronous observability, read by Playwright: production `useReorder`
 * consumers never see this. It exists because the Vue-rendered `reorder-last-drag-end` text used
 * previously is observed by a `MutationObserver`, whose own scheduling can lag the library's real
 * synchronous `onDragEnd` call under heavy same-frame work — this log is written from directly
 * inside that synchronous callback instead, so a Playwright spec can use it as the authoritative
 * cancellation timestamp. Playwright initializes `window.testReorderHarnessEvents` before the
 * story loads; the harness only ever pushes to it when present.
 */
interface ReorderHarnessEvent {
  type: 'drag-end';
  cancelled: boolean;
  timeMs: number;
  scrollTop: number | null;
  order: string[];
}

declare global {
  interface Window {
    testReorderHarnessEvents?: ReorderHarnessEvent[];
  }
}

interface HarnessItem {
  id: string;
  label: string;
  width: number;
  height: number;
}

const initialItems: readonly HarnessItem[] = [
  { id: 'alpha', label: 'Alpha', width: 120, height: 60 },
  { id: 'bravo', label: 'Bravo', width: 200, height: 100 },
  { id: 'charlie', label: 'Charlie', width: 80, height: 140 },
  { id: 'delta', label: 'Delta', width: 160, height: 60 },
  { id: 'scrollable', label: 'Scrollable', width: 160, height: 100 },
  { id: 'echo', label: 'Echo', width: 100, height: 80 },
  { id: 'foxtrot', label: 'Foxtrot', width: 140, height: 60 },
  { id: 'golf', label: 'Golf', width: 120, height: 120 },
];
const initialOrder = initialItems.map((item) => item.id).join(',');

const items = ref<HarnessItem[]>([...initialItems]);
const keys = computed(() => items.value.map((item) => item.id));

const containerMounted = ref(true);
const containerEl = useTemplateRef<HTMLElement>('containerEl');
const scrollAncestorEl = useTemplateRef<HTMLElement>('scrollAncestorEl');

const dragStartCount = ref(0);
const reorderCount = ref(0);
const dragEndCount = ref(0);
const interactiveClickCount = ref(0);
const ignoreClickCount = ref(0);
const lastDragEndPayload = ref('');
const rejectNextReorder = ref(false);

const { draggingKey, vReorderContainer, vReorderItem, vReorderIgnore } = useReorder({
  keys,
  onReorder: ({ fromIndex, toIndex }) => {
    reorderCount.value += 1;

    if (rejectNextReorder.value) {
      // Simulates a consumer that declines a requested move: the controlled order is
      // deliberately left unchanged.
      rejectNextReorder.value = false;
      return;
    }

    const next = [...items.value];
    const [moved] = next.splice(fromIndex, 1);
    if (moved) next.splice(toIndex, 0, moved);
    items.value = next;
  },
  onDragStart: () => {
    dragStartCount.value += 1;
  },
  onDragEnd: (event: ReorderDragEndEvent<string>) => {
    // Recorded synchronously, before the counters below, so it reflects the real callback timing.
    window.testReorderHarnessEvents?.push({
      type: 'drag-end',
      cancelled: event.cancelled,
      timeMs: performance.now(),
      scrollTop: containerEl.value?.scrollTop ?? null,
      order: [...keys.value],
    });
    dragEndCount.value += 1;
    lastDragEndPayload.value = JSON.stringify(event);
  },
});

const onInteractiveClick = () => {
  interactiveClickCount.value += 1;
};

const onIgnoreClick = () => {
  ignoreClickCount.value += 1;
};

/** Reverses the controlled order without going through the library's own `onReorder` request. */
const reverseOrderExternally = () => {
  items.value = [...items.value].reverse();
};

/** Rotates the controlled order by one, another external (not library-requested) change. */
const rotateOrderExternally = () => {
  const next = [...items.value];
  const first = next.shift();
  if (first) next.push(first);
  items.value = next;
};

/** Removes whichever item is currently dragging, if any. */
const removeActiveKey = () => {
  if (!draggingKey.value) return;
  items.value = items.value.filter((item) => item.id !== draggingKey.value);
};

const toggleContainerMounted = () => {
  containerMounted.value = !containerMounted.value;
};

const toggleRejectNextReorder = () => {
  rejectNextReorder.value = !rejectNextReorder.value;
};

const resetScrollAndOrder = () => {
  items.value = [...initialItems];
  containerMounted.value = true;
  rejectNextReorder.value = false;
  if (containerEl.value) containerEl.value.scrollTo({ left: 0, top: 0 });
  if (scrollAncestorEl.value) scrollAncestorEl.value.scrollTo({ left: 0, top: 0 });
};
</script>

<template>
  <div class="reorder-story-harness">
    <dl class="reorder-story-harness__meta">
      <dt>order</dt>
      <dd data-testid="reorder-order">{{ keys.join(',') }}</dd>
      <dt>initialOrder</dt>
      <dd data-testid="reorder-initial-order">{{ initialOrder }}</dd>
      <dt>draggingKey</dt>
      <dd data-testid="reorder-dragging-key">{{ draggingKey ?? '' }}</dd>
      <dt>onDragStart</dt>
      <dd data-testid="reorder-drag-start-count">{{ dragStartCount }}</dd>
      <dt>onReorder</dt>
      <dd data-testid="reorder-reorder-count">{{ reorderCount }}</dd>
      <dt>onDragEnd</dt>
      <dd data-testid="reorder-drag-end-count">{{ dragEndCount }}</dd>
      <dt>lastDragEnd</dt>
      <dd data-testid="reorder-last-drag-end">{{ lastDragEndPayload }}</dd>
      <dt>interactive clicks</dt>
      <dd data-testid="reorder-interactive-click-count">{{ interactiveClickCount }}</dd>
      <dt>ignored clicks</dt>
      <dd data-testid="reorder-ignore-click-count">{{ ignoreClickCount }}</dd>
    </dl>

    <div class="reorder-story-harness__controls">
      <button
        type="button"
        data-testid="reorder-control-reverse-order"
        @click="reverseOrderExternally"
      >
        reverse order externally
      </button>
      <button
        type="button"
        data-testid="reorder-control-rotate-order"
        @click="rotateOrderExternally"
      >
        rotate order externally
      </button>
      <button type="button" data-testid="reorder-control-remove-active" @click="removeActiveKey">
        remove active key
      </button>
      <button
        type="button"
        data-testid="reorder-control-toggle-container"
        @click="toggleContainerMounted"
      >
        {{ containerMounted ? 'unmount' : 'remount' }} container
      </button>
      <button
        type="button"
        data-testid="reorder-control-reject-next-reorder"
        @click="toggleRejectNextReorder"
      >
        {{ rejectNextReorder ? 'accepting' : 'reject' }} next reorder
      </button>
      <button type="button" data-testid="reorder-control-reset" @click="resetScrollAndOrder">
        reset scroll and order
      </button>
      <div class="reorder-story-harness__click-control" data-testid="reorder-click-control">
        click control (not reorderable)
      </div>
    </div>

    <div
      ref="scrollAncestorEl"
      class="reorder-story-harness__scroll-ancestor"
      data-testid="reorder-scroll-ancestor"
    >
      <div class="reorder-story-harness__scroll-ancestor-spacer" aria-hidden="true" />
      <div
        v-if="containerMounted"
        ref="containerEl"
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
      <p v-else data-testid="reorder-container-unmounted" class="reorder-story-harness__unmounted">
        container unmounted
      </p>
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
  word-break: break-all;
}

.reorder-story-harness__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.reorder-story-harness__click-control {
  display: flex;
  align-items: center;
  justify-content: center;
  /* Matches the "alpha" item's own dimensions (120x60): the click-suppression Playwright spec
     drives an identically-shaped gesture on both surfaces to prove equivalent click-producing
     geometry. */
  width: 120px;
  height: 60px;
  padding: 6px;
  box-sizing: border-box;
  background: #f3f4f6;
  border: 1px solid #9ca3af;
  border-radius: 4px;
  text-align: center;
}

/*
 * Taller than the top spacer (80px) plus the container's own rendered height (280px) by a margin
 * clearly larger than the autoscroll edge zone (56px): at rest, the container's own bottom edge
 * must sit well outside the ancestor's own bottom edge, so a pointer parked at the container's
 * edge (draining only the container) does not also fall inside the ancestor's own edge zone and
 * drain it in the same stationary-pointer window. Autoscroll fallthrough coverage relies on this
 * separation to observe the container-only and ancestor-only phases distinctly.
 */
.reorder-story-harness__scroll-ancestor {
  width: 420px;
  max-height: 460px;
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

.reorder-story-harness__unmounted {
  margin: 0;
  padding: 8px;
  font-style: italic;
  color: #666;
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
