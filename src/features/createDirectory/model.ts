import { shallowRef } from 'vue';
import type { DirectoryEntryRef } from '../../entities/entry';

export const useCreateDirectoryFeature = () => {
  const directoryCreateDestination = shallowRef<DirectoryEntryRef>();

  const setDirectoryDestination = (directoryDestination: DirectoryEntryRef) => {
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
