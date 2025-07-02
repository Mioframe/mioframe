<script setup lang="ts">
import type { BooleanProperty } from '@entity/databaseBoolean';
import { uniqueId } from '@shared/lib/uniqueId';
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isUndefined } from 'es-toolkit';
import { computed } from 'vue';

const { modelValue, property } = defineProps<{
  property: BooleanProperty;
  modelValue: unknown;
  disabled?: boolean;
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

const id = uniqueId('BooleanPropertyField');
</script>

<template>
  <div class="boolean-property-field">
    <MDCheckbox :id v-model:model-value="value" indeterminate :disabled />

    <label class="boolean-property-field__label" :for="id">
      {{ property.name }}
    </label>
  </div>
</template>

<style lang="css" scoped>
.boolean-property-field {
  display: flex;
  align-items: center;
  gap: 16px;

  &__label {
    cursor: pointer;
  }
}
</style>
