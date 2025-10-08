<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDTable } from '@shared/ui/Table';
import type { EmptyObject } from 'type-fest';
import { computed, toRefs } from 'vue';
import type { ItemIdQuery } from '../../shared/api/databaseDocument/data/queryTypes';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import type { EntryPath } from '@shared/lib/fileSystem';
import { useDatabaseDataClient } from './client';
import { DomainError } from '@shared/lib/error';
import { strictRecordIterableEntries } from '@shared/lib/strictRecord';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  viewId?: DatabaseViewId;
  idQuery?: ItemIdQuery;
}>();

const { directoryPath, documentId, viewId, idQuery } = toRefs(props);

const slots = defineSlots<{
  value: (p: {
    itemId: DatabaseItemId;
    property: DatabaseUnknownProperty;
    propertyId: DatabasePropertyId;
  }) => unknown;
  action: (p: { itemId: DatabaseItemId }) => unknown;
  actionHead: (p: EmptyObject) => unknown;
}>();

const {
  getDatabaseProperties: { get: getDatabaseProperties },
} = useDatabasePropertiesClient();

const properties = computed(() =>
  getDatabaseProperties(directoryPath.value, documentId.value),
);

const {
  itemIdList: { get: getItemIdList },
} = useDatabaseDataClient();

const itemList = computed(() => {
  const idList = getItemIdList(
    directoryPath.value,
    documentId.value,
    viewId.value,
    {
      idQuery: idQuery.value,
    },
  );

  if (idList instanceof DomainError) {
    return idList;
  }

  return idList;
});
</script>

<template>
  <MDTable class="db-data-table">
    <!-- eslint-disable-next-line prettier/prettier -- for correct code highlighting -->
    <div v-if="(properties instanceof DomainError)">
      {{ properties.message }}
    </div>

    <template v-else>
      <thead>
        <tr>
          <th
            v-for="[propertyId, { name }] in strictRecordIterableEntries(
              properties,
            )()"
            :key="propertyId"
          >
            {{ name }}
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
        <tr v-for="itemId in itemList" :key="itemId" role="listitem">
          <td
            v-for="[propertyId, property] in strictRecordIterableEntries(
              properties,
            )()"
            :key="propertyId"
          >
            <slot
              name="value"
              :item-id="itemId"
              :property-id="propertyId"
              :property="property"
            />
          </td>

          <td
            v-if="!!slots.action || !!slots.actionHead"
            class="db-data-table__actions"
          >
            <slot name="action" :item-id="itemId" />
          </td>
        </tr>
      </tbody>
    </template>
  </MDTable>
</template>

<style lang="css" scoped>
.db-data-table {
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
