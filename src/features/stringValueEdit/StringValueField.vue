<script setup lang="ts">
import type { StringProperty } from '@entity/databaseString';
import { MDTextField } from '@shared/ui/TextField';
import { isNil } from 'es-toolkit';
import { toString } from 'es-toolkit/compat';
import { computed } from 'vue';

const { property, modelValue: value } = defineProps<{
  property: StringProperty;
  modelValue: unknown;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  keydown: [payload: KeyboardEvent];
}>();

const labelText = computed(() => property.name);

const vModel = computed({
  get: () => {
    if (isNil(value)) {
      return '';
    }
    return toString(value);
  },
  set: (v: string) => {
    emit('update:modelValue', v.trim());
  },
});
</script>

<template>
  <MDTextField
    v-model:model-value="vModel"
    :label-text="labelText"
    @keydown="$emit('keydown', $event)"
  />
</template>
