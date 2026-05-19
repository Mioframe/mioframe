<script setup lang="ts">
import { ref } from 'vue';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import { useCreateMioframeSpace, type CreateSpaceNameSubmitResult } from './useCreateMioframeSpace';

const createFlow = useCreateMioframeSpace();
const {
  createDialogState,
  createSpace,
  loading,
  submitCreateSpaceName,
  cancelCreateSpace,
  openExistingSpaceFromConflict,
} = createFlow;
const submitResult = ref<(CreateSpaceNameSubmitResult & { spaceName: string }) | undefined>(
  undefined,
);

const onSubmit = async (spaceName: string) => {
  submitResult.value = undefined;
  submitResult.value = {
    ...(await submitCreateSpaceName(spaceName)),
    spaceName,
  };
};

const onOpenExistingSpace = () => {
  void openExistingSpaceFromConflict();
};

const onCancel = () => {
  submitResult.value = undefined;
  cancelCreateSpace();
};
</script>

<template>
  <MDListItem
    is="button"
    headline="Create space"
    supporting-text="Choose where Mioframe should create a new folder for your documents."
    :lines="2"
    :disabled="loading"
    @click="createSpace"
  >
    <template #leadingIcon>
      <MDSymbol name="create_new_folder" />
    </template>
  </MDListItem>

  <MioframeSpaceCreateDialog
    v-if="createDialogState"
    :selected-location="createDialogState.selectedLocation"
    :loading="loading"
    :submit-result="submitResult"
    @submit="onSubmit"
    @open-existing-space="onOpenExistingSpace"
    @cancel="onCancel"
  />
</template>
