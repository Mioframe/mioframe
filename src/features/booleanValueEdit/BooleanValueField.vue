<script setup lang="ts">
import type { BooleanProperty } from '@entity/databaseBoolean';
import { MDCheckboxField } from '@shared/ui/Checkbox';
import { isUndefined } from 'es-toolkit';
import { computed } from 'vue';

const { modelValue, property } = defineProps<{
  property: BooleanProperty;
  modelValue: unknown;
  disabled?: boolean;
  autofocus?: boolean;
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
  <MDCheckboxField
    v-model:model-value="value"
    :label="property.name"
    class="boolean-property-field"
    :indeterminate="property.indeterminate"
    :disabled="disabled"
    :autofocus="autofocus"
  />
</template>
