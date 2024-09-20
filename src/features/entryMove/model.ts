import { shallowRef } from 'vue';
import type { DirectoryEntryRef, FileEntryRef } from '../../entities/entry';

export const useMoveEntryFeature = () => {
  const sourceMoveEntry = shallowRef<DirectoryEntryRef | FileEntryRef>();

  const setSourceMoveEntry = (entry: DirectoryEntryRef | FileEntryRef) => {
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
