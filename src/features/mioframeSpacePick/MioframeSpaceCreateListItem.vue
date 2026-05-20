<script setup lang="ts">
import { computed } from 'vue';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import { useCreateMioframeSpace } from './useCreateMioframeSpace';

const {
  loading,
  parentHandle,
  pickParentDirectory,
  resetCreateDialog,
  checkCreateSpaceNameAvailability,
  createSpace,
  openExistingSpace,
} = useCreateMioframeSpace();

const selectedLocation = computed(() => parentHandle.value?.name ?? '');
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
    :check-create-space-name-availability="checkCreateSpaceNameAvailability"
    :create-space="createSpace"
    :open-existing-space="openExistingSpace"
    @completed="resetCreateDialog"
    @canceled="resetCreateDialog"
  />
</template>
