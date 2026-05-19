<script setup lang="ts">
import { ref, toRef } from 'vue';
import { isFunction } from 'es-toolkit';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { useSnackbar } from '@shared/ui/Snackbar';
import MioframeSpaceCreateDialog from './MioframeSpaceCreateDialog.vue';

const UNSUPPORTED_MESSAGE = 'Your browser does not support choosing folders for Mioframe spaces';

const { addSnackbar } = useSnackbar();
const loading = ref(false);
const parentHandle = ref<FileSystemDirectoryHandle | undefined>(undefined);
const isSupported = toRef(
  () => 'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
);

const showUnsupportedMessage = () => {
  addSnackbar({
    text: UNSUPPORTED_MESSAGE,
    actionLabel: 'More details',
    timeout: 5e3,
    callback: () => {
      window.open(
        'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker',
        '_blank',
      );
    },
  });
};

const createSpace = async () => {
  if (loading.value || parentHandle.value) {
    return;
  }

  if (!isSupported.value) {
    showUnsupportedMessage();
    return;
  }

  loading.value = true;

  try {
    parentHandle.value = await window.showDirectoryPicker({
      mode: 'readwrite',
    });
  } catch (error) {
    if (!isUserFileSelectionCancel(error)) {
      throw error;
    }
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
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
    @close="closeDialog"
  />
</template>
