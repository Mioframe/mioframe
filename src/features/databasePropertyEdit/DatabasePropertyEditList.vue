<script setup lang="ts">
import type { PropertiesMap } from '@shared/lib/databaseDocument/migrations/versions/v1/property';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useSlots } from 'vue';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

defineSlots<{
  trailingAction<K extends keyof PropertiesMap>(p: {
    property: PropertiesMap[K];
    propertyId: K;
  }): unknown;
}>();
const slots = useSlots();

const propertyCollection = useWrapStrictRecord(() => properties);
</script>

<template>
  <MDListContainer>
    <MDListItem
      v-for="[propertyId, property] in propertyCollection?.entries"
      :key="propertyId"
      :mode="slots.trailingAction ? 'multi-action' : 'static'"
      :label-text="property.name"
    >
      <template v-if="!!slots.trailingAction" #trailingAction>
        <slot name="trailingAction" :property="property" :property-id="propertyId" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
