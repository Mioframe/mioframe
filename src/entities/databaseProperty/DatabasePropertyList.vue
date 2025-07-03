<script setup lang="ts" generic="P extends GeneralProperty">
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import type {
  GeneralProperty,
  PropertiesMap,
} from '@shared/lib/databaseDocument/migrations/state/v1/property';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';

const { properties } = defineProps<{
  properties: PropertiesMap<P>;
}>();

const slots = defineSlots<{
  trailingIcon<K extends DatabasePropertyId>(p: {
    property: PropertiesMap<P>[K];
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
      :supporting-text="String(property.type)"
    >
      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot name="trailingIcon" :property :property-id />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
