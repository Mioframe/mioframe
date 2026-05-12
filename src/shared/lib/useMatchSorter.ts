import { matchSorter } from 'match-sorter';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

/**
 * Fuzzy search filtering using match-sorter algorithm.
 *
 * Provides reactive sorted results based on fuzzy matching against a search value.
 * Uses match-sorter for intelligent ranking and filtering.
 * @param list - Array of strings to filter
 * @param value - Search value (reactive)
 * @returns Computed array of matched and ranked strings
 * @example
 * ```ts
 * const items = ['apple', 'banana', 'apricot', 'cherry'];
 * const results = useMatchSorter(items, searchQuery);
 * // 'ap' returns ['apple', 'apricot'] (ranked by match quality)
 * ```
 */
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
