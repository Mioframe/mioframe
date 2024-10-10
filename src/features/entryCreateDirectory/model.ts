import { shallowRef } from 'vue';
import type { LocalDirectoryRef } from '../../entities/entry';

export const useCreateDirectoryFeature = () => {
  const directoryCreateDestination = shallowRef<LocalDirectoryRef>();

  const setDirectoryDestination = (directoryDestination: LocalDirectoryRef) => {
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
