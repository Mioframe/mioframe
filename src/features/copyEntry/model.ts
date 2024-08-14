import { shallowRef } from 'vue';
import type { DirectoryEntry, FileEntry } from '../../entities/entry';

export const useCopyEntryFeature = () => {
  const copyableEntry = shallowRef<DirectoryEntry | FileEntry>();

  const setCopyableEntry = (entry: DirectoryEntry | FileEntry) => {
    copyableEntry.value = entry;
  };

  const clearCopyableEntry = () => {
    copyableEntry.value = undefined;
  };

  return {
    copyableEntry,
    setCopyableEntry,
    clearCopyableEntry,
  };
};
