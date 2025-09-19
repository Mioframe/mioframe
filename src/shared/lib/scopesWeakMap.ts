import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import type { ComputedRef } from 'vue';
import { effectScope, watch, computed, shallowRef, toValue } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';
import { isUndefined, toString } from 'es-toolkit/compat';

/**
 * Слабая карта реактивных областей по ключу
 */
type ScopesWeakMap<K extends WeakKey, V> = {
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

type UseScopesWeakMap<K extends WeakKey, V> = () => ScopesWeakMap<K, V>;

// TODO: сделать createScopesMap (без Weak) для кеширования скоупов в воркере

/**
 * Создать слабую карту реактивных областей по ключу
 * @param setupCache
 * @returns
 */
export const createScopesWeakMap = <K extends WeakKey, V extends object>(
  setupCache: (key: K) => V,
): UseScopesWeakMap<K, V> =>
  createGlobalState((): ScopesWeakMap<K, V> => {
    const cacheMap = new WeakMap<
      K,
      { scope: ReturnType<typeof effectScope>; state: V }
    >();
    const usageCount = new WeakMap<K, number>();

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

type UseScopesWeakMapByKey = <K extends WeakKey, V>(
  useScopesWeakMap: () => ScopesWeakMap<K, V>,
  rawKey: MaybeRefOrGetter<K | undefined>,
) => ComputedRef<V | undefined>;

// TODO: сделать useScopesWeakMapByKey для подписок

/**
 * Использовать ScopesWeakMap с реактивным ключом
 * @param useScopesWeakMap
 * @param rawKey
 * @returns
 */
export const useScopesWeakMapByKey: UseScopesWeakMapByKey = <
  K extends WeakKey,
  V,
>(
  useScopesWeakMap: () => ScopesWeakMap<K, V>,
  rawKey: MaybeRefOrGetter<K | undefined>,
): ComputedRef<V | undefined> => {
  const keyRef = computed(() => toValue(rawKey));

  const stateRef = shallowRef<V>();

  const { getScope, tryDisposeScope } = useScopesWeakMap();

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

export const defineScopesWeakMapRef =
  <K extends WeakKey, V>(useGlobalCacheApi: UseScopesWeakMap<K, V>) =>
  (rawKey: MaybeRefOrGetter<K | undefined>) =>
    useScopesWeakMapByKey(useGlobalCacheApi, rawKey);
