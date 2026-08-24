<script setup lang="ts">
import {
  RelationValueInline,
  type ParentRelation,
  type RelationProperty,
} from '@entity/databaseRelation';
import { useDatabaseViewSelection } from '@entity/databaseView';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { computed, toRef, useTemplateRef } from 'vue';
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

const relationDocumentId = computed(() => props.property.relation.documentId);
const relationViewId = computed(() => props.property.relation.viewId);

const { effectiveViewId } = useDatabaseViewSelection(
  toRef(() => props.directoryPath),
  relationDocumentId,
  relationViewId,
);

const scrollRoot = useTemplateRef<HTMLElement>('scrollRoot');
</script>

<template>
  <RelationValueInline
    class="database-relation-value-inline"
    :value="value"
    :property="property"
    :directory-path="directoryPath"
    :property-id="propertyId"
    :view-id="effectiveViewId"
    :parent-relation="parentRelation"
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
      <div ref="scrollRoot" class="database-relation-value-inline__scroll-root">
        <DatabaseViewLayout
          :document-id="relationDocHandle"
          :path="relationDirectory"
          :view-id="viewId"
          :item-id-query="{ $in: relationValue }"
          :scroll-root="scrollRoot"
          :vertical-surface-offset="0"
          :horizontal-surface-offset="0"
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
      </div>
    </template>
  </RelationValueInline>
</template>

<style lang="css" scoped>
.database-relation-value-inline {
  display: block;
  max-width: calc(100dvw - 64px);

  &__scroll-root {
    display: block;
    min-width: 0;
    width: 100%;
    max-height: calc(100dvh - 128px);
    overflow: auto;
  }
}
</style>
