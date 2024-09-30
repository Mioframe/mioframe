<script setup lang="ts">
import { computed } from 'vue';
import type {
  DatabaseData,
  Item,
} from '../../../shared/lib/databaseDocument/types';
import ItemTR from './ItemTR.vue';
import { isNil, pickBy } from 'lodash-es';
import type {
  AnyProperty,
  PropertiesMap,
  PropertyId,
} from '../../../shared/lib/databaseDocument';
import type { ItemId } from '../../../shared/lib/databaseDocument/item';

const props = defineProps<{
  data: DatabaseData;
  properties: PropertiesMap;
}>();

const filteredData = computed(
  (): Record<ItemId, Item> => pickBy(props.data, (v) => !isNil(v)),
);

const slots = defineSlots<{
  value(props: {
    property: AnyProperty | undefined;
    propertyId: PropertyId;
    value: unknown;
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
        <slot name="value" :property :property-id :value />
      </template>

      <template v-if="!!slots.itemActions" #actions>
        <slot name="itemActions" :item :item-id />
      </template>
    </ItemTR>
  </tbody>
</template>
