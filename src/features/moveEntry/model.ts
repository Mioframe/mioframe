import { shallowRef } from 'vue';
import type { DirectoryEntry, FileEntry } from '../../entities/entry';

export const useMoveEntryFeature = () => {
  const sourceMoveEntry = shallowRef<DirectoryEntry | FileEntry>();

  const setSourceMoveEntry = (entry: DirectoryEntry | FileEntry) => {
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
