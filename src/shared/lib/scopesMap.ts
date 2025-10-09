import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import type { ComputedRef, WatchOptions } from 'vue';
import { effectScope, watch, computed, shallowRef, toValue } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';
import { isUndefined, toString } from 'es-toolkit/compat';
import { defineSubscribeService } from './subscriptions/subscribeService';

/**
 * Карта реактивных областей по ключу
 */
type ScopesMap<K, V> = {
  /**
   * Получить или создать область
   * @param key
   * @returns
   */
  getScope: (key: K) => V;
  /**
   * Выразить намерение отключить область.
   * @param key
   * @returns
   * @description Использовать при отключении клиентов, для каждого get должна быть tryDispose
   */
  tryDisposeScope: (key: K) => void;
};

type UseScopesMap<K, V> = () => ScopesMap<K, V>;

/**
 * Создать слабую карту реактивных областей по ключу
 * @param setupCache
 * @returns
 */
export const createScopesMap = <K, V extends object>(
  setupCache: (key: K) => V,
): UseScopesMap<K, V> =>
  createGlobalState((): ScopesMap<K, V> => {
    const cacheMap = new Map<
      K,
      { scope: ReturnType<typeof effectScope>; state: V }
    >();
    const usageCount = new Map<K, number>();

    const getScope = (key: K): V => {
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

    function tryDisposeScope(key: K): void {
      const prev = usageCount.get(key) ?? 0;
      const next = Math.max(prev - 1, 0);
      usageCount.set(key, next);
      if (next === 0 && cacheMap.has(key)) {
        const cache = cacheMap.get(key);
        cache?.scope.stop();
        cacheMap.delete(key);
      }
    }

    return { getScope, tryDisposeScope };
  });

type UseScopesMapByKey = <K, V>(
  useScopesMap: () => ScopesMap<K, V>,
  rawKey: MaybeRefOrGetter<K | undefined>,
) => ComputedRef<V | undefined>;

/**
 * Использовать ScopesMap с реактивным ключом
 * @param useScopesMap
 * @param rawKey
 * @returns
 */
export const useScopesMapByKey: UseScopesMapByKey = <K, V>(
  useScopesMap: () => ScopesMap<K, V>,
  rawKey: MaybeRefOrGetter<K | undefined>,
): ComputedRef<V | undefined> => {
  const keyRef = computed(() => toValue(rawKey));

  const stateRef = shallowRef<V>();

  const { getScope, tryDisposeScope } = useScopesMap();

  watch(
    keyRef,
    (key, prevKey) => {
      if (!isUndefined(prevKey)) {
        tryDisposeScope(prevKey);
      }
      if (!isUndefined(key)) {
        const state = getScope(key);
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
      tryDisposeScope(key);
    }
  });

  return computed(() => stateRef.value);
};

export const defineSubscribeScopesMapByKey = <K, V>(
  useScopesMap: () => ScopesMap<K, V>,
) => {
  const { getScope, tryDisposeScope } = useScopesMap();

  return (key: K, cb: (v: V) => unknown, options?: WatchOptions) => {
    const scope = shallowRef<V>(getScope(key));

    const handle = defineSubscribeService(scope)(cb, options);

    return {
      ...handle,
      stop: () => {
        tryDisposeScope(key);
        handle.stop();
      },
    };
  };
};

export const defineScopesMapRef =
  <K, V>(useGlobalCacheApi: UseScopesMap<K, V>) =>
  (rawKey: MaybeRefOrGetter<K | undefined>) =>
    useScopesMapByKey(useGlobalCacheApi, rawKey);
