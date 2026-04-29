<script setup lang="ts">
import type { ParentRelation } from '@entity/databaseRelation';
import { useDatabaseProperty } from '@entity/databaseProperty';
import { useDatabaseEffectiveValue } from '@entity/databaseValue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItemId, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { toRefs } from 'vue';
import DatabasePropertyValueInline from './DatabasePropertyValueInline.vue';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    propertyId: DatabasePropertyId;
    parentRelation?: ParentRelation;
    itemId: DatabaseItemId;
  }>(),
  {},
);

const { documentId, propertyId, directoryPath, itemId } = toRefs(props);

const { property } = useDatabaseProperty(directoryPath, documentId, propertyId);

const { value, isLoading } = useDatabaseEffectiveValue(
  directoryPath,
  documentId,
  itemId,
  propertyId,
);
</script>

<template>
  <MDCircularProgressIndicator v-if="isLoading" :size="16" />

  <DatabasePropertyValueInline
    v-else
    :value="value"
    :property="property"
    :directory-path="directoryPath"
    :property-id="propertyId"
    :parent-relation="parentRelation"
  />
</template>
