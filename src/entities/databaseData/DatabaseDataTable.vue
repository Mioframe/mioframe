<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDTable } from '@shared/ui/Table';
import type { EmptyObject } from 'type-fest';
import { toRefs } from 'vue';
import type { ItemIdQuery } from '@shared/service/databaseDocument/data/queryTypes';
import { useDatabaseData } from './useDatabaseData';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  properties: DatabasePropertyId[];
  viewId?: DatabaseViewId;
  idQuery?: ItemIdQuery;
}>();

const { directoryPath, documentId, viewId, idQuery } = toRefs(props);

const slots = defineSlots<{
  property: (p: { propertyId: DatabasePropertyId }) => unknown;
  value: (p: {
    itemId: DatabaseItemId;
    propertyId: DatabasePropertyId;
  }) => unknown;
  action: (p: { itemId: DatabaseItemId }) => unknown;
  actionHead: (p: EmptyObject) => unknown;
}>();

const { itemIdList } = useDatabaseData(
  directoryPath,
  documentId,
  viewId,
  idQuery,
);
</script>

<template>
  <MDTable class="db-data-table">
    <thead>
      <tr>
        <th v-for="propertyId in properties" :key="propertyId">
          <slot name="property" :property-id="propertyId">
            {{ propertyId }}
          </slot>
        </th>

        <th
          v-if="!!slots.action || !!slots.actionHead"
          class="db-data-table__actions"
        >
          <slot name="actionHead" />
        </th>
      </tr>
    </thead>

    <tbody role="list">
      <tr v-for="itemId in itemIdList" :key="itemId" role="listitem">
        <td
          v-for="propertyId in properties"
          :key="propertyId"
          class="db-data-table__value"
        >
          <slot name="value" :item-id="itemId" :property-id="propertyId" />
        </td>

        <td
          v-if="!!slots.action || !!slots.actionHead"
          class="db-data-table__actions"
        >
          <slot name="action" :item-id="itemId" />
        </td>
      </tr>
    </tbody>
  </MDTable>
</template>

<style lang="css" scoped>
.db-data-table {
  &__value {
    :deep() {
      > * {
        display: inline-block;
      }
    }
  }

  th&__actions,
  td&__actions {
    position: sticky;
    right: 0;
    left: 0;
    z-index: -1;
    pointer-events: none;

    background: transparent;
    z-index: 1;

    :deep(> *) {
      pointer-events: all;
    }
  }
}
</style>
