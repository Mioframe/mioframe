import type { MaybeRefOrGetter } from '@vueuse/core';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import { computed, shallowRef, toValue, watch } from 'vue';

type GlobalWeakCache<K extends WeakKey, V extends object> = () => {
  tryDisposeCache: (key: K) => void;
  getState: (key: K) => V;
};

/**
 * Global weak cache
 * to save memory on storing repetitive complex entities
 * @param createStateFn - entity constructor based on key reference
 * @param handleFirstInitial - callback after first entity created
 * @param handleDispose - callback before deleting entity
 * @returns
 */
export const defineGlobalWeakCache = <K extends WeakKey, V extends object>(
  createStateFn: (key: K) => V,
  handleFirstInitial?: (key: K, value: V) => unknown,
  handleDispose?: (key: K, value?: V) => unknown,
): GlobalWeakCache<K, V> =>
  createGlobalState(
    (): { tryDisposeCache: (key: K) => void; getState: (key: K) => V } => {
      const cacheValueState = new WeakMap<K, V>();

      const usersState = new WeakMap<K, number>();

      const getState = (key: K) => {
        const countUsers = (usersState.get(key) ?? 0) + 1;
        usersState.set(key, countUsers);

        const cachedValueState = cacheValueState.get(key);

        if (cachedValueState) {
          return cachedValueState;
        }

        const valueState = createStateFn(key);
        cacheValueState.set(key, valueState);

        if (countUsers === 1) {
          handleFirstInitial?.(key, valueState);
        }

        return valueState;
      };

      const tryDisposeCache = (key: K) => {
        const oldCountUsers = usersState.get(key) ?? 0;

        usersState.set(key, oldCountUsers - 1);

        if ((usersState.get(key) ?? 0) <= 0) {
          const cachedValueState = cacheValueState.get(key);
          handleDispose?.(key, cachedValueState);
          cacheValueState.delete(key);
        }
      };

      return {
        tryDisposeCache,
        getState,
      };
    },
  );

export const useGlobalWeakCache = <K extends WeakKey, V extends object>(
  globalWeakCache: GlobalWeakCache<K, V>,
  key: MaybeRefOrGetter<K | undefined>,
) => {
  const { getState, tryDisposeCache } = globalWeakCache();

  const keyRef = computed(() => toValue(key));

  const cachedState = shallowRef<V>();

  watch(
    keyRef,
    (key, oldKey) => {
      if (oldKey) {
        tryDisposeCache(oldKey);
      }
      if (key) {
        cachedState.value = getState(key);
      } else {
        cachedState.value = undefined;
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    const key = toValue(keyRef);
    if (key) {
      tryDisposeCache(key);
    }
  });

  return {
    state: computed(() => toValue(cachedState)),
  };
};
