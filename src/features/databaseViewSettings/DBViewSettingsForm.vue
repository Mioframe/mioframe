<script setup lang="ts">
import type {
  PropertiesMap,
  PropertyId,
} from '@shared/lib/databaseDocument/property';
import DBPropertySortingForm from './DBPropertySortingForm.vue';
import type { SortDescription } from '@shared/lib/databaseDocument';

defineProps<{
  properties: PropertiesMap;
  sorting?: SortDescription[];
}>();

const emit = defineEmits<{
  toggleSorting: [propertyId: PropertyId];
  addSorting: [SortDescription];
}>();

const onToggleSortDirection = (propertyId: PropertyId) => {
  emit('toggleSorting', propertyId);
};

const onAddSorting = (description: SortDescription) => {
  emit('addSorting', description);
};
</script>

<template>
  <div>
    <DBPropertySortingForm
      :properties
      :sorting
      @toggle-direction="onToggleSortDirection"
      @add-sorting="onAddSorting"
    />
  </div>
</template>
