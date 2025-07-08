import type { MaybeRefOrGetter } from '@vueuse/core';
import { onKeyStroke, refAutoReset } from '@vueuse/core';
import { computed, toValue } from 'vue';
import { matchSorter } from 'match-sorter';

export const useKeyboardSearch = (searchList: MaybeRefOrGetter<string[]>) => {
  const keyboardInput = refAutoReset<string | undefined>(undefined, 500);

  onKeyStroke(
    ({ key }) => /^.$/.test(key),
    ({ key }) => {
      keyboardInput.value = (keyboardInput.value ?? '') + key;
    },
  );

  const foundIndex = computed(() => {
    const inputString = toValue(keyboardInput);
    if (inputString?.length) {
      const list = toValue(searchList);

      const [foundString] = matchSorter(list, inputString);

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
