<script setup lang="ts">
import type { DateProperty } from './date';
import { MDTextField } from '@shared/ui/TextField';
import { computed } from 'vue';

const { property, modelValue: value } = defineProps<{
  property: DateProperty;
  modelValue: unknown;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  keydown: [payload: KeyboardEvent];
}>();

const labelText = computed(() => property.name);

const vModel = computed<string | undefined>({
  get: () => (value == null ? undefined : String(value)),
  set: (v) => {
    emit('update:modelValue', v ?? '');
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
    input-type="date"
    :autofocus="autofocus"
    @keydown="onFieldKeydown"
  />
</template>
