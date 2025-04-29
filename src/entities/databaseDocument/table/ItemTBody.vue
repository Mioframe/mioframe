<script setup lang="ts">
import { computed } from 'vue';
import ItemTR from './ItemTR.vue';
import { isNil, pickBy } from 'lodash-es';
import type {
  DatabaseData,
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument/state';

const props = defineProps<{
  data: DatabaseData;
  properties: DatabaseUnknownPropertiesMap;
}>();

const filteredData = computed(
  (): Record<DatabaseItemId, DatabaseItem> =>
    pickBy(props.data, (v) => !isNil(v)),
);

const slots = defineSlots<{
  value(props: {
    property: DatabaseUnknownProperty | undefined;
    propertyId: DatabasePropertyId;
    value: unknown;
    itemId: DatabaseItemId;
  }): unknown;
  itemActions(props: { item: DatabaseItem; itemId: DatabaseItemId }): unknown;
}>();
</script>

<template>
  <tbody>
    <ItemTR
      v-for="(item, itemId) in filteredData"
      :key="itemId"
      :properties="properties"
      :item="item"
    >
      <template #value="{ property, propertyId, value }">
        <slot name="value" :property :property-id :value :item-id />
      </template>

      <template v-if="!!slots.itemActions" #actions>
        <slot name="itemActions" :item :item-id />
      </template>
    </ItemTR>
  </tbody>
</template>
