import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import type { ComputedRef, EffectScope } from 'vue';
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
  getScope: (key: K) => {
    scope: EffectScope;
    state: V;
  };
  /**
   * Отключить область
   * @param key
   * @returns
   */
  disposeScope: (key: K) => void;
};

type UseScopesWeakMap<K extends WeakKey, V> = () => ScopesWeakMap<K, V>;

// TODO: сделать createScopesMap (без Weak) для кеширования скоупов в воркере

/**
 * Создать слабую карту реактивных областей по ключу
 * @param setupScope
 * @returns
 */
export const createScopesWeakMap = <K extends WeakKey, V extends object>(
  setupScope: (key: K) => V,
): UseScopesWeakMap<K, V> =>
  createGlobalState((): ScopesWeakMap<K, V> => {
    const cacheMap = new WeakMap<
      K,
      { scope: ReturnType<typeof effectScope>; state: V }
    >();

    const getScope = (
      key: K,
    ): {
      scope: EffectScope;
      state: V;
    } => {
      const mbCache = cacheMap.get(key);
      if (mbCache) {
        return mbCache;
      }
      const scope = effectScope();
      const maybeState = scope.run(() => setupScope(key));
      if (maybeState === undefined) {
        throw new Error(
          `Unable to initialize cache for key "${toString(key)}": effectScope is inactive.`,
        );
      }
      const state = maybeState;
      const cache = { scope, state };
      cacheMap.set(key, cache);

      return cache;
    };

    const disposeScope = (key: K) => {
      const cache = cacheMap.get(key);
      cache?.scope.stop();
      cacheMap.delete(key);
    };

    return { getScope, disposeScope };
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

  const { getScope, disposeScope } = useScopesWeakMap();

  const usageCount = new WeakMap<K, number>();

  function tryDisposeScope(key: K): void {
    const prev = usageCount.get(key) ?? 0;
    const next = Math.max(prev - 1, 0);
    usageCount.set(key, next);
    if (next === 0) {
      disposeScope(key);
    }
  }

  watch(
    keyRef,
    (key, prevKey) => {
      if (!isUndefined(prevKey)) {
        tryDisposeScope(prevKey);
      }
      if (!isUndefined(key)) {
        const { state } = getScope(key);
        usageCount.set(key, (usageCount.get(key) ?? 0) + 1);

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
