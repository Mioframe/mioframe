<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import {
  getMioframeSpaceNameError,
  normalizeMioframeSpaceName,
} from './spaceNameValidation';
import { usePickMioframeSpace } from './usePickMioframeSpace';

const SPACE_FOLDER_PLACEHOLDER = '<space name>';
const EXISTING_ORDINARY_FOLDER_ERROR =
  'A folder with this name already exists. Choose another name.';

const {
  createDialogState,
  loading,
  submitCreateSpaceName,
  cancelCreateSpace,
  openExistingSpaceFromConflict,
} = usePickMioframeSpace();

const spaceName = ref<string | undefined>(undefined);
const errorText = ref<string | undefined>(undefined);
const existingSpaceConflictName = ref<string | undefined>(undefined);

const selectedLocation = computed(() => createDialogState.value?.selectedLocation ?? '');
const normalizedSpaceName = computed(() => normalizeMioframeSpaceName(spaceName.value));
const hasExistingSpaceConflict = computed(
  () =>
    existingSpaceConflictName.value !== undefined &&
    existingSpaceConflictName.value === normalizedSpaceName.value,
);

const resultFolder = computed(
  () => `${selectedLocation.value} / ${normalizedSpaceName.value || SPACE_FOLDER_PLACEHOLDER}`,
);

const supportingText = computed(() => {
  if (errorText.value) {
    return errorText.value;
  }

  if (hasExistingSpaceConflict.value) {
    return 'A Mioframe space with this name already exists here. Open the existing space, or change the name to go back to creating a new one.';
  }

  return 'Mioframe will create a folder with this name inside the selected location.';
});

const headline = computed(() =>
  hasExistingSpaceConflict.value ? 'Space already exists' : 'Name new space',
);

const dialogSupportingText = computed(() =>
  hasExistingSpaceConflict.value
    ? 'This name already belongs to an existing Mioframe space in the selected location.'
    : 'Choose a name for the new Mioframe space.',
);

const applyLabel = computed(() =>
  hasExistingSpaceConflict.value ? 'Open existing space' : 'Create',
);

watch(spaceName, () => {
  errorText.value = undefined;
});

const onApply = async () => {
  if (hasExistingSpaceConflict.value) {
    await openExistingSpaceFromConflict();
    return;
  }

  const fieldError = getMioframeSpaceNameError(spaceName.value);

  if (fieldError) {
    errorText.value = fieldError;
    return;
  }

  const result = await submitCreateSpaceName(normalizedSpaceName.value);

  if (result.status === 'existing-space-conflict') {
    existingSpaceConflictName.value = normalizedSpaceName.value;
    return;
  }

  existingSpaceConflictName.value = undefined;

  if (result.status === 'ordinary-folder-exists') {
    errorText.value = EXISTING_ORDINARY_FOLDER_ERROR;
    return;
  }

  if (result.status === 'invalid-folder-name') {
    errorText.value = 'Enter a valid folder name.';
  }
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
    @cancel="cancelCreateSpace"
  >
    <MDTextField
      v-model:model-value="spaceName"
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
