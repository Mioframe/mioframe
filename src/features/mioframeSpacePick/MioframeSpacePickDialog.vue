<script setup lang="ts">
import { MDButton } from '@shared/ui/Button';
import { MDDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';
import type { MioframeSpaceDialogState } from './usePickMioframeSpace';

defineProps<{
  state: MioframeSpaceDialogState;
  loading?: boolean | undefined;
}>();

const emit = defineEmits<{
  close: [];
  create: [];
  openExisting: [];
  createNewSpace: [];
  chooseAnotherLocation: [];
  useSelectedFolder: [];
  createSubfolder: [];
}>();
</script>

<template>
  <MDDialog
    v-if="state.kind === 'entry'"
    headline="Where should Mioframe store documents?"
    supporting-text="Create a dedicated folder for Mioframe documents. Mioframe will store your documents and service files inside that folder.\n\nA Mioframe space is a folder. You can copy, move, back it up, or sync it with Google Drive."
    apply-label="Create new space"
    cancel-label="Open existing space"
    has-cancel-action
    :loading="loading"
    @apply="emit('create')"
    @cancel="emit('openExisting')"
  >
    <template #icon>
      <MDSymbol name="folder_managed" />
    </template>
  </MDDialog>

  <MDDialog
    v-else-if="state.kind === 'create'"
    headline="Create Mioframe folder"
    supporting-text="Mioframe will create a dedicated folder and store documents inside it.\n\nRecommended: My Drive / Mioframe"
    apply-label="Create Mioframe folder"
    cancel-label="Choose another location"
    has-cancel-action
    :loading="loading"
    @apply="emit('createNewSpace')"
    @cancel="emit('chooseAnotherLocation')"
  >
    <template #icon>
      <MDSymbol name="create_new_folder" />
    </template>
  </MDDialog>

  <MDDialog
    v-else-if="state.kind === 'confirmUseFolder'"
    :headline="state.headline"
    :supporting-text="state.supportingText"
    :apply-label="state.confirmLabel"
    cancel-label="Cancel"
    has-cancel-action
    :loading="loading"
    @apply="emit('useSelectedFolder')"
    @cancel="emit('close')"
  >
    <template #icon>
      <MDSymbol name="folder_open" />
    </template>
  </MDDialog>

  <MDDialog
    v-else
    :headline="state.headline"
    :supporting-text="state.supportingText"
    :loading="loading"
    has-cancel-action
    apply-label="Use this folder"
    cancel-label="Cancel"
    @apply="emit('useSelectedFolder')"
    @cancel="emit('close')"
  >
    <template #icon>
      <MDSymbol name="warning" />
    </template>

    <template #actions>
      <MDButton
        label="Create Mioframe subfolder"
        color="text"
        :loading="loading"
        @click="emit('createSubfolder')"
      />
      <MDButton label="Cancel" color="text" :disabled="loading" @click="emit('close')" />
      <MDButton
        label="Use this folder"
        color="text"
        :loading="loading"
        @click="emit('useSelectedFolder')"
      />
    </template>
  </MDDialog>
</template>

<style scoped>
.md-button {
  white-space: normal;
}
</style>
