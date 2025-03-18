<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isUndefined } from 'lodash-es';
import { computed } from 'vue';

const { modelValue } = defineProps<{
  modelValue: unknown;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean | undefined];
}>();

const value = computed({
  get: () => (isUndefined(modelValue) ? modelValue : !!modelValue),
  set: (v: boolean | undefined) => {
    emit('update:modelValue', v);
  },
});
</script>

<template>
  <MDCheckbox v-model:model-value="value" />
</template>
