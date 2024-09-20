import { shallowRef } from 'vue';
import type { DirectoryEntryRef, FileEntryRef } from '../../entities/entry';

export const useCopyEntryFeature = () => {
  const copyableEntry = shallowRef<DirectoryEntryRef | FileEntryRef>();

  const setCopyableEntry = (entry: DirectoryEntryRef | FileEntryRef) => {
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
