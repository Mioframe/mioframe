<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import type { CSSProperties } from 'vue';
import { useVirtualAxis } from './useVirtualAxis';
import type { VirtualAxisItem } from './useVirtualAxis';

/**
 * Deterministic Storybook browser-proof fixture composing two independent `useVirtualAxis`
 * instances (vertical rows, horizontal columns) against one shared scroll root. Not a
 * production component: the shared library owns no grid/table primitive, this fixture only
 * proves the two-axis-one-root composition contract described in `docs/database-virtualization.md`.
 */
const props = withDefaults(
  defineProps<{
    rowCount?: number;
    colCount?: number;
  }>(),
  {
    rowCount: 300,
    colCount: 60,
  },
);

const ROW_BASE_HEIGHT_PX = 32;
const COL_BASE_WIDTH_PX = 80;
const VIEWPORT_WIDTH_PX = 480;
const VIEWPORT_HEIGHT_PX = 340;

const scrollElRef = useTemplateRef<HTMLElement>('scrollEl');

const rowGrowth = ref<Record<number, number>>({});
const colGrowth = ref<Record<number, number>>({});

const growRowInput = ref(0);
function growRow(): void {
  const index = growRowInput.value;
  rowGrowth.value = { ...rowGrowth.value, [index]: (rowGrowth.value[index] ?? 0) + 1 };
}

const growColInput = ref(0);
function growCol(): void {
  const index = growColInput.value;
  colGrowth.value = { ...colGrowth.value, [index]: (colGrowth.value[index] ?? 0) + 1 };
}

function rowLabel(index: number): string {
  const lines = 1 + (rowGrowth.value[index] ?? 0);
  return Array.from({ length: lines }, (_, lineIndex) => `Row ${index} line ${lineIndex + 1}`).join(
    '\n',
  );
}

function colLabel(index: number): string {
  const extra = colGrowth.value[index] ?? 0;
  return `Col ${index}${'x'.repeat(extra * 8)}`;
}

const verticalAxis = useVirtualAxis({
  count: () => props.rowCount,
  getItemKey: (index) => index,
  getScrollElement: () => scrollElRef.value,
  orientation: 'vertical',
  estimateSize: () => ROW_BASE_HEIGHT_PX,
  overscan: 4,
});

const horizontalAxis = useVirtualAxis({
  count: () => props.colCount,
  getItemKey: (index) => index,
  getScrollElement: () => scrollElRef.value,
  orientation: 'horizontal',
  estimateSize: () => COL_BASE_WIDTH_PX,
  overscan: 4,
});

const columnSpacers = computed(() => {
  const cols = horizontalAxis.virtualItems.value;
  const first = cols[0];
  const last = cols[cols.length - 1];
  return {
    left: first?.start ?? 0,
    right: last ? horizontalAxis.totalSize.value - last.end : horizontalAxis.totalSize.value,
  };
});

function cellsRowStyle(): CSSProperties {
  return { display: 'flex', flexDirection: 'row' };
}

function spacerStyle(width: number): CSSProperties {
  return { flex: 'none', width: `${width}px` };
}

function bodyCellStyle(col: VirtualAxisItem<number>): CSSProperties {
  return { flex: 'none', width: `${col.size}px`, boxSizing: 'border-box', padding: '2px 4px' };
}

const viewportStyle: CSSProperties = {
  overflow: 'auto',
  position: 'relative',
  width: `${VIEWPORT_WIDTH_PX}px`,
  height: `${VIEWPORT_HEIGHT_PX}px`,
};

const headerStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  flexDirection: 'row',
  position: 'sticky',
  top: '0px',
  zIndex: 1,
  background: 'var(--md-sys-color-surface-container, #f3edf7)',
}));

const headerCellStyle: CSSProperties = {
  flex: 'none',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  padding: '2px 4px',
};

const railStyle = computed<CSSProperties>(() => ({
  position: 'relative',
  height: `${verticalAxis.totalSize.value}px`,
  width: `${horizontalAxis.totalSize.value}px`,
}));

function rowStyle(start: number): CSSProperties {
  return {
    position: 'absolute',
    top: '0px',
    left: '0px',
    width: '100%',
    transform: `translateY(${start}px)`,
  };
}
</script>

<template>
  <div class="virtual-axis-grid-fixture">
    <div class="virtual-axis-grid-fixture__controls">
      <label>
        Grow row
        <input
          v-model.number="growRowInput"
          type="number"
          min="0"
          :max="rowCount - 1"
          data-testid="virtual-axis-grid-grow-row-index"
        />
      </label>
      <button type="button" data-testid="virtual-axis-grid-grow-row-button" @click="growRow">
        Grow row
      </button>
      <label>
        Grow column
        <input
          v-model.number="growColInput"
          type="number"
          min="0"
          :max="colCount - 1"
          data-testid="virtual-axis-grid-grow-col-index"
        />
      </label>
      <button type="button" data-testid="virtual-axis-grid-grow-col-button" @click="growCol">
        Grow column
      </button>
    </div>

    <div
      ref="scrollEl"
      class="virtual-axis-grid-fixture__viewport"
      data-testid="virtual-axis-grid-viewport"
      :style="viewportStyle"
    >
      <div
        class="virtual-axis-grid-fixture__header"
        data-testid="virtual-axis-grid-header"
        :style="headerStyle"
      >
        <div :style="spacerStyle(columnSpacers.left)" />
        <div
          v-for="col in horizontalAxis.virtualItems.value"
          :key="col.key"
          :ref="(el) => horizontalAxis.measureElement(col.index, el as HTMLElement | null)"
          class="virtual-axis-grid-fixture__header-cell"
          :data-testid="`virtual-axis-grid-header-cell-${col.key}`"
          :style="headerCellStyle"
        >
          {{ colLabel(col.key) }}
        </div>
        <div :style="spacerStyle(columnSpacers.right)" />
      </div>

      <div class="virtual-axis-grid-fixture__rail" :style="railStyle">
        <div
          v-for="row in verticalAxis.virtualItems.value"
          :key="row.key"
          :ref="(el) => verticalAxis.measureElement(row.index, el as HTMLElement | null)"
          class="virtual-axis-grid-fixture__row"
          :data-testid="`virtual-axis-grid-row-${row.key}`"
          :data-row-index="row.index"
          :style="rowStyle(row.start)"
        >
          <pre class="virtual-axis-grid-fixture__row-label">{{ rowLabel(row.key) }}</pre>
          <div :style="cellsRowStyle()">
            <div :style="spacerStyle(columnSpacers.left)" />
            <div
              v-for="col in horizontalAxis.virtualItems.value"
              :key="col.key"
              class="virtual-axis-grid-fixture__cell"
              :data-testid="`virtual-axis-grid-cell-${row.key}-${col.key}`"
              :style="bodyCellStyle(col)"
            >
              R{{ row.key }}C{{ col.key }}
            </div>
            <div :style="spacerStyle(columnSpacers.right)" />
          </div>
        </div>
      </div>
    </div>

    <output data-testid="virtual-axis-grid-mounted-rows">{{
      verticalAxis.virtualItems.value.length
    }}</output>
    <output data-testid="virtual-axis-grid-mounted-cols">{{
      horizontalAxis.virtualItems.value.length
    }}</output>
  </div>
</template>

<style lang="css" scoped>
.virtual-axis-grid-fixture {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__row-label {
    margin: 0;
    padding: 2px 4px;
    box-sizing: border-box;
  }
}
</style>
