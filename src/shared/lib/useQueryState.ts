import { useRouteQuery } from '@vueuse/router';
import { cloneDeep, isString, merge, toMerged } from 'es-toolkit';
import type { MaybeRef, Reactive } from 'vue';
import { nextTick, reactive, toValue, watch } from 'vue';
import queryString from 'qs';

/**
 * Reactive query state synchronized with URL query parameters.
 *
 * Creates a reactive state object that stays in sync with URL query string parameters.
 * Changes to either the state or the URL are reflected in both.
 * @param queryRootName - The query parameter name to use
 * @param initialState - Default values for the state
 * @param mode - URL update mode: 'push' or 'replace'
 * @returns Reactive object synchronized with URL query params
 * @example
 * ```ts
 * const filters = useQueryValue('filters', { search: '', page: 1 });
 * // Access: filters.value.search
 * // URL updates: ?filters=search=test&page=1
 * ```
 */
export const useQueryValue = <P extends object>(
  queryRootName: string,
  initialState: P,
  mode?: MaybeRef<'push' | 'replace'>,
): Reactive<P> => {
  const localState = reactive<P>(initialState);

  const transform = {
    get: (v: unknown) => {
      if (isString(v)) {
        return toMerged(initialState, queryString.parse(v));
      }

      return initialState;
    },
    set: (v: P) => {
      return queryString.stringify(cloneDeep(v));
    },
  };

  const queryState =
    mode === undefined
      ? useRouteQuery(queryRootName, undefined, { transform })
      : useRouteQuery(queryRootName, undefined, { mode, transform });

  const localStateWatchHandle = watch(
    localState,
    (nextLocalState) => {
      queryWatchHandle.pause();
      merge(queryState.value, toValue(nextLocalState));
      void nextTick(() => {
        queryWatchHandle.resume();
      });
    },
    { deep: true },
  );

  const queryWatchHandle = watch(
    queryState,
    (nextQueryState) => {
      localStateWatchHandle.pause();

      merge(localState, nextQueryState);

      void nextTick(() => {
        localStateWatchHandle.resume();
      });
    },
    { immediate: true, deep: true },
  );

  return localState;
};
