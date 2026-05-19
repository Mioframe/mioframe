<script setup lang="ts">
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import { usePickMioframeSpace } from './usePickMioframeSpace';

const {
  createFlowState,
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
  <template
    v-if="
      createFlowState.status === 'editing-name' ||
      createFlowState.status === 'checking-name' ||
      createFlowState.status === 'submitting' ||
      createFlowState.status === 'existing-space-conflict'
    "
  >
    <MioframeSpaceCreateDialog
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
  <template v-else />
</template>
