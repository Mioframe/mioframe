<script setup lang="ts">
import { BooleanInline, PROPERTY_TYPE_BOOLEAN } from '@entity/databaseBoolean';
import { DateValueInline, PROPERTY_TYPE_DATE } from '@entity/databaseDate';
import {
  NumberValueInline,
  PROPERTY_TYPE_NUMBER,
} from '@entity/databaseNumber';
import {
  RelationValueInline,
  zodRelationProperty,
} from '@entity/databaseRelation';
import {
  PROPERTY_TYPE_STRING,
  StringValueInline,
} from '@entity/databaseString';
import type { GeneralProperty } from '@shared/lib/databaseDocument';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';

const {} = defineProps<{
  property: GeneralProperty;
  value: unknown;
  editable?: boolean;
  directory: DirectoryFSEntry;
}>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <BooleanInline
    v-if="property?.type === PROPERTY_TYPE_BOOLEAN"
    :value="value"
    :editable="editable"
    @click="emit('click')"
  />

  <NumberValueInline
    v-else-if="property?.type === PROPERTY_TYPE_NUMBER"
    :value="value"
    @click="emit('click')"
  />

  <StringValueInline
    v-else-if="property?.type === PROPERTY_TYPE_STRING"
    :value="value"
    @click="emit('click')"
  />

  <DateValueInline
    v-else-if="property?.type === PROPERTY_TYPE_DATE"
    :value="value"
    @click="emit('click')"
  />

  <RelationValueInline
    v-else-if="zodIs(property, zodRelationProperty)"
    :value="value"
    :property="property"
    :directory="directory"
    @click="emit('click')"
  >
    <template
      #default="{
        docHandle,
        directory: relationDirectory,
        viewId,
        value: relationValue,
      }"
    >
      <DatabaseViewLayout
        :doc-handle="docHandle"
        :directory="relationDirectory"
        :view-id="viewId"
        :item-id-query="{ $in: relationValue }"
      />
    </template>
  </RelationValueInline>
</template>
