<script setup lang="ts">
import { DocumentDatabaseJson } from '@entity/documentDatabase';
import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import {
  useDatabaseViewsMap,
  zodDatabaseTableView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed, toRefs } from 'vue';
import ValueInline from './ValueInline.vue';
import { DatabaseDataTable } from '@entity/databaseData';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import type { ItemIdQuery } from '@entity/databaseData/queryTypes';

const props = defineProps<{
  docHandle: AMDocHandle;
  viewId?: DatabaseViewId;
  directory: DirectoryFSEntry;
  itemIdQuery?: ItemIdQuery;
}>();

const slots = defineSlots<{
  value: (p: {
    item: DatabaseItem;
    itemId: DatabaseItemId;
    property: DatabaseUnknownProperty;
    propertyId: DatabasePropertyId;
  }) => unknown;
  action: (p: { item: DatabaseItem; itemId: DatabaseItemId }) => unknown;
  actionHead: () => unknown;
}>();

const { docHandle, viewId } = toRefs(props);

const viewsMap = useDatabaseViewsMap(docHandle);

const view = computed(() =>
  viewId.value ? viewsMap.get(viewId.value) : viewsMap.defaultView?.[1],
);
</script>

<template>
  <DatabaseDataTable
    v-if="zodIs(view, zodDatabaseTableView)"
    :doc-handle="docHandle"
    :view="view"
    class="database-view__table"
    :id-query="itemIdQuery"
  >
    <template #value="{ item, itemId, property, propertyId }">
      <slot
        name="value"
        :item="item"
        :item-id="itemId"
        :property="property"
        :property-id="propertyId"
      >
        <ValueInline
          :property="property"
          :value="item[propertyId]"
          :directory="directory"
        />
      </slot>
    </template>

    <template v-if="!!slots.action" #action="{ itemId, item }">
      <slot name="action" :item-id="itemId" :item="item" />
    </template>

    <template v-if="!!slots.actionHead" #actionHead>
      <slot name="actionHead" />
    </template>
  </DatabaseDataTable>

  <DocumentDatabaseJson v-else :doc-handle="docHandle" />
</template>
