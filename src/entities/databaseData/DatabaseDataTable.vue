<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { ItemIdQuery } from '@shared/service';
import { MDTable } from '@shared/ui/Table';
import { type VirtualCollectionItem, useVirtualCollection } from '@shared/ui/virtualization';
import { unrefElement, useElementBounding, useMutationObserver } from '@vueuse/core';
import type { EmptyObject } from 'type-fest';
import { computed, onUpdated, toRefs, useTemplateRef, type CSSProperties } from 'vue';
import { useDatabaseData } from './useDatabaseData';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  properties: Readonly<DatabasePropertyId[]>;
  scrollRoot: HTMLElement | null | undefined;
  viewId?: DatabaseViewId | undefined;
  idQuery?: ItemIdQuery | undefined;
}>();

const slots = defineSlots<{
  property: (p: { propertyId: DatabasePropertyId }) => unknown;
  value: (p: { itemId: DatabaseItemId; propertyId: DatabasePropertyId }) => unknown;
  action?: (p: { itemId: DatabaseItemId }) => unknown;
  actionHead?: (p: EmptyObject) => unknown;
}>();

const ROW_ESTIMATE_PX = 48;
const COLUMN_ESTIMATE_PX = 160;
const VIRTUAL_OVERSCAN = 4;

const { directoryPath, documentId, idQuery, properties, scrollRoot, viewId } = toRefs(props);

const { itemIdList } = useDatabaseData(directoryPath, documentId, viewId, idQuery);

const logicalItemIdList = computed<readonly DatabaseItemId[]>(() => itemIdList.value ?? []);

// The native table is this component's collection surface. VueUse resolves the MDTable component
// ref to that root table element, keeping root-to-surface geometry inside the native-table owner.
const tableSurface = useTemplateRef<HTMLElement>('tableSurface');
const tableElement = computed(() => unrefElement(tableSurface.value));
const rootBounding = useElementBounding(scrollRoot);
const tableBounding = useElementBounding(tableElement);

const updateSurfaceBounds = () => {
  rootBounding.update();
  tableBounding.update();
};

// Direct composition children of the explicit root can move this table without changing its props.
// This observes only that root topology; TanStack remains the sole virtual-item measurement owner.
useMutationObserver(scrollRoot, updateSurfaceBounds, { childList: true });

onUpdated(updateSurfaceBounds);

const verticalSurfaceOffset = computed(() => {
  const root = scrollRoot.value;

  if (!root || !tableElement.value) {
    return 0;
  }

  return tableBounding.top.value - rootBounding.top.value - root.clientTop + root.scrollTop;
});

const horizontalSurfaceOffset = computed(() => {
  const root = scrollRoot.value;

  if (!root || !tableElement.value) {
    return 0;
  }

  return tableBounding.left.value - rootBounding.left.value - root.clientLeft + root.scrollLeft;
});

const rows = useVirtualCollection(logicalItemIdList, {
  root: scrollRoot,
  key: (itemId) => itemId,
  estimateSize: ROW_ESTIMATE_PX,
  overscan: VIRTUAL_OVERSCAN,
  surfaceOffset: verticalSurfaceOffset,
});

const columns = useVirtualCollection(properties, {
  root: scrollRoot,
  key: (propertyId) => propertyId,
  estimateSize: COLUMN_ESTIMATE_PX,
  axis: 'horizontal',
  overscan: VIRTUAL_OVERSCAN,
  surfaceOffset: horizontalSurfaceOffset,
});

const vVirtualRow = rows.vItem;
const vVirtualColumn = columns.vItem;

const hasActionColumn = computed(() => !!slots.action || !!slots.actionHead);
const logicalColumnCount = computed(() => properties.value.length + Number(hasActionColumn.value));
const hasLeadingColumnSpacer = computed(() => columns.leadingSize.value > 0);
const hasTrailingColumnSpacer = computed(() => columns.trailingSize.value > 0);
const hasLeadingRowSpacer = computed(() => rows.leadingSize.value > 0);
const hasTrailingRowSpacer = computed(() => rows.trailingSize.value > 0);
const physicalColumnCount = computed(
  () =>
    columns.items.value.length +
    Number(hasLeadingColumnSpacer.value) +
    Number(hasTrailingColumnSpacer.value) +
    Number(hasActionColumn.value),
);

const actionColumnIndex = computed(() => properties.value.length + 1);

