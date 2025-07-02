import { isNil, isNotNil } from 'es-toolkit';
import { hasOwnKey } from '../typeGuards/hasOwnKey';
import type { StrictRecord } from './types';

export interface ReadonlyWrapStrictRecord<K extends string, V> {
  entries: () => IterableIterator<[K, V]>;
  keys: () => IterableIterator<K>;
  values: () => IterableIterator<V>;
  has: (key: K) => boolean;
  get: (key: K) => V | undefined;
  forEach: (callbackfn: (value: V, key: K) => void) => void;
  [Symbol.iterator](): IterableIterator<[K, V]>;
  readonly size: number;
}

export interface WrapStrictRecord<K extends string, V>
  extends ReadonlyWrapStrictRecord<K, V> {
  set: (key: K, value: V) => void;
  delete: (key: K) => boolean;
  remove: (key: K) => boolean;
}

export const wrapStrictRecord = <K extends string, V>(
  collectionObj: StrictRecord<K, V>,
): WrapStrictRecord<K, V> => {
  const entries = function* (): IterableIterator<[K, V]> {
    for (const key in collectionObj) {
      if (hasOwnKey(collectionObj, key)) {
        const item = collectionObj[key];

        if (item) {
          yield [key, item];
        }
      }
    }
  };

  const values = function* (): IterableIterator<V> {
    for (const key in collectionObj) {
      if (hasOwnKey(collectionObj, key)) {
        const item = collectionObj[key];

        if (item) {
          yield item;
        }
      }
    }
  };

  const keys = function* (): IterableIterator<K> {
    for (const key in collectionObj) {
      if (hasOwnKey(collectionObj, key) && !isNil(collectionObj[key])) {
        yield key;
      }
    }
  };

  const has = (key: K): boolean =>
    hasOwnKey(collectionObj, key) && !isNil(collectionObj[key]);

  const get = (key: K): V | undefined => {
    if (hasOwnKey(collectionObj, key) && collectionObj[key]) {
      return collectionObj[key];
    }
    return undefined;
  };

  const forEach = (callbackfn: (value: V, key: K) => void) => {
    for (const [key, value] of entries()) {
      callbackfn(value, key);
    }
  };

  const set = (key: K, value: V): void => {
    Object.assign(collectionObj, { [key]: value });
  };

  const remove = (key: K) => {
    if (hasOwnKey(collectionObj, key)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- desired behavior
      delete collectionObj[key];
      return true;
    }

    return false;
  };

  const wrap: WrapStrictRecord<K, V> = {
    entries,
    keys,
    values,
    has,
    get,
    get size() {
      return Object.values(collectionObj).filter(isNotNil).length;
    },
    [Symbol.iterator](): IterableIterator<[K, V]> {
      return entries();
    },
    forEach,

    set,
    remove,
    delete: remove,
  };

  return wrap;
};
