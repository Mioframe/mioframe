import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { useImportDocumentAction } from '@feature/importDocument';
import { useExportDirectoryZip } from '@feature/exportZip';
import { useImportZipAction } from '@feature/importZip';

/**
 * Owns open/close state for entry-manage dialogs (create directory, create document, rename)
 * and handles direct actions (remove, import, ZIP export/import). Resets all dialogs when the
 * path changes.
 * @param path - Reactive entry path used by the owned actions and dialog-reset watcher.
 * @returns Dialog visibility refs, ZIP progress/running state, and action/close handlers for the
 * entry-manage flow.
 */
export const useEntryManageDialogState = (path: Ref<string>) => {
  const { remove } = useRemoveFSEntry();
  const { importDocument } = useImportDocumentAction();
  const {
    exportDirectoryZip,
    state: exportZipState,
    closeExportZipDialog,
  } = useExportDirectoryZip();
  const { importDirectoryZip, state: importZipState, closeImportZipDialog } = useImportZipAction();

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
  const onSelectRemove = async () => {
    await remove(path.value);
  };
  const onSelectImportJson = async () => {
    await importDocument(path.value);
  };
  const onSelectExportZip = async () => {
    await exportDirectoryZip(path.value);
  };
  const onSelectImportZip = async () => {
    await importDirectoryZip(path.value);
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
    exportZipState,
    closeExportZipDialog,
    importZipState,
    closeImportZipDialog,
    onSelectCreateDirectory,
    onSelectCreateDocument,
    onSelectRename,
    onSelectRemove,
    onSelectImportJson,
    onSelectExportZip,
    onSelectImportZip,
    onCloseCreateDirectoryDialog,
    onCloseCreateDocumentDialog,
    onCloseRenameDialog,
  };
};
