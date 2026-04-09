import { isNil, isNotNil, isUndefined } from 'es-toolkit';
import { hasKey, hasOwnKey } from '../typeGuards/hasOwnKey';
import type { StrictRecord } from './types';

export const strictRecordSet = <K extends string, V>(r: StrictRecord<K, V>, key: K, value: V) => {
  if (isUndefined(value)) {
    strictRecordRemove(r, key);
  } else {
    Object.assign(r, { [key]: value });
  }
};

export const strictRecordRemove = <K extends string, V>(r: StrictRecord<K, V>, key: K) => {
  if (hasOwnKey(r, key)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- desired behavior
    delete r[key];
  }
};

export const strictRecordGet = <K extends string, V>(
  r: StrictRecord<K, V>,
  key: K,
  checkOwn = false,
): V | undefined => {
  if (checkOwn && hasOwnKey(r, key)) {
    return r[key];
  }
  return r[key];
};

export const strictRecordIterableKeys = <K extends string>(obj: StrictRecord<K, unknown>) =>
  function* (): IterableIterator<K> {
    for (const key in obj) {
      if (hasOwnKey(obj, key) && !isNil(obj[key])) {
        yield key;
      }
    }
  };

export const strictRecordIterableEntries = <K extends string, V>(obj?: StrictRecord<K, V>) =>
  function* (): IterableIterator<[K, V]> {
    for (const key in obj) {
      if (hasKey(obj, key)) {
        const item = obj[key];

        if (item) {
          yield [key, item];
        }
      }
    }
  };

export const strictRecordIterableValues = <K extends string, V>(obj?: StrictRecord<K, V>) =>
  function* (): IterableIterator<V> {
    for (const key in obj) {
      if (hasKey(obj, key)) {
        const item = obj[key];

        if (item) {
          yield item;
        }
      }
    }
  };

export const strictRecordClear = (obj: StrictRecord<string, unknown>) => {
  for (const key in strictRecordIterableKeys(obj)) {
    strictRecordRemove(obj, key);
  }
};

export const strictRecordSize = (obj: StrictRecord<string, unknown>) =>
  Object.values(obj).filter(isNotNil).length;

export interface WrapStrictRecordMutation<K extends string, V> {
  set: (key: K, value: V) => void;
  remove: (key: K) => void;
}

export interface ReadonlyWrapStrictRecord<K extends string, V> {
  entries: () => IterableIterator<[K, V]>;
  keys: () => IterableIterator<K>;
  values: () => IterableIterator<V>;
  has: (key: K) => boolean;
  get: (key: K) => V | undefined;
  forEach: (callbackfn: (value: V, key: K) => void) => void;
  [Symbol.iterator](): IterableIterator<[K, V]>;
  readonly size: number;

  on: <N extends keyof WrapStrictRecordMutation<K, V>>(
    name: N,
    listener: (...args: Parameters<WrapStrictRecordMutation<K, V>[N]>) => unknown,
  ) => () => void;
  off: <N extends keyof WrapStrictRecordMutation<K, V>>(
    name: N,
    listener: (...args: Parameters<WrapStrictRecordMutation<K, V>[N]>) => unknown,
  ) => void;
}

export interface WrapStrictRecord<K extends string, V>
  extends ReadonlyWrapStrictRecord<K, V>, WrapStrictRecordMutation<K, V> {}

export const wrapStrictRecord = <K extends string, V>(
  collectionObj: StrictRecord<K, V>,
): WrapStrictRecord<K, V> => {
  const entries = strictRecordIterableEntries(collectionObj);

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

  const keys = strictRecordIterableKeys(collectionObj);

  const has = (key: K): boolean => hasOwnKey(collectionObj, key) && !isNil(collectionObj[key]);

  const get = (key: K): V | undefined => strictRecordGet(collectionObj, key);

  const forEach = (callbackfn: (value: V, key: K) => void) => {
    for (const [key, value] of entries()) {
      callbackfn(value, key);
    }
  };

  const set = (key: K, value: V): void => {
    strictRecordSet(collectionObj, key, value);
    listeners.set.forEach((cb) => cb(key, value));
  };

  const remove = (key: K) => {
    strictRecordRemove(collectionObj, key);
    listeners.remove.forEach((cb) => cb(key));
  };

  const listeners: {
    [N in keyof WrapStrictRecordMutation<K, V>]: Set<
      (...args: Parameters<WrapStrictRecordMutation<K, V>[N]>) => unknown
    >;
  } = {
    remove: new Set(),
    set: new Set(),
  };

  const off = <N extends keyof WrapStrictRecordMutation<K, V>>(
    name: N,
    listener: (...args: Parameters<WrapStrictRecordMutation<K, V>[N]>) => unknown,
  ) => {
    listeners[name].delete(listener);
  };

  const on = <N extends keyof WrapStrictRecordMutation<K, V>>(
    name: N,
    listener: (...args: Parameters<WrapStrictRecordMutation<K, V>[N]>) => unknown,
  ) => {
    listeners[name].add(listener);
    return () => {
      off(name, listener);
    };
  };

  const wrap: WrapStrictRecord<K, V> = {
    entries,
    keys,
    values,
    has,
    get,
    get size() {
      return strictRecordSize(collectionObj);
    },
    [Symbol.iterator](): IterableIterator<[K, V]> {
      return entries();
    },
    forEach,

    set,
    remove,

    on,
    off,
  };

  return wrap;
};
