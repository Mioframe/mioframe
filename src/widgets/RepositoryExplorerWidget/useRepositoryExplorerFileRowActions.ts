import type { Ref } from 'vue';
import { ref, watch } from 'vue';
import { useRemoveFSEntry } from '@feature/entryRemove';
import { useImportDocumentAction } from '@feature/importDocument';

/**
 * Owns section-level state for row-triggered create-directory, create-document, rename, remove,
 * and import-JSON actions in a files list. Keeps one active path per dialog flow instead of
 * per-row hidden dialog instances, and clears a dialog's path when it is no longer present among
 * `validEntryPaths` (e.g. removed by a concurrent peer while the dialog was open).
 * @param validEntryPaths - Reactive set of currently valid absolute entry paths in this section.
 * @returns Dialog path state plus select/close handlers for row actions.
 */
export const useRepositoryExplorerFileRowActions = (validEntryPaths: Ref<ReadonlySet<string>>) => {
  const createDirectoryPath = ref<string | null>(null);
  const createDocumentPath = ref<string | null>(null);
  const renamePath = ref<string | null>(null);

  watch(validEntryPaths, (paths) => {
    if (createDirectoryPath.value !== null && !paths.has(createDirectoryPath.value)) {
      createDirectoryPath.value = null;
    }
    if (createDocumentPath.value !== null && !paths.has(createDocumentPath.value)) {
      createDocumentPath.value = null;
    }
    if (renamePath.value !== null && !paths.has(renamePath.value)) {
      renamePath.value = null;
    }
  });

  const onSelectCreateDirectory = (entryPath: string) => {
    createDirectoryPath.value = entryPath;
  };
  const onSelectCreateDocument = (entryPath: string) => {
    createDocumentPath.value = entryPath;
  };
  const onSelectRename = (entryPath: string) => {
    renamePath.value = entryPath;
  };

  const onCloseCreateDirectoryDialog = () => {
    createDirectoryPath.value = null;
  };
  const onCloseCreateDocumentDialog = () => {
    createDocumentPath.value = null;
  };
  const onCloseRenameDialog = () => {
    renamePath.value = null;
  };

  const { remove } = useRemoveFSEntry();
  const { importDocument } = useImportDocumentAction();

  const onSelectRemove = async (entryPath: string) => {
    await remove(entryPath);
  };
  const onSelectImportJson = async (entryPath: string) => {
    await importDocument(entryPath);
  };

  return {
    createDirectoryPath,
    createDocumentPath,
    renamePath,
    onSelectCreateDirectory,
    onSelectCreateDocument,
    onSelectRename,
    onSelectRemove,
    onSelectImportJson,
    onCloseCreateDirectoryDialog,
    onCloseCreateDocumentDialog,
    onCloseRenameDialog,
  };
};
