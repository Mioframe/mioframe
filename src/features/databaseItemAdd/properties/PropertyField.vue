<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import {
  PROPERTY_TYPE_STRING,
  type AnyProperty,
} from '../../../shared/lib/databaseDocument';
import PropertyStingField from './PropertyStingField.vue';

const props = defineProps<{
  property: AnyProperty;
  // eslint-disable-next-line vue/no-unused-properties -- use in useVModel
  value: any;
}>();

const emit = defineEmits<{
  'update:value': [value: any];
}>();

const vModel = useVModel(props, 'value', emit);
</script>

<template>
  <PropertyStingField
    v-if="property.type === PROPERTY_TYPE_STRING"
    v-model:value="vModel"
    :label="property.name"
  />

  <div v-else class="field">
    <div class="notification">
      property {{ property.name }} has no change field
    </div>
  </div>
</template>
