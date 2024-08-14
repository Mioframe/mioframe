import { shallowRef } from 'vue';
import type { DirectoryEntry } from '../../entities/entry';

export const useWriteFileFeature = () => {
  const fileWriteDestination = shallowRef<DirectoryEntry>();

  const setFileWriteDestination = (destinationEntry: DirectoryEntry) => {
    fileWriteDestination.value = destinationEntry;
  };

  const clearFileWriteDestination = () => {
    fileWriteDestination.value = undefined;
  };

  return {
    fileWriteDestination,
    setFileWriteDestination,
    clearFileWriteDestination,
  };
};
