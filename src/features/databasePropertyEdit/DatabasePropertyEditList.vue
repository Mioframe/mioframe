<script setup lang="ts">
import type { PropertiesMap } from '@shared/lib/databaseDocument/property';
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
</script>

<template>
  <MDListContainer>
    <MDListItem
      v-for="(property, propertyId) in properties"
      :key="propertyId"
      :headline="property.name"
    >
      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot name="trailingIcon" :property :property-id />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
