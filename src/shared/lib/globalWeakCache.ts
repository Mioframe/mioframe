import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import type { ComputedRef } from 'vue';
import { effectScope, watch, computed, shallowRef, toValue } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';
import { isUndefined, toString } from 'es-toolkit/compat';

type GlobalCache<K extends WeakKey, V> = {
  getCache: (key: K) => V;
  tryDisposeCache: (key: K) => void;
};

type UseGlobalCacheApi<K extends WeakKey, V> = () => GlobalCache<K, V>;

export const createGlobalWeakCache = <K extends WeakKey, V extends object>(
  setupCache: (key: K) => V,
): UseGlobalCacheApi<K, V> =>
  createGlobalState((): GlobalCache<K, V> => {
    const cacheMap = new WeakMap<
      K,
      { scope: ReturnType<typeof effectScope>; state: V }
    >();
    const usageCount = new WeakMap<K, number>();

    const getCache = (key: K): V => {
      const existing = cacheMap.get(key);
      if (existing) {
        usageCount.set(key, (usageCount.get(key) ?? 0) + 1);
        return existing.state;
      }
      const scope = effectScope();
      const maybeState = scope.run(() => setupCache(key));
      if (maybeState === undefined) {
        throw new Error(
          `Unable to initialize cache for key "${toString(key)}": effectScope is inactive.`,
        );
      }
      const state = maybeState;
      cacheMap.set(key, { scope, state });
      usageCount.set(key, 1);
      return state;
    };

    function tryDisposeCache(key: K): void {
      const prev = usageCount.get(key) ?? 0;
      const next = Math.max(prev - 1, 0);
      usageCount.set(key, next);
      if (next === 0 && cacheMap.has(key)) {
        const cache = cacheMap.get(key);
        cache?.scope.stop();
        cacheMap.delete(key);
      }
    }

    return { getCache, tryDisposeCache };
  });

export const useGlobalWeakCacheByKey = <K extends WeakKey, V>(
  useGlobalCache: () => GlobalCache<K, V>,
  rawKey: MaybeRefOrGetter<K | undefined>,
): ComputedRef<V | undefined> => {
  const keyRef = computed(() => toValue(rawKey));

  const stateRef = shallowRef<V>();

  const { getCache, tryDisposeCache } = useGlobalCache();

  watch(
    keyRef,
    (key, prevKey) => {
      if (!isUndefined(prevKey)) {
        tryDisposeCache(prevKey);
      }
      if (!isUndefined(key)) {
        const state = getCache(key);
        stateRef.value = state;
      } else {
        stateRef.value = undefined;
      }
    },
    { immediate: true, flush: 'sync' },
  );

  tryOnScopeDispose(() => {
    const key = toValue(keyRef);
    if (!isUndefined(key)) {
      tryDisposeCache(key);
    }
  });

  return computed(() => stateRef.value);
};

/**
 * @deprecated
 */
export const createUseGlobalWeakCache = <K extends WeakKey, V extends object>(
  setupCache: (key: K) => V,
) => {
  const globalCache = createGlobalWeakCache(setupCache);

  return defineGlobalWeakCache(globalCache);
};

export const defineGlobalWeakCache =
  <K extends WeakKey, V>(useGlobalCacheApi: UseGlobalCacheApi<K, V>) =>
  (rawKey: MaybeRefOrGetter<K | undefined>) =>
    useGlobalWeakCacheByKey(useGlobalCacheApi, rawKey);
