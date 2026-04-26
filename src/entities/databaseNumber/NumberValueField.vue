<script setup lang="ts">
import type { NumberProperty } from './model';
import { MDTextField } from '@shared/ui/TextField';
import { toNumber, toString } from 'es-toolkit/compat';
import { computed } from 'vue';

const { property, modelValue: value } = defineProps<{
  property: NumberProperty;
  modelValue: unknown;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
  keydown: [payload: KeyboardEvent];
}>();

const labelText = computed(() => property.name);

const vModel = computed<string | undefined>({
  get: () => (value == null ? undefined : toString(value)),
  set: (v) => {
    emit('update:modelValue', toNumber(v ?? ''));
  },
});

const onFieldKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};
</script>

<template>
  <MDTextField
    v-model:model-value="vModel"
    :label-text="labelText"
    input-type="number"
    :autofocus="autofocus"
    @keydown="onFieldKeydown"
  />
</template>
