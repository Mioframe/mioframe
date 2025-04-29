<script setup lang="ts">
import type {
  PropertiesMap,
  PropertyId,
} from '@shared/lib/databaseDocument/state/v1/property';
import DatabaseDataSortingForm from './DatabaseDataSortingForm.vue';
import type { DatabaseSortDescription } from '@shared/lib/databaseDocument/state';

defineProps<{
  properties: PropertiesMap;
  sorting?: DatabaseSortDescription[];
}>();

const emit = defineEmits<{
  toggleSorting: [propertyId: PropertyId];
  addSorting: [DatabaseSortDescription];
}>();

const onToggleSortDirection = (propertyId: PropertyId) => {
  emit('toggleSorting', propertyId);
};

const onAddSorting = (description: DatabaseSortDescription) => {
  emit('addSorting', description);
};
</script>

<template>
  <div>
    <DatabaseDataSortingForm
      :properties
      :sorting
      @toggle-direction="onToggleSortDirection"
      @add-sorting="onAddSorting"
    />
  </div>
</template>
