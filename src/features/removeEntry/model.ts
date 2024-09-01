import { shallowRef } from 'vue';
import type { EntryRef } from '../../entities/entry';

export const useRemoveEntryFeature = () => {
  const entryToBeRemoved = shallowRef<EntryRef>();

  const clearEntryToBeRemoved = () => {
    entryToBeRemoved.value = undefined;
  };

  const setEntryToBeRemoved = (entry: EntryRef) => {
    entryToBeRemoved.value = entry;
  };

  return {
    entryToBeRemoved,
    clearEntryToBeRemoved,
    setEntryToBeRemoved,
  };
};
