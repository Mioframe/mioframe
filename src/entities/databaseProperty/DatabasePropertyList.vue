<script setup lang="ts" generic="P extends GeneralProperty">
import type {
  GeneralProperty,
  PropertiesMap,
} from '@shared/lib/databaseDocument/property';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { toString } from 'lodash-es';

defineProps<{
  properties: PropertiesMap<P>;
}>();

const slots = defineSlots<{
  trailingIcon<K extends keyof PropertiesMap<P>>(p: {
    property: PropertiesMap<P>[K];
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
      :supporting-text="toString(property.type)"
    >
      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot name="trailingIcon" :property :property-id />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
