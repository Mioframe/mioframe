import type { MaybeRefOrGetter } from 'vue';
import { computed, reactive } from 'vue';
import { wrapStrictRecord } from './wrapStrictRecord';
import type { StrictRecord } from './types';
import { defineScopePool, usePoolState } from '../scopePool';
import { useReduceIterable } from '../useReduce';

type WrappedStrictRecordRef<K, V> = {
  get: (key: K) => V | undefined;
  has: (key: K) => boolean;
  remove: (key: K) => void;
  set: (key: K, value: V) => void;
  forEach: (callbackfn: (value: V, key: K) => void) => void;
  size: number;
  entries: [K, V][];
  keys: K[];
  values: V[];
};

const wrapStrictRecordCache = defineScopePool(
  <K extends string, V>(
    strictRecord: StrictRecord<K, V>,
  ): WrappedStrictRecordRef<K, V> => {
    const wrappedStrictRecord = wrapStrictRecord(strictRecord);

    const size = computed(() => wrappedStrictRecord.size);

    const { entries, forEach, get, has, keys, remove, set, values } =
      wrappedStrictRecord;

    const entriesArray = useReduceIterable(
      entries,
      (acc, item) => {
        acc.push(item);
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- typed empty array initializer
      <[K, V][]>[],
    );

    const keysArray = useReduceIterable(
      keys,
      (acc, item) => {
        acc.push(item);
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- typed empty array initializer
      <K[]>[],
    );

    const valuesArray = useReduceIterable(
      values,
      (acc, item) => {
        acc.push(item);
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- typed empty array initializer
      <V[]>[],
    );

    const scope: WrappedStrictRecordRef<K, V> = reactive({
      get,
      has,
      remove,
      set,
      forEach,
      size,
      entries: entriesArray,
      keys: keysArray,
      values: valuesArray,
    });

    return scope;
  },
);

export const useWrapStrictRecord = <K extends string, V>(
  strictRecord: MaybeRefOrGetter<StrictRecord<K, V> | undefined>,
) =>
  usePoolState<StrictRecord<K, V>, WrappedStrictRecordRef<K, V>>(
    wrapStrictRecordCache,
    strictRecord,
  );
