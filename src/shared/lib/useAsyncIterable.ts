import { isNil } from 'es-toolkit';
import { isFunction } from 'es-toolkit/compat';
import { from } from 'ix/asynciterable';
import { filter, takeWhile } from 'ix/asynciterable/operators';
import type { Ref } from 'vue';
import { computed, ref, toRef, watch } from 'vue';
import { isObjectLike } from './typeGuards';

export type Collection<T> = AsyncIterable<T> | Iterable<T>;

export type Dictionary<K, V> = Collection<[K, V]>;

export interface ItemWithChildren1<K extends string | number, T> {
  children: Collection<[K, T]>;
}

export interface ItemWithChildren2<V extends [string | number, unknown]> {
  children: Collection<V>;
}

export interface ItemWithChildren<T extends [string | number, unknown]> {
  children: Collection<T>;
}

const hasIterator = <T>(v: unknown): v is Iterable<T> =>
  isObjectLike(v) &&
  Symbol.iterator in v &&
  typeof v[Symbol.iterator] === 'function';

const hasAsyncIterator = <T>(v: unknown): v is AsyncIterable<T> =>
  isObjectLike(v) &&
  Symbol.asyncIterator in v &&
  typeof v[Symbol.asyncIterator] === 'function';

export const isItemWithChildren = <
  V,
  T extends [string | number, unknown] = [string | number, unknown],
>(
  v: V,
): v is V & ItemWithChildren<T> =>
  isObjectLike(v) &&
  'children' in v &&
  (isFunction(v.children) ||
    (isObjectLike(v.children) &&
      (hasIterator(v.children) || hasAsyncIterator(v.children))));

export const useCollection = <T>(
  collection: Ref<Collection<T> | undefined>,
  filterPredicate?: Ref<undefined | ((value: T, index: number) => boolean)>,
) => {
  const stateCollection = <Ref<T[]>>ref<T[]>([]);

  const loading = ref(0);

  const updateCollection = async (iterableValue: Collection<T>) => {
    const source: any = isFunction(iterableValue)
      ? iterableValue()
      : iterableValue;

    const operations = [
      filterPredicate?.value ? filter(filterPredicate.value) : undefined,
    ].filter((v) => !isNil(v));

    try {
      loading.value += 1;
      await from(source)
        .pipe(
          takeWhile(() => {
            return iterableValue === collection.value;
          }),
          ...operations,
        )
        .forEach((value, index) => {
          stateCollection.value.splice(index, 1, value);
        });
    } finally {
      loading.value -= 1;
    }
  };

  watch(
    collection,
    (iterableValue, old) => {
      if (iterableValue) {
        if (iterableValue !== old) {
          stateCollection.value.length = 0;
        }
        void updateCollection(iterableValue);
      } else {
        stateCollection.value.length = 0;
      }
    },
    { immediate: true },
  );

  return {
    collection: toRef(() => stateCollection.value),
    loading: computed(() => loading.value > 0),
  };
};

export const useIterable = <T>(
  collection: Ref<Iterable<T> | undefined>,
  filterPredicate?: Ref<undefined | ((value: T, index: number) => boolean)>,
) => {
  const stateCollection = <Ref<T[]>>ref<T[]>([]);

  const loading = ref(0);

  const updateCollection = async (iterableValue: Collection<T>) => {
    const source: any = isFunction(iterableValue)
      ? iterableValue()
      : iterableValue;

    const operations = [
      filterPredicate?.value ? filter(filterPredicate.value) : undefined,
    ].filter((v) => !isNil(v));

    try {
      loading.value += 1;
      await from(source)
        .pipe(
          takeWhile(() => {
            return iterableValue === collection.value;
          }),
          ...operations,
        )
        .forEach((value, index) => {
          stateCollection.value.splice(index, 1, value);
        });
    } finally {
      loading.value -= 1;
    }
  };

  watch(
    collection,
    (iterableValue, old) => {
      if (iterableValue) {
        if (iterableValue !== old) {
          stateCollection.value.length = 0;
        }
        void updateCollection(iterableValue);
      } else {
        stateCollection.value.length = 0;
      }
    },
    { immediate: true },
  );

  return {
    collection: toRef(() => stateCollection.value),
    loading: computed(() => loading.value > 0),
  };
};
