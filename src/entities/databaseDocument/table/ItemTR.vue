<script setup lang="ts">
import type {
  DatabaseItem,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument/migrations/versions';
import ItemTD from './ItemTD.vue';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';

const { properties } = defineProps<{
  properties: DatabaseUnknownPropertiesMap;
  item: DatabaseItem;
}>();

const slots = defineSlots<{
  value(props: {
    value: unknown;
    property: DatabaseUnknownProperty | undefined;
    propertyId: DatabasePropertyId;
  }): unknown;
  actions: () => unknown;
}>();

const propertiesCollection = useWrapStrictRecord(() => properties);
</script>

<template>
  <tr>
    <ItemTD v-if="!!slots.actions">
      <slot name="actions" />
    </ItemTD>

    <ItemTD
      v-for="[propertyId, property] in propertiesCollection?.entries"
      :key="propertyId"
    >
      <slot
        name="value"
        :value="item[propertyId]"
        :property="property"
        :property-id="propertyId"
      />
    </ItemTD>
  </tr>
</template>
