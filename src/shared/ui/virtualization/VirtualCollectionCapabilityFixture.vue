<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import type { CSSProperties } from 'vue';
import { useVirtualCollection } from './useVirtualCollection';
import type { VirtualCollectionAxis } from './useVirtualCollection';

/**
 * Deterministic Storybook browser-proof fixture for one `useVirtualCollection` instance. Not a
 * production component: it exists only to exercise the composable's real-browser bounded
 * rendering, dynamic measurement, stable-key remapping, non-zero surface offset, valid
 * `undefined` source values, and deep-scroll geometry contracts using ordinary consumer-owned
 * `<ul>/<li>` markup and the returned measurement directive.
 *
 * Test assertions must read the public `item.size`/`item.offset`/`leadingSize`/`trailingSize`/
 * `totalSize` outputs below rather than only physical `boundingBox()`, so a test fails if DOM
 * content changes while virtual measurement stays stale.
 */
const props = withDefaults(
  defineProps<{
    axis?: VirtualCollectionAxis;
    itemCount?: number;
    /** Physical distance, inside the scroll root, before the collection surface begins. */
    surfaceOffset?: number;
    /** Id that should map to a valid `undefined` source value instead of its own id. */
    undefinedValueAt?: number;
  }>(),
  {
    axis: 'vertical',
    itemCount: 10000,
    surfaceOffset: 0,
  },
);

const VIEWPORT_MAIN_SIZE_PX = 400;
const VIEWPORT_CROSS_SIZE_PX = 240;
const BASE_ITEM_SIZE_PX = 40;

const isHorizontal = computed(() => props.axis === 'horizontal');
const hasSurfaceOffset = computed(() => props.surfaceOffset > 0);

/** One logical source value: an id, or a deliberately valid `undefined` for one chosen id. */
type ItemValue = number | undefined;

// eslint-disable-next-line vue/no-setup-props-reactivity-loss -- one-shot initial-order seed; each story mounts a fresh instance, itemCount is not meant to reactively resize the order array afterward
const order = ref<number[]>(Array.from({ length: props.itemCount }, (_, index) => index));
const growth = ref<Record<number, number>>({});

const source = computed<ItemValue[]>(() =>
  order.value.map((id) => (id === props.undefinedValueAt ? undefined : id)),
);

function idAt(index: number): number {
  const id = order.value[index];
  if (id === undefined) {
    throw new RangeError(`fixture: no id at index ${index}`);
  }
  return id;
}

function toggleReversed(): void {
  order.value = [...order.value].reverse();
}

const indexInput = ref(0);

function growByIndex(): void {
  const id = order.value[indexInput.value];
  if (id === undefined) return;
  growth.value = { ...growth.value, [id]: (growth.value[id] ?? 0) + 1 };
}

function shrinkByIndex(): void {
  const id = order.value[indexInput.value];
  if (id === undefined) return;
  const current = growth.value[id] ?? 0;
  if (current <= 0) return;
  growth.value = { ...growth.value, [id]: current - 1 };
}

function itemContent(value: ItemValue): string {
  if (value === undefined) {
    return isHorizontal.value ? 'Item undefined' : 'Item undefined line 1';
  }
  const extra = growth.value[value] ?? 0;
  if (isHorizontal.value) {
    return `Item ${value} ${'x'.repeat(extra * 12)}`;
  }
  const lines = 1 + extra;
  return Array.from(
    { length: lines },
    (_, lineIndex) => `Item ${value} line ${lineIndex + 1}`,
  ).join('\n');
}

const scrollElRef = useTemplateRef<HTMLElement>('scrollEl');

const scrollToIndexInput = ref(0);
function scrollNearIndex(): void {
  const el = scrollElRef.value;
  if (!el) return;
  const target = scrollToIndexInput.value * BASE_ITEM_SIZE_PX;
  if (isHorizontal.value) {
    el.scrollLeft = target;
  } else {
    el.scrollTop = target;
  }
}

