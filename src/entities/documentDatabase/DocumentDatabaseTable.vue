<script setup lang="ts">
import { useOrderedDatabaseData } from '@entity/databaseData';
import type { AMDocHandle } from '@shared/lib/cfrDocument';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseTableView,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { MDTable } from '@shared/ui/Table';
import type { EmptyObject } from 'type-fest';
import { toRefs } from 'vue';

const props = defineProps<{
  properties: DatabaseUnknownPropertiesMap;
  docHandle: AMDocHandle;
  view: DatabaseTableView;
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

const { docHandle, view, properties } = toRefs(props);

const propertiesCollection = useWrapStrictRecord(properties);

const { itemList } = useOrderedDatabaseData(docHandle, view);
</script>

<template>
  <MDTable>
    <thead>
      <tr>
        <th
          v-for="[propertyId, { name }] in propertiesCollection"
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
          v-for="[propertyId, property] in propertiesCollection"
          :key="propertyId"
        >
          <slot name="value" :item :item-id :property-id :property>
            {{ item[propertyId] }}
          </slot>
        </td>

        <td v-if="!!slots.action || !!slots.actionHead">
          <slot name="action" :item :item-id />
        </td>
      </tr>
    </tbody>
  </MDTable>
</template>
