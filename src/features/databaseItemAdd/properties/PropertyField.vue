<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import {
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_STRING,
  type AnyProperty,
} from '../../../shared/lib/databaseDocument';
import PropertyStingField from './PropertyStingField.vue';
import PropertyNumberField from './PropertyNumberField.vue';
import PropertyBooleanField from './PropertyBooleanField.vue';

const props = defineProps<{
  property: AnyProperty;
  // eslint-disable-next-line vue/no-unused-properties -- use in useVModel
  value: any;
}>();

const emit = defineEmits<{
  'update:value': [value: any]; // todo: попробовать any заменить на тип
}>();

const vModel = useVModel(props, 'value', emit);
</script>

<template>
  <PropertyStingField
    v-if="property.type === PROPERTY_TYPE_STRING"
    v-model:value="vModel"
    :label="property.name"
  />

  <PropertyNumberField
    v-else-if="property.type === PROPERTY_TYPE_NUMBER"
    v-model:value="vModel"
    :label="property.name"
  />

  <PropertyBooleanField
    v-else-if="property.type === PROPERTY_TYPE_BOOLEAN"
    v-model:value="vModel"
    :label="property.name"
  />
</template>
