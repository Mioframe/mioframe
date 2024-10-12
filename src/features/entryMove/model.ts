import { shallowRef } from 'vue';
import type { LocalDirectoryRef, LocalFileRef } from '../../entities/entry';

export const useMoveEntryFeature = () => {
  const sourceMoveEntry = shallowRef<LocalDirectoryRef | LocalFileRef>();

  const setSourceMoveEntry = (entry: LocalDirectoryRef | LocalFileRef) => {
    sourceMoveEntry.value = entry;
  };

  const clearSourceMoveEntry = () => {
    sourceMoveEntry.value = undefined;
  };

  return {
    sourceMoveEntry,
    setSourceMoveEntry,
    clearSourceMoveEntry,
  };
};