function getColumnMinWidthStyle(
  column: VirtualCollectionItem<DatabasePropertyId, DatabasePropertyId>,
): CSSProperties {
  // The public virtual-item size is TanStack's stable-key measurement cache. Keeping it as the
  // remount minimum lets native table layout grow a mounted column without an independent width
  // map or a shrink/regrow protocol.
  return { minWidth: `${column.size}px` };
}
</script>

<template>
  <MDTable
    ref="tableSurface"
    class="db-data-table"
    :aria-rowcount="logicalItemIdList.length + 1"
    :aria-colcount="logicalColumnCount"
  >
    <colgroup>
      <col
        v-if="hasLeadingColumnSpacer"
        aria-hidden="true"
        :style="{ width: `${columns.leadingSize.value}px` }"
      />
      <col v-for="column in columns.items.value" :key="column.key" />
      <col
        v-if="hasTrailingColumnSpacer"
        aria-hidden="true"
        :style="{ width: `${columns.trailingSize.value}px` }"
      />
      <col v-if="hasActionColumn" />
    </colgroup>

    <thead>
      <tr>
        <th
          v-if="hasLeadingColumnSpacer"
          aria-hidden="true"
          class="db-data-table__column-spacer"
          :style="{ width: `${columns.leadingSize.value}px` }"
        >
          <div
            class="db-data-table__spacer-phantom"
            :style="{ width: `${columns.leadingSize.value}px` }"
          />
        </th>

        <th
          v-for="column in columns.items.value"
          :key="column.key"
          v-virtual-column="column"
          :aria-colindex="column.index + 1"
          :style="getColumnMinWidthStyle(column)"
        >
          <slot name="property" :property-id="column.value">
            {{ column.value }}
          </slot>
        </th>

        <th
          v-if="hasTrailingColumnSpacer"
          aria-hidden="true"
          class="db-data-table__column-spacer"
          :style="{ width: `${columns.trailingSize.value}px` }"
        >
          <div
            class="db-data-table__spacer-phantom"
            :style="{ width: `${columns.trailingSize.value}px` }"
          />
        </th>

        <th
          v-if="hasActionColumn"
          class="db-data-table__actions"
          :aria-colindex="actionColumnIndex"
        >
          <slot name="actionHead" />
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-if="hasLeadingRowSpacer" aria-hidden="true" class="db-data-table__row-spacer">
        <td :colspan="physicalColumnCount" :style="{ height: `${rows.leadingSize.value}px` }" />
      </tr>

      <tr
        v-for="row in rows.items.value"
        :key="row.key"
        v-virtual-row="row"
        :aria-rowindex="row.index + 2"
      >
        <td
          v-if="hasLeadingColumnSpacer"
          aria-hidden="true"
          class="db-data-table__column-spacer"
          :style="{ width: `${columns.leadingSize.value}px` }"
        />

        <td
          v-for="column in columns.items.value"
          :key="column.key"
          class="db-data-table__value"
          :aria-colindex="column.index + 1"
          :style="getColumnMinWidthStyle(column)"
        >
          <slot name="value" :item-id="row.value" :property-id="column.value" />
        </td>

        <td
          v-if="hasTrailingColumnSpacer"
          aria-hidden="true"
          class="db-data-table__column-spacer"
          :style="{ width: `${columns.trailingSize.value}px` }"
        />

        <td
          v-if="hasActionColumn"
          class="db-data-table__actions"
          :aria-colindex="actionColumnIndex"
        >
          <slot name="action" :item-id="row.value" />
        </td>
      </tr>

      <tr v-if="hasTrailingRowSpacer" aria-hidden="true" class="db-data-table__row-spacer">
        <td :colspan="physicalColumnCount" :style="{ height: `${rows.trailingSize.value}px` }" />
      </tr>
    </tbody>
  </MDTable>
</template>

<style lang="css" scoped>
.db-data-table {
  &__column-spacer,
  &__row-spacer > td {
    padding: 0;
    border: none;
  }

  &__spacer-phantom {
    height: 1px;
  }

  &__value {
    :deep() {
      > * {
        display: block;
        width: 100%;
      }
    }
  }

  &__actions {
    position: sticky;
    right: 0;
    z-index: 2;
    background-color: var(--md-container-color);

    :deep(> *) {
      pointer-events: all;
    }
  }

  :deep(thead) &__actions {
    z-index: 3;
  }
}
</style>
