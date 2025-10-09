<script setup lang="ts">
import type { Relation, RelationProperty } from '@entity/databaseRelation';
import DatabaseRelationPropertyField from './DatabaseRelationPropertyField.vue';
import type { EntryPath } from '@shared/lib/fileSystem';
import { computed } from 'vue';

defineProps<{
  directoryPath: EntryPath;
}>();

interface PartialRelationProperty extends Omit<RelationProperty, 'relation'> {
  relation?: Relation;
}

const propertyModel = defineModel<PartialRelationProperty>('property', {
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
      :directory-path="directoryPath"
    />
  </section>
</template>
