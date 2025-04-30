import { from } from 'ix/iterable';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { computed, ref, toRef, toValue, watch } from 'vue';
import { createLogger } from './logger';
import { isFunction, isObjectType } from 'remeda';

export type Dictionary<K, V> = Iterable<[K, V]>;

export interface ItemWithChildren1<K extends string | number, T> {
  children: Iterable<[K, T]>;
}

export interface ItemWithChildren2<V extends [string | number, unknown]> {
  children: Iterable<V>;
}

export interface ItemWithChildren<T extends [string | number, unknown]> {
  children: Iterable<T>;
}

const hasIterator = <T>(v: unknown): v is Iterable<T> =>
  isObjectType(v) &&
  Symbol.iterator in v &&
  typeof v[Symbol.iterator] === 'function';

const hasAsyncIterator = <T>(v: unknown): v is AsyncIterable<T> =>
  isObjectType(v) &&
  Symbol.asyncIterator in v &&
  typeof v[Symbol.asyncIterator] === 'function';

export const isItemWithChildren = <
  V,
  T extends [string | number, unknown] = [string | number, unknown],
>(
  v: V,
): v is V & ItemWithChildren<T> =>
  isObjectType(v) &&
  'children' in v &&
  (isFunction(v.children) ||
    (isObjectType(v.children) &&
      (hasIterator(v.children) || hasAsyncIterator(v.children))));

const { debug } = createLogger('useIterable');

export const useIterable = <T>(
  iterable: MaybeRefOrGetter<Iterable<T> | undefined>,
) => {
  debug('start');

  const iterableRef = toRef(() => toValue(iterable));

  const stateCollection = <Ref<T[]>>ref<T[]>([]);

  const loading = ref(0);

  const updateCollection = (source: Iterable<T>) => {
    try {
      loading.value += 1;
      from(source).forEach((value, index) => {
        stateCollection.value.splice(index, 1, value);
      });
    } finally {
      loading.value -= 1;
    }
  };

  watch(
    iterableRef,
    (iterableValue, old) => {
      if (iterableValue !== old) {
        stateCollection.value.length = 0;
      }
      if (iterableValue) {
        updateCollection(iterableValue);
      }
    },
    { immediate: true },
  );

  return {
    collection: stateCollection,
    loading: computed(() => loading.value > 0),
  };
};
