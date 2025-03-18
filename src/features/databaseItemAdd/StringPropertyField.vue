<script setup lang="ts">
import type { StringProperty } from '@entity/stringProperty';
import { MDTextField } from '@shared/ui/TextField';
import { toString } from 'lodash-es';
import { computed } from 'vue';

const { property, modelValue: value } = defineProps<{
  property: StringProperty;
  modelValue: unknown;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const labelText = computed(() => property.name);

const vModel = computed({
  get: () => toString(value),
  set: (v: string) => {
    emit('update:modelValue', v);
  },
});
</script>

<template>
  <MDTextField v-model:model-value="vModel" :label-text />
</template>
