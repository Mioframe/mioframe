import type { MaybeRefOrGetter } from '@vueuse/core';
import { computed, toValue } from 'vue';
import { useFastKeyboardInput } from './useFastKeyboardInput';
import { useMatchSorter } from './useMatchSorter';

export const useKeyboardSearch = (searchList: MaybeRefOrGetter<string[]>) => {
  const keyboardInput = useFastKeyboardInput();

  const matchSorterResult = useMatchSorter(searchList, keyboardInput);

  const foundIndex = computed(() => {
    const inputString = toValue(keyboardInput);
    if (inputString?.length) {
      const list = toValue(searchList);

      const foundString = matchSorterResult.value?.at(0);

      if (foundString) {
        const index = list.indexOf(foundString);
        return index > -1 ? index : undefined;
      }
    }

    return undefined;
  });

  return {
    keyboardInput,
    foundIndex,
  };
};
