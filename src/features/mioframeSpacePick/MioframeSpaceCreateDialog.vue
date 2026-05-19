<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { parseMioframeSpaceName } from './spaceNameValidation';
import type { CreateSpaceConflict } from './useCreateMioframeSpace';

const props = defineProps<{
  selectedLocation: string;
  loading: boolean;
  conflict: CreateSpaceConflict | undefined;
  errorText: string | undefined;
}>();

const emit = defineEmits<{
  create: [spaceName: string];
  openExistingSpace: [];
  clearError: [];
  canceled: [];
}>();

const SPACE_FOLDER_PLACEHOLDER = '<space name>';

const spaceName = ref<string | undefined>(undefined);

const normalizedSpaceName = computed(() => {
  const parsedName = parseMioframeSpaceName(spaceName.value);
  return parsedName.success ? parsedName.name : (spaceName.value?.trim() ?? '');
});
const hasExistingSpaceConflict = computed(
  () => props.conflict?.submittedSpaceName === normalizedSpaceName.value,
);

const resultFolder = computed(
  () => `${props.selectedLocation} / ${normalizedSpaceName.value || SPACE_FOLDER_PLACEHOLDER}`,
);

const supportingText = computed(() => {
  if (props.errorText) {
    return props.errorText;
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
  if (props.errorText) {
    emit('clearError');
  }
});

const onCancel = () => {
  emit('canceled');
};

const onApply = () => {
  if (hasExistingSpaceConflict.value) {
    emit('openExistingSpace');
    return;
  }

  emit('create', spaceName.value ?? '');
};
</script>

<template>
  <MDDialog
    :headline="headline"
    :supporting-text="dialogSupportingText"
    :apply-label="applyLabel"
    cancel-label="Cancel"
    has-cancel-action
    :loading="props.loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField
      v-model:model-value="spaceName"
      label-text="Space name"
      :error="!!props.errorText"
      :supporting-text="supportingText"
      autofocus
    />

    <div class="mioframe-space-create-dialog__details">
      <p class="mioframe-space-create-dialog__detail">
        Selected location: {{ props.selectedLocation }}
      </p>

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
