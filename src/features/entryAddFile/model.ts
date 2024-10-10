import { shallowRef } from 'vue';
import type { LocalDirectoryRef } from '../../entities/entry';

export const useWriteFileFeature = () => {
  const fileWriteDestination = shallowRef<LocalDirectoryRef>();

  const setFileWriteDestination = (destinationEntry: LocalDirectoryRef) => {
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
