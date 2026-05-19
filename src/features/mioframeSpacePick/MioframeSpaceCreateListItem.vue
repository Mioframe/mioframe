<script setup lang="ts">
import { ref, toRef } from 'vue';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { useSnackbar } from '@shared/ui/Snackbar';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';
import {
  isDirectoryPickerSupported,
  showDirectoryPickerUnsupportedMessage,
} from './directoryPickerSupport';
import { buildCreateSpaceError } from './mioframeSpacePick.errors';

const { addSnackbar } = useSnackbar();
const loading = ref(false);
const parentHandle = ref<FileSystemDirectoryHandle | undefined>(undefined);
const isSupported = toRef(isDirectoryPickerSupported);

const handleUnexpectedPickerError = () => {
  const error = buildCreateSpaceError();

  addSnackbar({
    text: error.message,
  });
  reportHandledError(error, {
    feature: 'mioframeSpaceCreate',
    action: 'pickParentFolder',
  });
};

const createSpace = async () => {
  if (loading.value || parentHandle.value) {
    return;
  }

  if (!isSupported.value) {
    showDirectoryPickerUnsupportedMessage(addSnackbar);
    return;
  }

  loading.value = true;

  try {
    parentHandle.value = await window.showDirectoryPicker({
      mode: 'readwrite',
    });
  } catch (error) {
    if (!isUserFileSelectionCancel(error)) {
      handleUnexpectedPickerError();
    }
  } finally {
    loading.value = false;
  }
};

const resetCreateDialog = () => {
  parentHandle.value = undefined;
};
</script>

<template>
  <MDListItem
    is="button"
    headline="Create space"
    supporting-text="Choose where Mioframe should create a new folder for your documents."
    :lines="2"
    :disabled="loading || !!parentHandle"
    @click="createSpace"
  >
    <template #leadingIcon>
      <MDSymbol name="create_new_folder" />
    </template>
  </MDListItem>

  <MioframeSpaceCreateDialog
    v-if="parentHandle"
    :parent-handle="parentHandle"
    @created="resetCreateDialog"
    @opened-existing-space="resetCreateDialog"
    @canceled="resetCreateDialog"
  />
</template>
