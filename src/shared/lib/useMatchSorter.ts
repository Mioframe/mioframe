import { matchSorter } from 'match-sorter';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

export const useMatchSorter = (
  list: MaybeRefOrGetter<string[]>,
  value: MaybeRefOrGetter<string | undefined>,
) =>
  computed(() => {
    const searchValue = toValue(value);
    if (searchValue) {
      return matchSorter(toValue(list), searchValue);
    }
    return undefined;
  });
