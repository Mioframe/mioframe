<script setup lang="ts">
import {
  RelationValueInline,
  type ParentRelation,
  type RelationProperty,
} from '@entity/databaseRelation';
import { useDatabaseViewSelection } from '@entity/databaseView';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { computed, toRef } from 'vue';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import ValueInline from './ValueInline.vue';

defineOptions({
  name: 'DatabaseRelationValueInline',
});

const props = defineProps<{
  value: unknown;
  directoryPath: string;
  property: RelationProperty;
  propertyId: DatabasePropertyId;
  parentRelation?: ParentRelation | undefined;
}>();

const emit = defineEmits<{
  click: [];
}>();

const relationDocumentId = computed(() => props.property.relation.documentId);
const relationViewId = computed(() => props.property.relation.viewId);

const { effectiveViewId } = useDatabaseViewSelection(
  toRef(() => props.directoryPath),
  relationDocumentId,
  relationViewId,
);

const onClick = () => {
  emit('click');
};
</script>

<template>
  <RelationValueInline
    :value="value"
    :property="property"
    :directory-path="directoryPath"
    :property-id="propertyId"
    :view-id="effectiveViewId"
    :parent-relation="parentRelation"
    @click="onClick"
  >
    <template
      #default="{
        relationDocumentId: relationDocHandle,
        relationDirectoryPath: relationDirectory,
        viewId,
        value: relationValue,
        parentRelation: relationParentRelation,
      }"
    >
      <DatabaseViewLayout
        :document-id="relationDocHandle"
        :path="relationDirectory"
        :view-id="viewId"
        :item-id-query="{ $in: relationValue }"
      >
        <template #value="{ propertyId: relationPropertyId, itemId: relationItemId }">
          <ValueInline
            :item-id="relationItemId"
            :document-id="relationDocHandle"
            :directory-path="relationDirectory"
            :property-id="relationPropertyId"
            :parent-relation="relationParentRelation"
          />
        </template>
      </DatabaseViewLayout>
    </template>
  </RelationValueInline>
</template>
