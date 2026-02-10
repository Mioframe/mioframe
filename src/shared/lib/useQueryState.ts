import { useRouteQuery } from '@vueuse/router';
import { cloneDeep, isString, merge, toMerged } from 'es-toolkit';
import type { MaybeRef, Reactive } from 'vue';
import { nextTick, reactive, toValue, watch } from 'vue';
import queryString from 'qs';

export const useQueryValue = <P extends object>(
  queryRootName: string,
  initialState: P,
  mode?: MaybeRef<'push' | 'replace'>,
): Reactive<P> => {
  const localState = reactive<P>(initialState);

  const queryState = useRouteQuery(queryRootName, undefined, {
    mode,
    transform: {
      get: (v: unknown) => {
        if (isString(v)) {
          return toMerged(initialState, queryString.parse(v));
        }

        return initialState;
      },
      set: (v: P) => {
        return queryString.stringify(cloneDeep(v));
      },
    },
  });

  const localStateWatchHandle = watch(
    localState,
    (localState) => {
      queryWatchHandle.pause();
      merge(queryState.value, toValue(localState));
      void nextTick(() => {
        queryWatchHandle.resume();
      });
    },
    { deep: true },
  );

  const queryWatchHandle = watch(
    queryState,
    (queryState) => {
      localStateWatchHandle.pause();

      merge(localState, queryState);

      void nextTick(() => {
        localStateWatchHandle.resume();
      });
    },
    { immediate: true, deep: true },
  );

  return localState;
};
