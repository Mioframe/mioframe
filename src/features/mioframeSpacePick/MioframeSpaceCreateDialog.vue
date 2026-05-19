<script setup lang="ts">
import { computed } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';

const modelValue = defineModel<string | undefined>('modelValue');

const props = defineProps<{
  mode?: 'create' | 'existing-space-conflict' | undefined;
  selectedLocation: string;
  resultFolder: string;
  errorText?: string | undefined;
  loading?: boolean | undefined;
}>();

const emit = defineEmits<{
  apply: [];
  cancel: [];
}>();

const supportingText = computed(() => {
  if (props.errorText) {
    return props.errorText;
  }

  if (props.mode === 'existing-space-conflict') {
    return 'A Mioframe space with this name already exists in the selected location. Open it or choose a different name.';
  }

  return 'Mioframe will create a folder with this name inside the selected location.';
});

const headline = computed(() =>
  props.mode === 'existing-space-conflict' ? 'Space already exists' : 'Name new space',
);

const dialogSupportingText = computed(() =>
  props.mode === 'existing-space-conflict'
    ? 'Choose a different name or open the existing Mioframe space.'
    : 'Choose a name for the new Mioframe space.',
);

const applyLabel = computed(() =>
  props.mode === 'existing-space-conflict' ? 'Open space' : 'Create',
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
    :headline="headline"
    :supporting-text="dialogSupportingText"
    :apply-label="applyLabel"
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
