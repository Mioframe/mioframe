import type { Ref } from 'vue';
import { computed, reactive, watchEffect } from 'vue';
import type { IterableCollection } from './useIterable';
import { useIterable, type ItemWithChildren } from './useIterable';

export interface AsyncMap<K extends string | number, T>
  extends ItemWithChildren<K, T> {}

const syncCollectionWithMap = <K, T>(
  collection: Iterable<[K, T]>,
  map: Map<K, T>,
): void => {
  const processedKeys = new Set<K>();

  for (const [key, value] of collection) {
    map.set(key, value);
    processedKeys.add(key);
  }

  for (const key of map.keys()) {
    if (!processedKeys.has(key)) {
      map.delete(key);
    }
  }
};

export const useMapFromCollection = <K extends string | number, T>(
  iterableCollection: Ref<IterableCollection<K, T> | undefined>,
) => {
  const { collection, loading } = useIterable(iterableCollection);

  const stateMap: Map<K, T> = reactive(new Map());

  watchEffect(() => {
    syncCollectionWithMap(collection.value, stateMap);
  });

  const map = computed((): ReadonlyMap<K, T> => stateMap);

  return {
    map,
    loading: computed(() => !!loading.value),
  };
};
