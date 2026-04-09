<script setup lang="ts" generic="T extends SelectOption = SelectOption">
import { computed, toRefs } from 'vue';
import { isNotNil } from 'es-toolkit';
import type { SelectOption } from './types';
import MDSelectBase from './MDSelectBase.vue';
import MDSelectOption from './MDSelectOption.vue';

const props = defineProps<{
  labelText: string;
  options: T[];
  supportingText?: string | undefined;
  type?: 'filled' | 'outlined' | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  multiple?: boolean | undefined;
}>();

const { options } = toRefs(props);

const modelValue = defineModel<T[]>({
  required: true,
});

defineSlots<{
  valueContainer: () => unknown;
}>();

const modelProxyValue = computed({
  get: () => modelValue.value.map(({ key }) => key),
  set: (keyList) => {
    modelValue.value = keyList
      .map((key) => options.value.find((option) => option.key === key))
      .filter(isNotNil);
  },
});
</script>

<template>
  <MDSelectBase
    v-model="modelProxyValue"
    :label-text="labelText"
    :supporting-text="supportingText"
    :type="type"
    :disabled="disabled"
    :error="error"
    :multiple="multiple"
  >
    <template #options>
      <MDSelectOption
        v-for="option in options"
        :key="option.key"
        :value="option.key"
        :label="option.label"
      />
    </template>
  </MDSelectBase>
</template>
