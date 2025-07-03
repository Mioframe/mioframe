<script setup lang="ts">
import type { PropertiesMap } from '@shared/lib/databaseDocument/migrations/state/v1/property';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';

const { properties } = defineProps<{
  properties: PropertiesMap;
}>();

const slots = defineSlots<{
  trailingIcon<K extends keyof PropertiesMap>(p: {
    property: PropertiesMap[K];
    propertyId: K;
  }): unknown;
}>();

const propertyCollection = useWrapStrictRecord(() => properties);
</script>

<template>
  <MDListContainer>
    <MDListItem
      v-for="[propertyId, property] in propertyCollection"
      :key="propertyId"
      :headline="property.name"
    >
      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot name="trailingIcon" :property :property-id />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
