<script setup lang="ts">
import type { Relation, RelationProperty } from '@entity/databaseRelation';
import DatabaseRelationPropertyField from './DatabaseRelationPropertyField.vue';
import { computed } from 'vue';

const propertyModel = defineModel<PartialRelationProperty>('property', {
  required: true,
});

defineProps<{
  directoryPath: string;
}>();

interface PartialRelationProperty extends Omit<RelationProperty, 'relation'> {
  relation?: Relation | undefined;
}

const relationModel = computed({
  get: () => propertyModel.value.relation,
  set: (relation) => {
    propertyModel.value = { ...propertyModel.value, relation };
  },
});
</script>

<template>
  <section>
    <DatabaseRelationPropertyField v-model:model-value="relationModel" :path="directoryPath" />
  </section>
</template>
