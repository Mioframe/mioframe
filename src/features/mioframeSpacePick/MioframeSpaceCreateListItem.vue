<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import { useMioframeSpaceParentPicker } from './useMioframeSpaceParentPicker';

const { loading, parentHandle, pickParentDirectory, resetParentDirectory } =
  useMioframeSpaceParentPicker();
</script>

<template>
  <MDListItem
    mode="single-action"
    label-text="Create space"
    supporting-text="Choose where Mioframe should create a new folder for your documents."
    :disabled="loading || !!parentHandle"
    @action="pickParentDirectory"
  >
    <template #leading>
      <MDSymbol name="create_new_folder" />
    </template>
  </MDListItem>

  <MioframeSpaceCreateDialog
    v-if="parentHandle"
    :parent-handle="parentHandle"
    @completed="resetParentDirectory"
    @canceled="resetParentDirectory"
  />
</template>
