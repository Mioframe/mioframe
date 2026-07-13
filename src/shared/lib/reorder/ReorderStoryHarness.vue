<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { useReorder, type ReorderDragEndEvent } from '@shared/lib/reorder';

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
const containerClickCount = ref(0);
const clickControlClickCount = ref(0);
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
    dragEndCount.value += 1;
    lastDragEndPayload.value = JSON.stringify(event);
  },
});

const onContainerClick = () => {
  containerClickCount.value += 1;
};

const onClickControlClick = () => {
  clickControlClickCount.value += 1;
};

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
      <div>
        <dt>Current order</dt>
        <dd>
          <output aria-label="Current order">{{ keys.join(',') }}</output>
        </dd>
      </div>

      <div>
        <dt>Initial order</dt>
        <dd>
          <output aria-label="Initial order">{{ initialOrder }}</output>
        </dd>
      </div>

      <div>
        <dt>Dragging key</dt>
        <dd>
          <output aria-label="Dragging key">{{ draggingKey ?? '' }}</output>
        </dd>
      </div>

      <div>
        <dt>Drag start count</dt>
        <dd>
          <output aria-label="Drag start count">{{ dragStartCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Reorder count</dt>
        <dd>
          <output aria-label="Reorder count">{{ reorderCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Drag end count</dt>
        <dd>
          <output aria-label="Drag end count">{{ dragEndCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Last drag end</dt>
        <dd>
          <output aria-label="Last drag end">{{ lastDragEndPayload }}</output>
        </dd>
      </div>

      <div>
        <dt>Interactive click count</dt>
        <dd>
          <output aria-label="Interactive click count">{{ interactiveClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Ignored click count</dt>
        <dd>
          <output aria-label="Ignored click count">{{ ignoreClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Container click count</dt>
        <dd>
          <output aria-label="Container click count">{{ containerClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Click control click count</dt>
        <dd>
          <output aria-label="Click control click count">{{ clickControlClickCount }}</output>
        </dd>
      </div>
    </dl>

    <div class="reorder-story-harness__controls">
      <button type="button" @click="reverseOrderExternally">reverse order externally</button>
      <button type="button" @click="rotateOrderExternally">rotate order externally</button>
      <button type="button" @click="removeActiveKey">remove active key</button>
      <button type="button" @click="toggleContainerMounted">
        {{ containerMounted ? 'unmount' : 'remount' }} container
      </button>
      <button type="button" @click="toggleRejectNextReorder">
        {{ rejectNextReorder ? 'accepting' : 'reject' }} next reorder
      </button>
      <button type="button" @click="resetScrollAndOrder">reset scroll and order</button>
      <div
        role="button"
        tabindex="0"
        aria-label="Click control"
        class="reorder-story-harness__click-control"
        @click="onClickControlClick"
        @keydown.enter.prevent="onClickControlClick"
        @keydown.space.prevent
        @keyup.space.prevent="onClickControlClick"
      >
        click control (not reorderable)
      </div>
    </div>

    <div
      ref="scrollAncestorEl"
      role="region"
      aria-label="Reorder scroll ancestor"
      class="reorder-story-harness__scroll-ancestor"
    >
      <div class="reorder-story-harness__scroll-ancestor-spacer" aria-hidden="true" />
      <div
        v-if="containerMounted"
        ref="containerEl"
        v-reorder-container
        role="list"
        aria-label="Reorder items"
        class="reorder-story-harness__container"
        @click="onContainerClick"
      >
        <div
          v-for="item in items"
          :key="item.id"
          v-reorder-item="item.id"
          role="listitem"
          :aria-label="item.label"
          class="reorder-story-harness__item"
          :style="{ width: `${item.width}px`, height: `${item.height}px` }"
        >
          <span class="reorder-story-harness__item-label">{{ item.label }}</span>
          <button
            type="button"
            class="reorder-story-harness__interactive"
            :aria-label="`${item.label} action`"
            @click="onInteractiveClick"
          >
            action
          </button>
          <div
            v-reorder-ignore
            role="button"
            tabindex="0"
            :aria-label="`${item.label} ignore zone`"
            class="reorder-story-harness__ignore"
            @click="onIgnoreClick"
            @keydown.enter.prevent="onIgnoreClick"
            @keydown.space.prevent
            @keyup.space.prevent="onIgnoreClick"
          >
            ignore
          </div>
          <div
            v-if="item.id === 'scrollable'"
            role="region"
            aria-label="Reorder nested scroll"
            class="reorder-story-harness__nested-scroll"
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
      <p
        v-else
        role="status"
        aria-label="container unmounted"
        class="reorder-story-harness__unmounted"
      >
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px 16px;
  margin: 0;
}

.reorder-story-harness__meta > div {
  min-width: 0;
}

.reorder-story-harness__meta dt {
  font-weight: 600;
}

.reorder-story-harness__meta dd {
  margin: 2px 0 0;
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
  cursor: pointer;
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
