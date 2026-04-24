<script setup lang="ts">
import type { ParentRelation } from '@entity/databaseRelation';
import { useDatabaseProperty } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { toRefs } from 'vue';
import DatabasePropertyValueInline from './DatabasePropertyValueInline.vue';

const props = defineProps<{
  value: unknown;
  editable?: boolean;
  directoryPath: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
  parentRelation?: ParentRelation | undefined;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { directoryPath, documentId, propertyId } = toRefs(props);

const { property } = useDatabaseProperty(directoryPath, documentId, propertyId);

const onClick = () => {
  emit('click');
};
</script>

<template>
  <DatabasePropertyValueInline
    :value="value"
    :property="property"
    :editable="editable"
    :directory-path="directoryPath"
    :property-id="propertyId"
    :parent-relation="parentRelation"
    @click="onClick"
  />
</template>
