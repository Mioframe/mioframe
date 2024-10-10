import { difference } from 'lodash-es';
import { computed, isRef, reactive, toValue, watch, type MaybeRef } from 'vue';

export interface AsyncMap<K extends string | number, T> {
  get: () => Promise<Map<K, T>>;
  addWatcher: (handler: (map: Map<K, T>) => unknown) => void;
  removeWatcher: (handler: (map: Map<K, T>) => unknown) => void;
}

export const useAsyncMap = <K extends string | number, T>(
  asyncMap: MaybeRef<AsyncMap<K, T> | undefined>,
) => {
  const stateMap: Map<K, T> = reactive(new Map());

  const fetchMap = async () => {
    const asyncMapValue = toValue(asyncMap);
    if (asyncMapValue) {
      const nowMap = await asyncMapValue.get();

      const stateKeys = Array.from(stateMap.keys());
      const nowKeys = Array.from(nowMap.keys());

      const deletedKeys = difference(stateKeys, nowKeys);

      deletedKeys.forEach((key) => stateMap.delete(key));
      nowMap.forEach((item, key) => {
        if (!stateMap.has(key)) {
          stateMap.set(key, item);
        }
      });
    } else {
      stateMap.clear();
    }
  };

  if (isRef(asyncMap)) {
    watch(
      asyncMap,
      (asyncMap, oldAsyncMap) => {
        oldAsyncMap?.removeWatcher(fetchMap);
        asyncMap?.addWatcher(fetchMap);
      },
      { immediate: true },
    );
  } else {
    asyncMap?.addWatcher(fetchMap);
  }

  const map = computed((): Map<K, T> => stateMap);

  return {
    map,
    fetchMap,
    set: (key: K, value: T) => {
      stateMap.set(key, value);
    },
    delete: (key: K) => {
      stateMap.delete(key);
    },
  };
};
