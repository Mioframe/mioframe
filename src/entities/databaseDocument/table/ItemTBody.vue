<script setup lang="ts">
import { computed } from 'vue';
import ItemTR from './ItemTR.vue';
import { isNil, pickBy } from 'lodash-es';
import type {
  UnknownProperty,
  UnknownPropertiesMap,
  PropertyId,
  DatabaseData,
  Item,
  ItemId,
} from '@shared/lib/databaseDocument';

const props = defineProps<{
  data: DatabaseData;
  properties: UnknownPropertiesMap;
}>();

const filteredData = computed(
  (): Record<ItemId, Item> => pickBy(props.data, (v) => !isNil(v)),
);

const slots = defineSlots<{
  value(props: {
    property: UnknownProperty | undefined;
    propertyId: PropertyId;
    value: unknown;
    itemId: ItemId;
  }): unknown;
  itemActions(props: { item: Item; itemId: ItemId }): unknown;
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
