<script setup lang="ts">
import type {
  DatabaseItem,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument/state';
import ItemTD from './ItemTD.vue';

defineProps<{
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
</script>

<template>
  <tr>
    <ItemTD v-if="!!slots.actions">
      <slot name="actions" />
    </ItemTD>

    <ItemTD v-for="(property, propertyId) in properties" :key="propertyId">
      <slot name="value" :value="item[propertyId]" :property :property-id />
    </ItemTD>
  </tr>
</template>
