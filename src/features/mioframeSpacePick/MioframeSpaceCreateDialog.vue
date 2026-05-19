<script setup lang="ts">
import { computed } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';

const modelValue = defineModel<string | undefined>('modelValue');

const props = defineProps<{
  selectedLocation: string;
  resultFolder: string;
  errorText?: string | undefined;
  loading?: boolean | undefined;
}>();

const emit = defineEmits<{
  apply: [];
  cancel: [];
}>();

const supportingText = computed(
  () =>
    props.errorText ?? 'Mioframe will create a folder with this name inside the selected location.',
);

const onApply = () => {
  emit('apply');
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <MDDialog
    headline="Name new space"
    supporting-text="Choose a name for the new Mioframe space."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    :loading="loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField
      v-model:model-value="modelValue"
      label-text="Space name"
      :error="!!errorText"
      :supporting-text="supportingText"
      autofocus
    />

    <div class="mioframe-space-create-dialog__details">
      <p class="mioframe-space-create-dialog__detail">Selected location: {{ selectedLocation }}</p>

      <p class="mioframe-space-create-dialog__detail">Space folder: {{ resultFolder }}</p>
    </div>
  </MDDialog>
</template>

<style scoped>
.mioframe-space-create-dialog {
  &__details {
    display: grid;
    gap: 8px;
  }

  &__detail {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-medium-font);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-size: var(--md-sys-typescale-body-medium-size);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  }
}
</style>
