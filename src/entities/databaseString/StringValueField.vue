<script setup lang="ts">
import type { StringProperty } from './string';
import { MDTextField } from '@shared/ui/TextField';
import { isNil } from 'es-toolkit';
import { toString } from 'es-toolkit/compat';
import { computed } from 'vue';

const {
  property,
  modelValue: value,
  label,
} = defineProps<{
  property: StringProperty;
  modelValue: unknown;
  label?: string | undefined;
  autofocus?: boolean;
  size?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  keydown: [payload: KeyboardEvent];
}>();

const labelText = computed(() => label ?? property.name);

const vModel = computed<string | undefined>({
  get: () => {
    if (isNil(value)) {
      return undefined;
    }
    return toString(value);
  },
  set: (v) => {
    emit('update:modelValue', v ?? '');
  },
});

const onKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};
</script>

<template>
  <MDTextField
    v-model:model-value="vModel"
    :label-text="labelText"
    :autofocus="autofocus"
    :size="size"
    @keydown="onKeydown"
  />
</template>
