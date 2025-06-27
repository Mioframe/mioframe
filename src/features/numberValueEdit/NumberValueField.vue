<script setup lang="ts">
import type { NumberProperty } from '@entity/databaseNumber';
import { MDTextField } from '@shared/ui/TextField';
import { toNumber, toString } from 'es-toolkit/compat';
import { computed } from 'vue';

const { property, modelValue: value } = defineProps<{
  property: NumberProperty;
  modelValue: unknown;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
  keydown: [payload: KeyboardEvent];
}>();

const labelText = computed(() => property.name);

const vModel = computed({
  get: () => toString(value),
  set: (v: string) => {
    emit('update:modelValue', toNumber(v));
  },
});
</script>

<template>
  <MDTextField
    v-model:model-value="vModel"
    :label-text
    input-type="number"
    @keydown="$emit('keydown', $event)"
  />
</template>
