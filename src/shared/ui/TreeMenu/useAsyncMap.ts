import type { Ref } from 'vue';
import { computed, shallowReactive, watchEffect } from 'vue';
import type { Dictionary } from '../../lib/useIterable';
import type { ItemWithChildren } from '@shared/lib/useAsyncIterable';
import { useCollection } from '@shared/lib/useAsyncIterable';

export interface AsyncMap<
  K extends string | number,
  T,
> extends ItemWithChildren<[K, T]> {}

const syncIterableWithMap = <K, T>(
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

export const useDictionary = <K extends string | number, V>(
  iterableCollection: Ref<Dictionary<K, V> | undefined>,
) => {
  const { collection, loading } = useCollection(iterableCollection);

  const stateMap: Map<K, V> = shallowReactive(new Map());

  watchEffect(() => {
    syncIterableWithMap(collection.value, stateMap);
  });

  const dictionary = computed((): ReadonlyMap<K, V> => stateMap);

  return {
    dictionary,
    loading: computed(() => loading.value),
  };
};
