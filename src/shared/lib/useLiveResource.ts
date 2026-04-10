import { DomainError } from '@shared/lib/error';
import { tryOnScopeDispose, useAsyncState } from '@vueuse/core';
import { isEqual, once, throttle } from 'es-toolkit';
import type { WatchHandle, WatchSource, ComputedRef, Ref } from 'vue';
import { computed, toValue, watch } from 'vue';

type Unsubscribe = () => unknown;

interface LiveResourceReturn<T> {
  state: ComputedRef<T | undefined>;
  errorMessage: ComputedRef<string | undefined>;
  isLoading: Ref<boolean>;
  isReady: Ref<boolean>;
  refresh: () => void;
}

interface LiveResourceOptions<T, Q> {
  fetch: (query: Q) => Promise<T>;
  subscribe: (
    query: Q,
    invalidate: () => void,
  ) => Promise<Unsubscribe | undefined> | Unsubscribe | undefined;
  defaultErrorMessage?: string;
  throttleMs?: number;
  deep?: number | boolean;
}

/**
 * Reactive resource with auto-fetch and subscription support.
 *
 * @deprecated Use `useQuery` with `defineQuery` instead.
 *
 * A generalized pattern for reactive resources that need both initial fetch
 * and ongoing subscription-based updates. Combines useAsyncState with
 * subscription logic for real-time data.
 *
 * @param source - Reactive source (query/params) that triggers refetch
 * @param options - Configuration with fetch and subscribe functions
 * @returns Object with state, errorMessage, isLoading, isReady, and refresh
 *
 * @example
 * ```ts
 * const resource = useLiveResource(userId, {
 *   fetch: (id) => api.getUser(id),
 *   subscribe: (id, invalidate) => api.subscribeUser(id, invalidate)
 * });
 * ```
 */
export function useLiveResource<T, Q>(
  // переписать клиентов с useLiveResource на useQuery
  source: WatchSource<Q>,
  options: LiveResourceOptions<T, Q>,
): LiveResourceReturn<T> {
  const {
    fetch: fetchData,
    subscribe,
    defaultErrorMessage = 'Error loading resource',
    throttleMs = 0,
    deep = false,
  } = options;

  const { error, isLoading, isReady, state, executeImmediate } = useAsyncState(
    fetchData,
    undefined,
    {
      immediate: false,
      resetOnExecute: false,
      shallow: true,
    },
  );

  const throttleExecute = throttle(executeImmediate, throttleMs);

  let offChange: Unsubscribe | undefined;
  let watchHandle: WatchHandle | undefined;

  const onceInitial = once(() => {
    watchHandle = watch(
      source,
      async (newArgs, old) => {
        if (isEqual(newArgs, old)) {
          return;
        }
        if (offChange) {
          offChange();
          offChange = undefined;
        }

        state.value = undefined;

        const invalidate = () => {
          throttleExecute(newArgs);
        };

        throttleExecute(newArgs);

        offChange = await subscribe(newArgs, invalidate);
      },
      { immediate: true, deep, flush: 'sync' },
    );
  });

  tryOnScopeDispose(() => {
    watchHandle?.stop();
    offChange?.();
  });

  return {
    state: computed(() => {
      onceInitial();
      return state.value;
    }),
    errorMessage: computed((): undefined | string => {
      if (error.value instanceof DomainError) {
        return error.value.message;
      } else if (error.value) {
        return defaultErrorMessage;
      }
      return undefined;
    }),
    isLoading,
    isReady,
    refresh: () => {
      throttleExecute(toValue(source));
    },
  };
}
