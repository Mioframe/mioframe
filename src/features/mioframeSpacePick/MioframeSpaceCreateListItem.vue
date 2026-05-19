<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import { usePickMioframeSpace } from './usePickMioframeSpace';

const {
  createFlowState,
  createSpace,
  loading,
  updateCreateSpaceName,
  submitCreateSpace,
  cancelCreateSpace,
  openExistingSpaceFromConflict,
} = usePickMioframeSpace();

const onApply = () => {
  if (createFlowState.value.status === 'existing-space-conflict') {
    void openExistingSpaceFromConflict();
    return;
  }

  void submitCreateSpace();
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
    v-if="
      createFlowState.status === 'editing-name' ||
      createFlowState.status === 'checking-name' ||
      createFlowState.status === 'submitting' ||
      createFlowState.status === 'existing-space-conflict'
    "
    :model-value="createFlowState.spaceName"
    :mode="
      createFlowState.status === 'existing-space-conflict' ? 'existing-space-conflict' : 'create'
    "
    :error-text="createFlowState.errorText"
    :selected-location="createFlowState.selectedLocation"
    :result-folder="createFlowState.resultFolder"
    :loading="loading"
    @update:model-value="updateCreateSpaceName"
    @apply="onApply"
    @cancel="cancelCreateSpace"
  />
</template>
