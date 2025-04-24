<script setup lang="ts">
import type { NumberProperty } from '@entity/numberProperty';
import { MDTextField } from '@shared/ui/TextField';
import { toNumber } from 'lodash-es';
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
  get: () => toNumber(value).toString(),
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
