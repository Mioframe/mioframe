<script setup lang="ts">
import { useVirtualAxis } from '@shared/ui/virtualization';
import type { VirtualAxisItem } from '@shared/ui/virtualization';
import { computed, ref, useTemplateRef } from 'vue';
import type { CSSProperties } from 'vue';

/**
 * Deterministic Storybook browser-proof fixture for the native-table-first database DOM
 * model described in `docs/database-virtualization.md`. Not production UI: it uses only
 * synthetic rows/properties through the real shared `useVirtualAxis` adapter, with no
 * worker, service, persistence, editor, relation, or toolbar behavior.
 */
const props = withDefaults(
  defineProps<{
    rowCount?: number;
    colCount?: number;
  }>(),
  {
    rowCount: 5000,
    colCount: 40,
  },
);

const ROW_BASE_HEIGHT_PX = 28;
const COL_BASE_WIDTH_PX = 96;
const viewportWidthPx = '520px';
const viewportHeightPx = '360px';

const scrollElRef = useTemplateRef<HTMLElement>('scrollEl');

const rowGrowth = ref<Record<number, number>>({});
const bodyCellGrowth = ref<Record<number, number>>({});

const growRowInput = ref(0);
function growRow(): void {
  const index = growRowInput.value;
  rowGrowth.value = { ...rowGrowth.value, [index]: (rowGrowth.value[index] ?? 0) + 1 };
}

const growColInput = ref(0);
function growCol(): void {
  const index = growColInput.value;
  bodyCellGrowth.value = {
    ...bodyCellGrowth.value,
    [index]: (bodyCellGrowth.value[index] ?? 0) + 1,
  };
}

function rowLabel(index: number): string {
  const lines = 1 + (rowGrowth.value[index] ?? 0);
  return Array.from({ length: lines }, (_, lineIndex) => `Row ${index} line ${lineIndex + 1}`).join(
    '\n',
  );
}

