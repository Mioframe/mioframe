import { createLogger } from '@shared/lib/logger';
import { from } from 'ix/asynciterable';
import { filter, takeWhile } from 'ix/asynciterable/operators';
import { isFunction, isNil, isObject } from 'lodash-es';
import type { Ref } from 'vue';
import { computed, ref, toRef, watch, watchEffect } from 'vue';

const { debug, debugRef } = createLogger('useIterable');

export type IterableCollection<
  Key extends string | number,
  Value,
> = AnyIterableInput<[Key, Value]>;

export type AnyIterableInput<T> = AsyncIterable<T> | Iterable<T>;
// | (() => AsyncIterableInput<T>);

export interface ItemWithChildren<K extends string | number, T> {
  children: IterableCollection<K, T>;
}

const hasIterator = <T>(v: unknown): v is Iterable<T> =>
  isObject(v) &&
  Symbol.iterator in v &&
  typeof v[Symbol.iterator] === 'function';

const hasAsyncIterator = <T>(v: unknown): v is AsyncIterable<T> =>
  isObject(v) &&
  Symbol.asyncIterator in v &&
  typeof v[Symbol.asyncIterator] === 'function';

export const isItemWithChildren = <
  V,
  K extends string | number = string | number,
  T = unknown,
>(
  v: V,
): v is V & ItemWithChildren<K, T> =>
  isObject(v) &&
  'children' in v &&
  (isFunction(v.children) ||
    (isObject(v.children) &&
      (hasIterator(v.children) || hasAsyncIterator(v.children))));

export const useIterable = <T>(
  iterable: Ref<AnyIterableInput<T> | undefined>,
  filterPredicate?: Ref<undefined | ((value: T, index: number) => boolean)>,
) => {
  const stateIterable = <Ref<T[]>>ref<T[]>([]);

  const loading = ref(0);

  const updateIterable = async (iterableValue: AnyIterableInput<T>) => {
    debug('updateIterable', { iterableValue });

    const source = isFunction(iterableValue) ? iterableValue() : iterableValue;

    const operations = [
      filterPredicate?.value ? filter(filterPredicate.value) : undefined,
    ].filter((v) => !isNil(v));

    try {
      loading.value += 1;
      await from(source)
        .pipe(
          takeWhile(() => {
            debug('takeWhile');
            return iterableValue === iterable.value;
          }),
          ...operations,
        )
        .forEach((value, index) => {
          debug('forEach', value, index);
          stateIterable.value.splice(index, 1, value);
        });
    } finally {
      loading.value -= 1;
    }
  };

  watch(
    iterable,
    (iterableValue, old) => {
      debug('iterable', iterableValue);
      if (iterableValue) {
        if (iterableValue !== old) {
          stateIterable.value.length = 0;
        }
        void updateIterable(iterableValue);
      } else {
        stateIterable.value.length = 0;
      }
    },
    { immediate: true },
  );

  watchEffect(() => {
    debugRef('stateIterable', stateIterable);
  });

  return {
    collection: toRef(() => stateIterable.value),
    loading: computed(() => loading.value > 0),
  };
};
