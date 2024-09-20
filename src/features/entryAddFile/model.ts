import { shallowRef } from 'vue';
import type { DirectoryEntryRef } from '../../entities/entry';

export const useWriteFileFeature = () => {
  const fileWriteDestination = shallowRef<DirectoryEntryRef>();

  const setFileWriteDestination = (destinationEntry: DirectoryEntryRef) => {
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