function scrollToEnd(): void {
  const el = scrollElRef.value;
  if (!el) return;
  if (isHorizontal.value) {
    el.scrollLeft = Number.MAX_SAFE_INTEGER;
  } else {
    el.scrollTop = Number.MAX_SAFE_INTEGER;
  }
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss -- useVirtualCollection's own contract documents axis as a plain (non-MaybeRefOrGetter) value that is not meant to react to later prop changes
const axis = props.axis;

const collection = useVirtualCollection(source, {
  root: () => scrollElRef.value,
  key: (_value, index) => idAt(index),
  estimateSize: BASE_ITEM_SIZE_PX,
  axis,
  overscan: 4,
  surfaceOffset: () => props.surfaceOffset,
});

const vMeasure = collection.measure;

const viewportStyle = computed<CSSProperties>(() => ({
  overflow: 'auto',
  position: 'relative',
  width: isHorizontal.value ? `${VIEWPORT_MAIN_SIZE_PX}px` : `${VIEWPORT_CROSS_SIZE_PX}px`,
  height: isHorizontal.value ? `${VIEWPORT_CROSS_SIZE_PX}px` : `${VIEWPORT_MAIN_SIZE_PX}px`,
}));

const surfaceContainerStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  flexDirection: isHorizontal.value ? 'row' : 'column',
}));

const preSurfaceStyle = computed<CSSProperties>(() =>
  isHorizontal.value
    ? { flex: 'none', width: `${props.surfaceOffset}px` }
    : { flex: 'none', height: `${props.surfaceOffset}px` },
);

const listStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  flexDirection: isHorizontal.value ? 'row' : 'column',
  margin: '0',
  padding: '0',
  listStyle: 'none',
}));

const itemStyle = computed<CSSProperties>(() =>
  isHorizontal.value ? { flex: 'none', whiteSpace: 'nowrap' } : { flex: 'none' },
);

function spacerStyle(size: number): CSSProperties {
  return isHorizontal.value
    ? { flex: 'none', width: `${size}px` }
    : { flex: 'none', height: `${size}px` };
}
</script>

<template>
  <div class="virtual-collection-capability-fixture">
    <div class="virtual-collection-capability-fixture__controls">
      <button type="button" data-testid="vcc-toggle-reverse" @click="toggleReversed">
        Reverse order
      </button>
      <label>
        Index
        <input
          v-model.number="indexInput"
          type="number"
          min="0"
          :max="order.length - 1"
          data-testid="vcc-index-input"
        />
      </label>
      <button type="button" data-testid="vcc-grow-button" @click="growByIndex">Grow item</button>
      <button type="button" data-testid="vcc-shrink-button" @click="shrinkByIndex">
        Shrink item
      </button>
      <label>
        Scroll near index
        <input
          v-model.number="scrollToIndexInput"
          type="number"
          min="0"
          :max="order.length - 1"
          data-testid="vcc-scrollto-index-input"
        />
      </label>
      <button type="button" data-testid="vcc-scrollto-index-button" @click="scrollNearIndex">
        Scroll near index
      </button>
      <button type="button" data-testid="vcc-scrollto-end-button" @click="scrollToEnd">
        Scroll to end
      </button>
    </div>

    <div
      ref="scrollEl"
      class="virtual-collection-capability-fixture__viewport"
      data-testid="vcc-viewport"
      :style="viewportStyle"
    >
      <div class="virtual-collection-capability-fixture__surface" :style="surfaceContainerStyle">
        <div
          v-if="hasSurfaceOffset"
          class="virtual-collection-capability-fixture__pre-surface"
          data-testid="vcc-pre-surface"
          :style="preSurfaceStyle"
        />
        <ul class="virtual-collection-capability-fixture__list" :style="listStyle">
          <li
            class="virtual-collection-capability-fixture__spacer"
            data-testid="vcc-leading-spacer"
            :style="spacerStyle(collection.leadingSize.value)"
          />
          <li
            v-for="item in collection.items.value"
            :key="item.key"
            v-measure="item"
            class="virtual-collection-capability-fixture__item"
            :data-testid="`vcc-item-${item.key}`"
            :data-item-index="item.index"
            :data-item-size="item.size"
            :data-item-offset="item.offset"
            :style="itemStyle"
          >
            <pre>{{ itemContent(item.value) }}</pre>
          </li>
          <li
            class="virtual-collection-capability-fixture__spacer"
            data-testid="vcc-trailing-spacer"
            :style="spacerStyle(collection.trailingSize.value)"
          />
        </ul>
      </div>
    </div>

    <output data-testid="vcc-mounted-count">{{ collection.items.value.length }}</output>
    <output data-testid="vcc-leading-size">{{ collection.leadingSize.value }}</output>
    <output data-testid="vcc-trailing-size">{{ collection.trailingSize.value }}</output>
    <output data-testid="vcc-total-size">{{ collection.totalSize.value }}</output>
  </div>
</template>

<style lang="css" scoped>
.virtual-collection-capability-fixture {
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
