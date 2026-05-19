<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import { usePickMioframeSpace } from './usePickMioframeSpace';

const {
  createDialogState,
  createSpace,
  loading,
  submitCreateSpaceName,
  cancelCreateSpace,
  openExistingSpaceFromConflict,
} = usePickMioframeSpace();
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
    :submit-space-name="submitCreateSpaceName"
    :open-existing-space="openExistingSpaceFromConflict"
    @cancel="cancelCreateSpace"
  />
</template>
