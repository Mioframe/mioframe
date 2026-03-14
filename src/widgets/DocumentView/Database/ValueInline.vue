<script setup lang="ts">
import { BooleanInline, PROPERTY_TYPE_BOOLEAN } from '@entity/databaseBoolean';
import { DateValueInline, PROPERTY_TYPE_DATE } from '@entity/databaseDate';
import {
  NumberValueInline,
  PROPERTY_TYPE_NUMBER,
} from '@entity/databaseNumber';
import type { ParentRelation } from '@entity/databaseRelation';
import {
  PROPERTY_TYPE_RELATION,
  RelationValueInline,
} from '@entity/databaseRelation';
import {
  PROPERTY_TYPE_STRING,
  StringValueInline,
} from '@entity/databaseString';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import { computed, toRefs } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDatabaseProperty } from '@entity/databaseProperty';
import { useDatabaseValue } from '@entity/databaseValue';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';

const props = defineProps<{
  editable?: boolean;
  directoryPath: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
  parentRelation?: ParentRelation;
  itemId: DatabaseItemId;
}>();

const { documentId, propertyId, directoryPath, itemId } = toRefs(props);

const { property } = useDatabaseProperty(directoryPath, documentId, propertyId);

const emit = defineEmits<{ click: [] }>();

const { data: stateValue, isLoading } = useDatabaseValue(
  directoryPath,
  documentId,
  itemId,
  propertyId,
);

const printValue = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- stateValue.value can be undefined at runtime
  return stateValue.value ?? property.value?.default;
});

// todo: нужна версия без itemId для рендера значений в фильтрах
</script>

<template>
  <MDCircularProgressIndicator v-if="isLoading" :size="16" />

  <BooleanInline
    v-else-if="property?.type === PROPERTY_TYPE_BOOLEAN"
    :value="printValue"
    :path="directoryPath"
    :editable="editable"
    :document-id="documentId"
    :property-id="propertyId"
    @click="emit('click')"
  />

  <NumberValueInline
    v-else-if="property?.type === PROPERTY_TYPE_NUMBER"
    :value="printValue"
    @click="emit('click')"
  />

  <StringValueInline
    v-else-if="property?.type === PROPERTY_TYPE_STRING"
    :value="printValue"
    @click="emit('click')"
  />

  <DateValueInline
    v-else-if="property?.type === PROPERTY_TYPE_DATE"
    :value="printValue"
    @click="emit('click')"
  />

  <RelationValueInline
    v-else-if="property?.type === PROPERTY_TYPE_RELATION"
    :value="printValue"
    :document-id="documentId"
    :property-id="propertyId"
    :directory-path="directoryPath"
    :parent-relation="parentRelation"
    @click="emit('click')"
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
        <template
          #value="{ propertyId: relationPropertyId, itemId: relationItemId }"
        >
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
