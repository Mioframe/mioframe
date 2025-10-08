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
import type { EntryPath } from '@shared/lib/fileSystem';
import { computed, toRefs } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import { DomainError } from '@shared/lib/error';
import { useDatabaseDataClient } from '@entity/databaseData/client';
import { strictRecordGet } from '@shared/lib/strictRecord';

const props = defineProps<{
  editable?: boolean;
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
  parentRelation?: ParentRelation;
  itemId: DatabaseItemId;
}>();

const { documentId, propertyId, directoryPath, itemId } = toRefs(props);

const {
  getProperty: { get: getProperty },
} = useDatabasePropertiesClient();

const property = computed(() =>
  getProperty(directoryPath.value, documentId.value, propertyId.value),
);

const emit = defineEmits<{ click: [] }>();

const {
  getItem: { get: getItem },
} = useDatabaseDataClient();

const item = computed(() =>
  getItem(directoryPath.value, documentId.value, itemId.value),
);

const stateValue = computed(() =>
  item.value
    ? item.value instanceof DomainError
      ? undefined
      : strictRecordGet(item.value, propertyId.value)
    : undefined,
);

const printValue = computed(() => {
  if (stateValue.value instanceof DomainError) {
    return undefined;
  }

  if (property.value instanceof DomainError) {
    return undefined;
  }

  return stateValue.value ?? property.value?.default;
});
</script>

<template>
  <!-- eslint-disable-next-line prettier/prettier -- for correct code highlighting -->
  <span v-if="(property instanceof DomainError)">{{ property.message }}</span>

  <BooleanInline
    v-else-if="property?.type === PROPERTY_TYPE_BOOLEAN"
    :value="printValue"
    :directory-path="directoryPath"
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
        :directory-path="relationDirectory"
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
