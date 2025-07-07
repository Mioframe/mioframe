<script setup lang="ts">
import { useOrderedDatabaseData } from '@entity/databaseData';
import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseTableView,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { MDTable } from '@shared/ui/Table';
import type { EmptyObject } from 'type-fest';
import { toRefs } from 'vue';
import type { ItemIdQuery } from './queryTypes';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';

const props = defineProps<{
  docHandle: AMDocHandle;
  view: DatabaseTableView;
  idQuery?: ItemIdQuery;
}>();

const slots = defineSlots<{
  value: (p: {
    item: DatabaseItem;
    itemId: DatabaseItemId;
    property: DatabaseUnknownProperty;
    propertyId: DatabasePropertyId;
  }) => unknown;
  action: (p: { item: DatabaseItem; itemId: DatabaseItemId }) => unknown;
  actionHead: (p: EmptyObject) => unknown;
}>();

const { docHandle, view, idQuery } = toRefs(props);

const properties = useDatabasePropertiesMap(docHandle);

const { itemList } = useOrderedDatabaseData(docHandle, view, idQuery);
</script>

<template>
  <MDTable>
    <thead>
      <tr>
        <th
          v-for="[propertyId, { name }] in properties.entries"
          :key="propertyId"
        >
          {{ name }}
        </th>

        <th v-if="!!slots.action || !!slots.actionHead">
          <slot name="actionHead" />
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="[itemId, item] in itemList" :key="itemId">
        <td
          v-for="[propertyId, property] in properties.entries"
          :key="propertyId"
        >
          <slot
            name="value"
            :item="item"
            :item-id="itemId"
            :property-id="propertyId"
            :property="property"
          >
            {{ item[propertyId] }}
          </slot>
        </td>

        <td v-if="!!slots.action || !!slots.actionHead">
          <slot name="action" :item="item" :item-id="itemId" />
        </td>
      </tr>
    </tbody>
  </MDTable>
</template>
