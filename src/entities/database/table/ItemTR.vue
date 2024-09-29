<script setup lang="ts">
import type {
  AnyProperty,
  Item,
  PropertiesMap,
  PropertyId,
} from '../../../shared/lib/databaseDocument';
import ItemTD from './ItemTD.vue';

defineProps<{
  properties: PropertiesMap;
  item: Item;
}>();

defineSlots<{
  value(props: {
    value: unknown;
    property: AnyProperty | undefined;
    propertyId: PropertyId;
  }): unknown;
}>();
</script>

<template>
  <tr>
    <ItemTD v-for="(property, propertyId) in properties" :key="propertyId">
      <slot name="value" :value="item[propertyId]" :property :property-id />
    </ItemTD>
  </tr>
</template>
