import { shallowRef } from 'vue';
import type { DirectoryEntryRef, FileEntryRef } from '../../entities/entry';

export const useRenameEntryFeature = () => {
  const selectedRenameEntry = shallowRef<DirectoryEntryRef | FileEntryRef>();

  const setRenameEntry = (
    directoryDestination: DirectoryEntryRef | FileEntryRef,
  ) => {
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
