<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import type { CSSProperties } from 'vue';
import { useVirtualAxis } from './useVirtualAxis';
import type { VirtualAxisAlign, VirtualAxisOrientation } from './useVirtualAxis';

/**
 * Deterministic Storybook browser-proof fixture for one `useVirtualAxis` instance. Not a
 * production component: it exists only to exercise the adapter's real-browser dynamic
 * measurement, remapping, deep navigation, and scroll-margin/padding contracts.
 */
const props = withDefaults(
  defineProps<{
    orientation?: VirtualAxisOrientation;
    itemCount?: number;
  }>(),
  {
    orientation: 'vertical',
    itemCount: 10000,
  },
);

const VIEWPORT_SIZE_PX = 400;
const VIEWPORT_CROSS_SIZE_PX = 240;
const BASE_ITEM_SIZE_PX = 40;
const SCROLL_MARGIN_PX = 96;
const SCROLL_PADDING_START_PX = 48;
const SCROLL_PADDING_END_PX = 48;

const isHorizontal = computed(() => props.orientation === 'horizontal');

// eslint-disable-next-line vue/no-setup-props-reactivity-loss -- one-shot initial-order seed; each story mounts a fresh instance, itemCount is not meant to reactively resize the order array afterward
const order = ref<number[]>(Array.from({ length: props.itemCount }, (_, index) => index));
const growth = ref<Record<number, number>>({});

function toggleReversed(): void {
  order.value = [...order.value].reverse();
}

const growIndexInput = ref(0);
function growByIndex(): void {
  const id = order.value[growIndexInput.value];
  if (id === undefined) return;
  growth.value = { ...growth.value, [id]: (growth.value[id] ?? 0) + 1 };
}

function itemContent(id: number): string {
  const extra = growth.value[id] ?? 0;
  if (isHorizontal.value) {
    return `Item ${id} ${'x'.repeat(extra * 12)}`;
  }
  const lines = (id % 3) + 1 + extra;
  return Array.from({ length: lines }, (_, lineIndex) => `Item ${id} line ${lineIndex + 1}`).join(
    '\n',
  );
}

const scrollElRef = useTemplateRef<HTMLElement>('scrollEl');

// eslint-disable-next-line vue/no-setup-props-reactivity-loss -- useVirtualAxis's own contract documents `orientation` as not required to be reactive
const axis = useVirtualAxis({
  count: () => order.value.length,
  getItemKey: (index) => {
    const key = order.value[index];
    if (key === undefined) {
      throw new RangeError(`VirtualAxisListFixture: no order entry at index ${index}`);
    }
    return key;
  },
  getScrollElement: () => scrollElRef.value,
  orientation: props.orientation,
  estimateSize: () => BASE_ITEM_SIZE_PX,
  overscan: 4,
  scrollMargin: SCROLL_MARGIN_PX,
  scrollPaddingStart: SCROLL_PADDING_START_PX,
  scrollPaddingEnd: SCROLL_PADDING_END_PX,
});

const scrollToIndexInput = ref(0);
const scrollAlign = ref<VirtualAxisAlign>('auto');
function scrollToTarget(): void {
  axis.scrollToIndex(scrollToIndexInput.value, { align: scrollAlign.value });
}

const viewportStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? {
        display: 'flex',
        flexDirection: 'row',
        overflow: 'auto',
        position: 'relative',
        width: `${VIEWPORT_SIZE_PX}px`,
        height: `${VIEWPORT_CROSS_SIZE_PX}px`,
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        position: 'relative',
        width: `${VIEWPORT_CROSS_SIZE_PX}px`,
        height: `${VIEWPORT_SIZE_PX}px`,
      },
);

// The sticky wrapper reserves zero flow space so it never shifts the rail's real DOM position
// away from what `scrollMargin` told the axis to expect; only the inner bar renders the actual
// occlusion size, anchored to the zero-height sticky wrapper once it is pinned.
const paddingStartStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? { position: 'sticky', left: '0px', width: '0px', height: '100%', flex: 'none', zIndex: 1 }
    : { position: 'sticky', top: '0px', height: '0px', width: '100%', flex: 'none', zIndex: 1 },
);

const paddingStartBarStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: `${SCROLL_PADDING_START_PX}px`,
        height: '100%',
        background: 'var(--md-sys-color-secondary-container, #e8def8)',
      }
    : {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100%',
        height: `${SCROLL_PADDING_START_PX}px`,
        background: 'var(--md-sys-color-secondary-container, #e8def8)',
      },
);

const paddingEndStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? { position: 'sticky', right: '0px', width: '0px', height: '100%', flex: 'none', zIndex: 1 }
    : { position: 'sticky', bottom: '0px', height: '0px', width: '100%', flex: 'none', zIndex: 1 },
);

const paddingEndBarStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? {
        position: 'absolute',
        top: '0px',
        right: '0px',
        width: `${SCROLL_PADDING_END_PX}px`,
        height: '100%',
        background: 'var(--md-sys-color-secondary-container, #e8def8)',
      }
    : {
        position: 'absolute',
        bottom: '0px',
        left: '0px',
        width: '100%',
        height: `${SCROLL_PADDING_END_PX}px`,
        background: 'var(--md-sys-color-secondary-container, #e8def8)',
      },
);

const leadStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? { flex: 'none', width: `${SCROLL_MARGIN_PX}px` }
    : { flex: 'none', height: `${SCROLL_MARGIN_PX}px` },
);

const railStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? { position: 'relative', flex: 'none', width: `${axis.totalSize.value}px`, height: '100%' }
    : { position: 'relative', flex: 'none', height: `${axis.totalSize.value}px`, width: '100%' },
);

function itemStyle(start: number): CSSProperties {
  return isHorizontal.value
    ? {
        position: 'absolute',
        top: '0px',
        left: '0px',
        height: '100%',
        whiteSpace: 'nowrap',
        transform: `translateX(${start - SCROLL_MARGIN_PX}px)`,
      }
    : {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100%',
        transform: `translateY(${start - SCROLL_MARGIN_PX}px)`,
      };
}
</script>

<template>
  <div class="virtual-axis-list-fixture">
    <div class="virtual-axis-list-fixture__controls">
      <button type="button" data-testid="virtual-axis-list-toggle-reverse" @click="toggleReversed">
        Reverse order
      </button>
      <label>
        Grow index
        <input
          v-model.number="growIndexInput"
          type="number"
          min="0"
          :max="order.length - 1"
          data-testid="virtual-axis-list-grow-index"
        />
      </label>
      <button type="button" data-testid="virtual-axis-list-grow-button" @click="growByIndex">
        Grow item
      </button>
      <label>
        Scroll to index
        <input
          v-model.number="scrollToIndexInput"
          type="number"
          min="0"
          :max="order.length - 1"
          data-testid="virtual-axis-list-scrollto-index"
        />
      </label>
      <select v-model="scrollAlign" data-testid="virtual-axis-list-scrollto-align">
        <option value="auto">auto</option>
        <option value="start">start</option>
        <option value="center">center</option>
        <option value="end">end</option>
      </select>
      <button type="button" data-testid="virtual-axis-list-scrollto-button" @click="scrollToTarget">
        Scroll to index
      </button>
    </div>

    <div
      ref="scrollEl"
      class="virtual-axis-list-fixture__viewport"
      data-testid="virtual-axis-list-viewport"
      :style="viewportStyle"
    >
      <div class="virtual-axis-list-fixture__padding-start" :style="paddingStartStyle">
        <div data-testid="virtual-axis-list-padding-start" :style="paddingStartBarStyle">
          Sticky start
        </div>
      </div>
      <div
        class="virtual-axis-list-fixture__lead"
        data-testid="virtual-axis-list-lead"
        :style="leadStyle"
      >
        Lead content before the virtual surface
      </div>
      <div class="virtual-axis-list-fixture__rail" :style="railStyle">
        <div
          v-for="item in axis.virtualItems.value"
          :key="item.key"
          :ref="(el) => axis.measureElement(item.index, el as HTMLElement | null)"
          class="virtual-axis-list-fixture__item"
          :data-testid="`virtual-axis-list-item-${item.key}`"
          :data-item-index="item.index"
          :style="itemStyle(item.start)"
        >
          <pre>{{ itemContent(item.key) }}</pre>
        </div>
      </div>
      <div class="virtual-axis-list-fixture__padding-end" :style="paddingEndStyle">
        <div data-testid="virtual-axis-list-padding-end" :style="paddingEndBarStyle">
          Sticky end
        </div>
      </div>
    </div>

    <output data-testid="virtual-axis-list-mounted-count">{{
      axis.virtualItems.value.length
    }}</output>
  </div>
</template>

<style lang="css" scoped>
.virtual-axis-list-fixture {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__item pre {
    margin: 0;
    padding: 4px 8px;
    box-sizing: border-box;
  }
}
</style>
