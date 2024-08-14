import { shallowRef } from 'vue';
import type { DirectoryEntry } from '../../entities/entry';

export const useCreateDirectoryFeature = () => {
  const directoryCreateDestination = shallowRef<DirectoryEntry>();

  const setDirectoryDestination = (directoryDestination: DirectoryEntry) => {
    directoryCreateDestination.value = directoryDestination;
  };

  const clearDirectoryDestination = () => {
    directoryCreateDestination.value = undefined;
  };

  return {
    directoryCreateDestination,
    setDirectoryDestination,
    clearDirectoryDestination,
  };
};
