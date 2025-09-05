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
import {
  useDatabasePropertiesMap,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { computed, toRefs } from 'vue';
import type { AMDocHandle } from '@shared/lib/automerge';

const props = defineProps<{
  value: unknown;
  editable?: boolean;
  directory: DirectoryFSEntry;
  docHandle: AMDocHandle;
  propertyId: DatabasePropertyId;
  parentRelation?: ParentRelation;
}>();

const { value, docHandle, propertyId } = toRefs(props);

const propertiesMap = useDatabasePropertiesMap(docHandle);

const property = computed(() => propertiesMap.get(propertyId.value));

const emit = defineEmits<{ click: [] }>();

const printValue = computed(() => value.value ?? property.value?.default);
</script>

<template>
  <BooleanInline
    v-if="property?.type === PROPERTY_TYPE_BOOLEAN"
    :value="printValue"
    :editable="editable"
    :doc-handle="docHandle"
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
    :doc-handle="docHandle"
    :property-id="propertyId"
    :directory="directory"
    :parent-relation="parentRelation"
    @click="emit('click')"
  >
    <template
      #default="{
        relationDocHandle,
        relationDirectory: relationDirectory,
        viewId,
        value: relationValue,
        parentRelation: relationParentRelation,
      }"
    >
      <DatabaseViewLayout
        :doc-handle="relationDocHandle"
        :directory="relationDirectory"
        :view-id="viewId"
        :item-id-query="{ $in: relationValue }"
      >
        <template #value="{ item, propertyId: relationPropertyId }">
          <ValueInline
            :value="item[relationPropertyId]"
            :doc-handle="relationDocHandle"
            :directory="relationDirectory"
            :property-id="relationPropertyId"
            :parent-relation="relationParentRelation"
          />
        </template>
      </DatabaseViewLayout>
    </template>
  </RelationValueInline>
</template>
