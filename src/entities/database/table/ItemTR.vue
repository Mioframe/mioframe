<script setup lang="ts">
import type { Item, PropertiesMap } from '../../../shared/lib/databaseDocument';
import ItemTD from './ItemTD.vue';

defineProps<{
  properties: PropertiesMap;
  item: Item;
}>();
</script>

<template>
  <tr>
    <ItemTD v-for="(_property, propertyId) in properties" :key="propertyId">
      {{ item[propertyId] }}
    </ItemTD>
  </tr>
</template>
