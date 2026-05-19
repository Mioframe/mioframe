<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import { useCreateMioframeSpace } from './useCreateMioframeSpace';

const {
  loading,
  parentHandle,
  conflict,
  pickParentDirectory,
  resetCreateDialog,
  submitCreateSpaceName,
  openExistingSpaceFromConflict,
} = useCreateMioframeSpace();
const errorText = ref<string | undefined>(undefined);

const selectedLocation = computed(() => parentHandle.value?.name ?? '');

const onCreate = async (spaceName: string) => {
  const result = await submitCreateSpaceName(spaceName);

  if (result.status === 'created') {
    resetCreateDialog();
    errorText.value = undefined;
    return;
  }

  if (result.status === 'field-error') {
    errorText.value = result.fieldMessage;
    return;
  }

  errorText.value = undefined;
};

const onOpenExistingSpace = async () => {
  const result = await openExistingSpaceFromConflict();

  if (result.status === 'opened-existing-space') {
    resetCreateDialog();
    errorText.value = undefined;
  }
};

const onCancel = () => {
  errorText.value = undefined;
  resetCreateDialog();
};

const onClearError = () => {
  errorText.value = undefined;
};
</script>

<template>
  <MDListItem
    is="button"
    headline="Create space"
    supporting-text="Choose where Mioframe should create a new folder for your documents."
    :lines="2"
    :disabled="loading || !!parentHandle"
    @click="pickParentDirectory"
  >
    <template #leadingIcon>
      <MDSymbol name="create_new_folder" />
    </template>
  </MDListItem>

  <MioframeSpaceCreateDialog
    v-if="parentHandle"
    :selected-location="selectedLocation"
    :loading="loading"
    :conflict="conflict"
    :error-text="errorText"
    @create="onCreate"
    @open-existing-space="onOpenExistingSpace"
    @clear-error="onClearError"
    @canceled="onCancel"
  />
</template>
