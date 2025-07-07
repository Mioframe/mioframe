<script setup lang="ts">
import { computed } from 'vue';
import ItemTR from './ItemTR.vue';
import type {
  DatabaseData,
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument/migrations/versions';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';

const { data } = defineProps<{
  data: DatabaseData;
  properties: DatabaseUnknownPropertiesMap;
}>();

const dataRef = computed(() => data);

const filteredData = useWrapStrictRecord(dataRef);

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
      v-for="[itemId, item] in filteredData?.entries"
      :key="itemId"
      :properties="properties"
      :item="item"
    >
      <template #value="{ property, propertyId, value }">
        <slot
          name="value"
          :property="property"
          :property-id="propertyId"
          :value="value"
          :item-id="itemId"
        />
      </template>

      <template v-if="!!slots.itemActions" #actions>
        <slot name="itemActions" :item="item" :item-id="itemId" />
      </template>
    </ItemTR>
  </tbody>
</template>
