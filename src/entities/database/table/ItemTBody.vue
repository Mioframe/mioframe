<script setup lang="ts">
import { computed } from 'vue';
import type { DatabaseData } from '../../../shared/lib/databaseDocument/types';
import ItemTR from './ItemTR.vue';
import { isNil, pickBy } from 'lodash-es';
import type {
  AnyProperty,
  PropertiesMap,
  PropertyId,
} from '../../../shared/lib/databaseDocument';

const props = defineProps<{
  data: DatabaseData;
  properties: PropertiesMap;
}>();

const filteredData = computed(() => pickBy(props.data, (v) => !isNil(v)));

defineSlots<{
  value(props: {
    property: AnyProperty | undefined;
    propertyId: PropertyId;
    value: unknown;
  }): unknown;
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
    </ItemTR>
  </tbody>
</template>
