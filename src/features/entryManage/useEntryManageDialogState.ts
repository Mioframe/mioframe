import type { Ref } from 'vue';
import { ref, watch } from 'vue';

/**
 * Owns open/close state for entry-manage's local dialogs (create directory, create document,
 * rename). Resets all dialogs when the path changes.
 * @param path - Reactive entry path used by the dialog-reset watcher.
 * @returns Dialog visibility refs and open/close handlers for entry-manage's local dialogs.
 */
export const useEntryManageDialogState = (path: Ref<string>) => {
  const showCreateDirectoryDialog = ref(false);
  const showCreateDocumentDialog = ref(false);
  const showRenameDialog = ref(false);

  watch(path, () => {
    showCreateDirectoryDialog.value = false;
    showCreateDocumentDialog.value = false;
    showRenameDialog.value = false;
  });

  const onSelectCreateDirectory = () => {
    showCreateDirectoryDialog.value = true;
  };
  const onSelectCreateDocument = () => {
    showCreateDocumentDialog.value = true;
  };
  const onSelectRename = () => {
    showRenameDialog.value = true;
  };

  const onCloseCreateDirectoryDialog = () => {
    showCreateDirectoryDialog.value = false;
  };
  const onCloseCreateDocumentDialog = () => {
    showCreateDocumentDialog.value = false;
  };
  const onCloseRenameDialog = () => {
    showRenameDialog.value = false;
  };

  return {
    showCreateDirectoryDialog,
    showCreateDocumentDialog,
    showRenameDialog,
    onSelectCreateDirectory,
    onSelectCreateDocument,
    onSelectRename,
    onCloseCreateDirectoryDialog,
    onCloseCreateDocumentDialog,
    onCloseRenameDialog,
  };
};
