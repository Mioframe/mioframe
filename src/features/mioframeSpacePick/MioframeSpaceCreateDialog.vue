<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import {
  DiagnosticsErrorPrompt,
  useDiagnosticsErrorPromptEligibility,
} from '@feature/diagnosticsErrorPrompt';
import { parseMioframeSpaceName } from './spaceNameValidation';
import { useCreateMioframeSpace, type CreateSpaceFieldIssue } from './useCreateMioframeSpace';

const props = defineProps<{
  parentHandle: FileSystemDirectoryHandle;
}>();

const emit = defineEmits<{
  completed: [];
  canceled: [];
}>();

const SPACE_FOLDER_PLACEHOLDER = '<space name>';
const {
  loading,
  isDiagnosticsPromptVisible,
  clearDiagnosticsPrompt,
  checkCreateSpaceNameAvailability,
  createSpace,
  openExistingSpace,
} = useCreateMioframeSpace(() => props.parentHandle);

// Local inline prompt only; dropping it on unmount (cancel/completed/closed) prevents an
// earlier create-space error from resurfacing on reopen.
onUnmounted(() => {
  clearDiagnosticsPrompt();
});

const { isDiagnosticsErrorPromptEligible } = useDiagnosticsErrorPromptEligibility();
const isInlineDiagnosticsPromptVisible = computed(
  () => isDiagnosticsPromptVisible.value && isDiagnosticsErrorPromptEligible.value,
);

const spaceName = ref<string | undefined>(undefined);
const fieldIssue = ref<CreateSpaceFieldIssue | undefined>(undefined);

const previewSpaceName = computed(() => spaceName.value?.trim() ?? '');
const activeExistingSpaceIssue = computed(() => {
  if (!fieldIssue.value?.existingSpace) {
    return undefined;
  }

  return fieldIssue.value.existingSpace.normalizedName === previewSpaceName.value
    ? fieldIssue.value.existingSpace
    : undefined;
});

const resultFolder = computed(
  () => `${props.parentHandle.name} / ${previewSpaceName.value || SPACE_FOLDER_PLACEHOLDER}`,
);

const supportingText = computed(() => {
  if (fieldIssue.value) {
    return fieldIssue.value.message;
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
    const didOpen = await openExistingSpace(activeExistingSpaceIssue.value.handle);

    if (didOpen) {
      emit('completed');
    }

    return;
  }

  const parsedName = parseMioframeSpaceName(spaceName.value);

  if (!parsedName.success) {
    fieldIssue.value = {
      message: parsedName.error,
    };
    return;
  }

  const availabilityIssue = await checkCreateSpaceNameAvailability(parsedName.name);

  if (availabilityIssue === false) {
    return;
  }

  if (availabilityIssue) {
    fieldIssue.value = availabilityIssue;
    return;
  }

  const createResult = await createSpace(parsedName.name);

  if (createResult === true) {
    emit('completed');
    return;
  }

  if (createResult) {
    fieldIssue.value = createResult;
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
        Selected location: {{ props.parentHandle.name }}
      </p>

      <p class="mioframe-space-create-dialog__detail">Space folder: {{ resultFolder }}</p>
    </div>

    <DiagnosticsErrorPrompt
      v-if="isInlineDiagnosticsPromptVisible"
      variant="inline"
      @enabled="clearDiagnosticsPrompt"
      @dismissed="clearDiagnosticsPrompt"
    />
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
