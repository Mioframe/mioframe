import { shallowRef } from 'vue';
import type { LocalDirectoryRef, LocalFileRef } from '../../entities/entry';

export const useRenameEntryFeature = () => {
  const selectedRenameEntry = shallowRef<LocalDirectoryRef | LocalFileRef>();

  const setRenameEntry = (
    directoryDestination: LocalDirectoryRef | LocalFileRef,
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