function bodyCellContent(rowIndex: number, colIndex: number): string {
  const extra = bodyCellGrowth.value[colIndex] ?? 0;
  return `R${rowIndex}C${colIndex}${'w'.repeat(extra * 10)}`;
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

const rowSpacers = computed(() => {
  const rows = verticalAxis.virtualItems.value;
  const first = rows[0];
  const last = rows[rows.length - 1];
  return {
    top: first?.start ?? 0,
    bottom: last ? verticalAxis.totalSize.value - last.end : verticalAxis.totalSize.value,
  };
});

const totalColumns = computed(() => horizontalAxis.virtualItems.value.length + 2);

function columnMinWidthStyle(col: VirtualAxisItem<number>): CSSProperties {
  // The remount minimum uses the axis's own last-measured/cached size for this stable key so
  // ordinary scrolling never shrinks a column below its already-known width.
  return { minWidth: `${col.size}px` };
}
</script>

<template>
  <div class="database-virtualization-capability-fixture">
    <div class="database-virtualization-capability-fixture__controls">
      <label>
        Grow row
        <input
          v-model.number="growRowInput"
          type="number"
          min="0"
          :max="rowCount - 1"
          data-testid="db-virt-grow-row-index"
        />
      </label>
      <button type="button" data-testid="db-virt-grow-row-button" @click="growRow">Grow row</button>
      <label>
        Grow column body content
        <input
          v-model.number="growColInput"
          type="number"
          min="0"
          :max="colCount - 1"
          data-testid="db-virt-grow-col-index"
        />
      </label>
      <button type="button" data-testid="db-virt-grow-col-button" @click="growCol">
        Grow column
      </button>
    </div>

    <div
      ref="scrollEl"
      class="database-virtualization-capability-fixture__viewport"
      data-testid="db-virt-viewport"
    >
      <table
        class="database-virtualization-capability-fixture__table"
        data-testid="db-virt-table"
        :aria-rowcount="rowCount + 1"
        :aria-colcount="colCount"
      >
        <colgroup>
          <!-- Auto table layout does not reliably size an empty spacer cell from a per-cell
               `width`; an explicit `<col>` width is the correct hint for the skipped-column
               spacer, matching docs/database-virtualization.md's colgroup model. Visible
               property columns stay unset so native content-driven auto-layout still owns them. -->
          <col :style="{ width: `${columnSpacers.left}px` }" />
          <col v-for="col in horizontalAxis.virtualItems.value" :key="col.key" />
          <col :style="{ width: `${columnSpacers.right}px` }" />
        </colgroup>
        <thead>
          <tr data-testid="db-virt-header-row">
            <th
              aria-hidden="true"
              data-testid="db-virt-header-spacer-left"
              :style="{ width: `${columnSpacers.left}px` }"
            >
              <!-- Auto table layout treats an empty spacer cell's own `width` only as a weak
                   hint; a phantom zero-height content box reliably forces the column's
                   min-content width, matching the required deep horizontal offset. -->
              <div
                class="database-virtualization-capability-fixture__spacer-phantom"
                :style="{ width: `${columnSpacers.left}px` }"
              />
            </th>
            <th
              v-for="col in horizontalAxis.virtualItems.value"
              :key="col.key"
              :ref="(el) => horizontalAxis.measureElement(col.index, el as HTMLElement | null)"
              class="database-virtualization-capability-fixture__header-cell"
              :data-testid="`db-virt-header-cell-${col.key}`"
              :aria-colindex="col.index + 1"
              :style="columnMinWidthStyle(col)"
            >
              Col {{ col.key }}
            </th>
            <th
              aria-hidden="true"
              data-testid="db-virt-header-spacer-right"
              :style="{ width: `${columnSpacers.right}px` }"
            >
              <div
                class="database-virtualization-capability-fixture__spacer-phantom"
                :style="{ width: `${columnSpacers.right}px` }"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr aria-hidden="true" data-testid="db-virt-row-spacer-top">
            <td
              class="database-virtualization-capability-fixture__row-spacer-cell"
              :colspan="totalColumns"
              :style="{ height: `${rowSpacers.top}px` }"
            />
          </tr>

          <tr
            v-for="row in verticalAxis.virtualItems.value"
            :key="row.key"
            :ref="(el) => verticalAxis.measureElement(row.index, el as HTMLElement | null)"
            class="database-virtualization-capability-fixture__row"
            :data-testid="`db-virt-row-${row.key}`"
            :aria-rowindex="row.index + 2"
          >
            <td aria-hidden="true" :style="{ width: `${columnSpacers.left}px` }" />
            <td
              v-for="col in horizontalAxis.virtualItems.value"
              :key="col.key"
              class="database-virtualization-capability-fixture__cell"
              :data-testid="`db-virt-cell-${row.key}-${col.key}`"
              :aria-colindex="col.index + 1"
              :style="columnMinWidthStyle(col)"
            >
              <pre
                v-if="col.index === 0"
                class="database-virtualization-capability-fixture__row-label"
                >{{ rowLabel(row.key) }}</pre
              >
              <template v-else>{{ bodyCellContent(row.key, col.key) }}</template>
            </td>
            <td aria-hidden="true" :style="{ width: `${columnSpacers.right}px` }" />
          </tr>

          <tr aria-hidden="true" data-testid="db-virt-row-spacer-bottom">
            <td
              class="database-virtualization-capability-fixture__row-spacer-cell"
              :colspan="totalColumns"
              :style="{ height: `${rowSpacers.bottom}px` }"
            />
          </tr>
        </tbody>
      </table>
    </div>

    <output data-testid="db-virt-mounted-rows">{{ verticalAxis.virtualItems.value.length }}</output>
    <output data-testid="db-virt-mounted-cols">{{
      horizontalAxis.virtualItems.value.length
    }}</output>
  </div>
</template>

<style lang="css" scoped>
.database-virtualization-capability-fixture {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__viewport {
    overflow: auto;
    width: v-bind(viewportWidthPx);
    height: v-bind(viewportHeightPx);
  }

  &__table {
    border-collapse: collapse;
  }

  &__spacer-phantom {
    height: 1px;
  }

  &__row-spacer-cell {
    padding: 0;
    border: none;
  }

  &__header-cell,
  &__cell {
    border: 1px solid #ccc;
    padding: 2px 6px;
    white-space: nowrap;
    box-sizing: border-box;
    text-align: start;
  }

  &__row-label {
    margin: 0;
  }
}
</style>
