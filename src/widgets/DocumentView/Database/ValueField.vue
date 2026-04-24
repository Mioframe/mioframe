<script setup lang="ts">
import { useDatabaseProperty } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import type { ClassValue } from 'vue';
import { toRefs } from 'vue';
import DatabasePropertyValueField from './DatabasePropertyValueField.vue';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    propertyId: DatabasePropertyId;
    value: unknown;
    class?: ClassValue;
    autofocus?: boolean;
    inputSize?: number;
  }>(),
  {
    inputSize: 0,
  },
);

const emit = defineEmits<{
  'update:value': [v: unknown];
  'update:property': [v: DatabaseUnknownProperty];
  keydown: [e: KeyboardEvent];
}>();

const { directoryPath: path, documentId, propertyId } = toRefs(props);

const { property } = useDatabaseProperty(path, documentId, propertyId);

const onUpdateValue = (value: unknown) => {
  emit('update:value', value);
};

const onUpdateProperty = (property: DatabaseUnknownProperty) => {
  emit('update:property', property);
};

const onKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};
</script>

<template>
  <DatabasePropertyValueField
    :value="value"
    :property="property"
    :directory-path="path"
    :class="props.class"
    :autofocus="autofocus"
    :input-size="props.inputSize"
    @update:value="onUpdateValue"
    @update:property="onUpdateProperty"
    @keydown="onKeydown"
  />
</template>
