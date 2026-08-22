<script setup lang="ts">
import { useVirtualCollection } from '@shared/ui/virtualization';
import type { VirtualCollectionItem } from '@shared/ui/virtualization';
import { MDTable } from '@shared/ui/Table';
import { computed, ref, useTemplateRef } from 'vue';
import type { CSSProperties } from 'vue';

/**
 * Deterministic Storybook browser-proof fixture for the native-table-first database DOM
 * model described in `docs/database-virtualization.md`. Not production UI: it uses only
 * synthetic rows/properties through the real shared `useVirtualCollection` composable and
 * actual `MDTable`, with no worker, service, persistence, editor, relation, or toolbar behavior.
 */
const props = withDefaults(
  defineProps<{
    rowCount?: number;
    colCount?: number;
  }>(),
  {
    rowCount: 5000,
    colCount: 300,
  },
);

const ROW_BASE_HEIGHT_PX = 28;
const COL_BASE_WIDTH_PX = 96;
const viewportWidthPx = '520px';
const viewportHeightPx = '360px';

// The physical scroll root is a dedicated wrapper, not MDTable's own root. `table-layout: auto`
// (MDTable's default) lets an auto-layout table grow past any CSS width to fit its min-content;
// the trailing phantom spacer's min-content width would otherwise force the table itself wide
// enough that it never actually overflows its own box, defeating virtualization. The wrapper's
// fixed size is a real, content-independent constraint, so it stays the one element that scrolls.
const scrollElRef = useTemplateRef<HTMLElement>('scrollEl');

const rowIds = computed(() => Array.from({ length: props.rowCount }, (_, index) => index));
const colIds = computed(() => Array.from({ length: props.colCount }, (_, index) => index));

const rowGrowth = ref<Record<number, number>>({});
const bodyCellGrowth = ref<Record<number, number>>({});

const growRowInput = ref(0);
function growRow(): void {
  const index = growRowInput.value;
  rowGrowth.value = { ...rowGrowth.value, [index]: (rowGrowth.value[index] ?? 0) + 1 };
}
function shrinkRow(): void {
  const index = growRowInput.value;
  const current = rowGrowth.value[index] ?? 0;
  if (current <= 0) return;
  rowGrowth.value = { ...rowGrowth.value, [index]: current - 1 };
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

const rows = useVirtualCollection(rowIds, {
  root: () => scrollElRef.value,
  key: (id) => id,
  estimateSize: ROW_BASE_HEIGHT_PX,
  overscan: 4,
});

const columns = useVirtualCollection(colIds, {
  root: () => scrollElRef.value,
  key: (id) => id,
  estimateSize: COL_BASE_WIDTH_PX,
  axis: 'horizontal',
  overscan: 4,
});

const vVirtualRow = rows.measure;
const vVirtualColumn = columns.measure;

const totalColumns = computed(() => columns.items.value.length + 2);

function columnMinWidthStyle(col: VirtualCollectionItem<number, number>): CSSProperties {
  // The remount minimum uses the collection's own last-measured/cached size for this stable key
  // so ordinary scrolling never shrinks a column below its already-known width.
  return { minWidth: `${col.size}px` };
}

const viewportStyle: CSSProperties = {
  overflow: 'auto',
  width: viewportWidthPx,
  height: viewportHeightPx,
};
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
      <button type="button" data-testid="db-virt-shrink-row-button" @click="shrinkRow">
        Shrink row
      </button>
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
      :style="viewportStyle"
    >
      <MDTable
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
          <col :style="{ width: `${columns.leadingSize.value}px` }" />
          <col v-for="col in columns.items.value" :key="col.key" />
          <col :style="{ width: `${columns.trailingSize.value}px` }" />
        </colgroup>
        <thead>
          <tr data-testid="db-virt-header-row">
            <th
              aria-hidden="true"
              data-testid="db-virt-header-spacer-left"
              :style="{ width: `${columns.leadingSize.value}px` }"
            >
              <!-- Auto table layout treats an empty spacer cell's own `width` only as a weak
                 hint; a phantom zero-height content box reliably forces the column's
                 min-content width, matching the required deep horizontal offset. -->
              <div
                class="database-virtualization-capability-fixture__spacer-phantom"
                :style="{ width: `${columns.leadingSize.value}px` }"
              />
            </th>
            <th
              v-for="col in columns.items.value"
              :key="col.key"
              v-virtual-column="col"
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
              :style="{ width: `${columns.trailingSize.value}px` }"
            >
              <div
                class="database-virtualization-capability-fixture__spacer-phantom"
                :style="{ width: `${columns.trailingSize.value}px` }"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr aria-hidden="true" data-testid="db-virt-row-spacer-top">
            <td
              class="database-virtualization-capability-fixture__row-spacer-cell"
              :colspan="totalColumns"
              :style="{ height: `${rows.leadingSize.value}px` }"
            />
          </tr>

          <tr
            v-for="row in rows.items.value"
            :key="row.key"
            v-virtual-row="row"
            class="database-virtualization-capability-fixture__row"
            :data-testid="`db-virt-row-${row.key}`"
            :aria-rowindex="row.index + 2"
          >
            <td aria-hidden="true" :style="{ width: `${columns.leadingSize.value}px` }" />
            <td
              v-for="col in columns.items.value"
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
            <td aria-hidden="true" :style="{ width: `${columns.trailingSize.value}px` }" />
          </tr>

          <tr aria-hidden="true" data-testid="db-virt-row-spacer-bottom">
            <td
              class="database-virtualization-capability-fixture__row-spacer-cell"
              :colspan="totalColumns"
              :style="{ height: `${rows.trailingSize.value}px` }"
            />
          </tr>
        </tbody>
      </MDTable>
    </div>

    <output data-testid="db-virt-mounted-rows">{{ rows.items.value.length }}</output>
    <output data-testid="db-virt-mounted-cols">{{ columns.items.value.length }}</output>
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

  &__spacer-phantom {
    height: 1px;
  }

  &__row-spacer-cell {
    padding: 0;
    border: none;
  }

  &__header-cell,
  &__cell {
    white-space: nowrap;
    box-sizing: border-box;
  }

  &__row-label {
    margin: 0;
  }
}
</style>
