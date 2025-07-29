<script setup lang="ts">
import type { RelationProperty } from '@entity/databaseRelation';
import DatabaseRelationPropertyField from './DatabaseRelationPropertyField.vue';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { computed } from 'vue';

defineProps<{
  directory: DirectoryFSEntry;
}>();

const propertyModel = defineModel<RelationProperty>('property', {
  required: true,
});

const relationModel = computed({
  get: () => propertyModel.value.relation,
  set: (relation) => {
    propertyModel.value = { ...propertyModel.value, relation };
  },
});
</script>

<template>
  <section>
    <DatabaseRelationPropertyField
      v-model:model-value="relationModel"
      :directory="directory"
    />
  </section>
</template>
