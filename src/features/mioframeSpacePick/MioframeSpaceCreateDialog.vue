<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { parseMioframeSpaceName } from './spaceNameValidation';
import type { CreateSpaceNameIssue } from './useCreateMioframeSpace';

const props = defineProps<{
  selectedLocation: string;
  loading: boolean;
  checkCreateSpaceNameAvailability: (
    normalizedName: string,
  ) => Promise<CreateSpaceNameIssue | undefined>;
  createSpace: (normalizedName: string) => Promise<boolean>;
  openExistingSpace: (targetHandle: FileSystemDirectoryHandle) => Promise<boolean>;
}>();

const emit = defineEmits<{
  completed: [];
  canceled: [];
}>();

const SPACE_FOLDER_PLACEHOLDER = '<space name>';

const spaceName = ref<string | undefined>(undefined);
const fieldIssue = ref<CreateSpaceNameIssue | undefined>(undefined);

const previewSpaceName = computed(() => spaceName.value?.trim() ?? '');
const activeExistingSpaceIssue = computed(() => {
  if (fieldIssue.value?.kind !== 'existing-space') {
    return undefined;
  }

  return fieldIssue.value.normalizedName === previewSpaceName.value ? fieldIssue.value : undefined;
});

const resultFolder = computed(
  () => `${props.selectedLocation} / ${previewSpaceName.value || SPACE_FOLDER_PLACEHOLDER}`,
);

const supportingText = computed(() => {
  if (fieldIssue.value) {
    return fieldIssue.value.text;
  }

  return 'Mioframe will create a folder with this name inside the selected location.';
});

const headline = computed(() =>
  activeExistingSpaceIssue.value ? 'Space already exists' : 'Name new space',
);

const dialogSupportingText = computed(() =>
  activeExistingSpaceIssue.value
    ? 'This name already belongs to an existing Mioframe space in the selected location.'
    : 'Choose a name for the new Mioframe space.',
);

const applyLabel = computed(() =>
  activeExistingSpaceIssue.value ? 'Open existing space' : 'Create',
);

const onSpaceNameChange = (value: string | undefined) => {
  spaceName.value = value;
  fieldIssue.value = undefined;
};

const onCancel = () => {
  emit('canceled');
};

const onApply = async () => {
  if (activeExistingSpaceIssue.value) {
    const didOpen = await props.openExistingSpace(activeExistingSpaceIssue.value.targetHandle);

    if (didOpen) {
      emit('completed');
    }

    return;
  }

  const parsedName = parseMioframeSpaceName(spaceName.value);

  if (!parsedName.success) {
    fieldIssue.value = {
      kind: 'text',
      text: parsedName.error,
    };
    return;
  }

  let availabilityIssue: CreateSpaceNameIssue | undefined;

  try {
    availabilityIssue = await props.checkCreateSpaceNameAvailability(parsedName.name);
  } catch {
    return;
  }

  fieldIssue.value = availabilityIssue;

  if (availabilityIssue) {
    return;
  }

  const didCreate = await props.createSpace(parsedName.name);

  if (didCreate) {
    emit('completed');
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
    :loading="props.loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField
      :model-value="spaceName"
      label-text="Space name"
      :error="!!fieldIssue"
      :supporting-text="supportingText"
      autofocus
      @update:model-value="onSpaceNameChange"
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
