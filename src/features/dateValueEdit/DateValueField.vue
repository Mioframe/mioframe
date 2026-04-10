<script setup lang="ts">
import type { DateProperty } from '@entity/databaseDate';
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
</script>

<template>
  <MDTextField
    v-model:model-value="vModel"
    :label-text="labelText"
    input-type="date"
    :autofocus="autofocus"
    @keydown="$emit('keydown', $event)"
  />
</template>
