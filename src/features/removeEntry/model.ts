import { shallowRef } from 'vue';
import type { Entry } from '../../entities/entry';

export const useRemoveEntryFeature = () => {
  const entryToBeRemoved = shallowRef<Entry>();

  const clearEntryToBeRemoved = () => {
    entryToBeRemoved.value = undefined;
  };

  const setEntryToBeRemoved = (entry: Entry) => {
    entryToBeRemoved.value = entry;
  };

  return {
    entryToBeRemoved,
    clearEntryToBeRemoved,
    setEntryToBeRemoved,
  };
};
