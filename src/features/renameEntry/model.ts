import { shallowRef } from 'vue';
import type { DirectoryEntry, FileEntry } from '../../entities/entry';

export const useRenameEntryFeature = () => {
  const selectedRenameEntry = shallowRef<DirectoryEntry | FileEntry>();

  const setRenameEntry = (directoryDestination: DirectoryEntry | FileEntry) => {
    selectedRenameEntry.value = directoryDestination;
  };

  const clearRenameEntry = () => {
    selectedRenameEntry.value = undefined;
  };

  return {
    selectedRenameEntry,
    setRenameEntry,
    clearRenameEntry,
  };
};
