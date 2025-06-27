<script setup lang="ts">
import type { DateProperty } from '@entity/databaseDate';
import { MDTextField } from '@shared/ui/TextField';
import { computed } from 'vue';

const { property, modelValue: value } = defineProps<{
  property: DateProperty;
  modelValue: unknown;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  keydown: [payload: KeyboardEvent];
}>();

const labelText = computed(() => property.name);

const vModel = computed({
  get: () => String(value),
  set: (v: string) => {
    emit('update:modelValue', v);
  },
});
</script>

<template>
  <MDTextField
    v-model:model-value="vModel"
    :label-text
    input-type="date"
    @keydown="$emit('keydown', $event)"
  />
</template>
