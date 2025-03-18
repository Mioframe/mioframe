<script setup lang="ts">
import { MDTextField } from '@shared/ui/TextField';
import { isString } from 'lodash-es';
import { computed, ref } from 'vue';

const stateValue = ref<string>();

const props = defineProps<{
  value?: unknown;
  label: string;
}>();

const emit = defineEmits<{
  'update:value': [value?: string];
  keydown: [payload: KeyboardEvent];
}>();

const modelValue = computed<string | undefined>({
  get: () => (isString(props.value) ? props.value : stateValue.value),
  set: (v) => {
    stateValue.value = v;
    emit('update:value', stateValue.value);
  },
});
</script>

<template>
  <MDTextField
    v-model:model-value="modelValue"
    :label-text="label"
    @keydown="$emit('keydown', $event)"
  />
</template>
