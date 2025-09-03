<script setup lang="ts">
import { sessionUniqueId } from '@shared/lib/uniqueId';
import MDCheckbox from './MDCheckbox.vue';

defineProps<{
  disabled?: boolean;
  label: string;
  indeterminate?: boolean;
  error?: boolean;
  readonly?: boolean;
}>();

const modelValue = defineModel<boolean | undefined>();

const id = sessionUniqueId('BooleanPropertyField');
</script>

<template>
  <div class="md-boolean-field">
    <MDCheckbox
      :id="id"
      v-model:model-value="modelValue"
      :indeterminate="indeterminate"
      :disabled="disabled"
      :error="error"
      :readonly="readonly"
    />

    <label class="md-boolean-field__label" :for="id">
      {{ label }}
    </label>
  </div>
</template>

<style lang="css" scoped>
.md-boolean-field {
  display: flex;
  align-items: center;
  gap: 16px;

  &__label {
    cursor: pointer;
  }
}
</style>
