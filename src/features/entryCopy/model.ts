import { shallowRef } from 'vue';
import type { LocalDirectoryRef, LocalFileRef } from '../../entities/entry';

export const useCopyEntryFeature = () => {
  const copyableEntry = shallowRef<LocalDirectoryRef | LocalFileRef>();

  const setCopyableEntry = (entry: LocalDirectoryRef | LocalFileRef) => {
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
