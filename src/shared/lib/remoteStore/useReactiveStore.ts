import type { Ref, WatchOptions } from 'vue';
import { watch } from 'vue';
import type { StrictRecord } from '../strictRecord/types';
import type { PartialDeep } from 'type-fest';
import type { DeepPutJsonObjectOptions } from '../changeObject/deepPutJsonObject';
import { deepPutJsonObject } from '../changeObject/deepPutJsonObject';
import {
  strictRecordGet,
  strictRecordRemove,
  strictRecordSet,
} from '../strictRecord/wrapStrictRecord';
import { isObjectLike } from '../typeGuards';
import { proxy } from 'comlink';
import { isArray } from 'es-toolkit/compat';

export type WatchHandle = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

export interface ReactiveMapStore<K extends string, V> {
  get: () => StrictRecord<K, V>;

  getValue: (key: K) => V | undefined;

  watch: (
    cb: (v: StrictRecord<K, V>) => unknown,
    options?: WatchOptions,
  ) => WatchHandle;

  watchValue: (
    key: K,
    cb: (v?: V) => unknown,
    options?: WatchOptions,
  ) => WatchHandle;

  set: (key: K, value: V) => void;

  remove: (key: K) => void;

  put: (
    key: K,
    value: PartialDeep<V>,
    options?: DeepPutJsonObjectOptions,
  ) => void;
}

export const useReactiveMapStore = <K extends string, V>(
  source: Ref<StrictRecord<K, V>>,
): ReactiveMapStore<K, V> => {
  const getValueWatch = (
    key: K,
    cb: (v?: V) => unknown,
    options?: WatchOptions,
  ): WatchHandle => {
    const handle = watch(
      () => strictRecordGet(source.value, key),
      (v) => {
        cb(v);
      },
      options,
    );

    return proxy({
      pause: handle.pause,
      resume: handle.resume,
      stop: handle.stop,
    });
  };

  const getSourceWatch = (
    cb: (v: StrictRecord<K, V>) => unknown,
    options?: WatchOptions,
  ): WatchHandle => {
    const handle = watch(
      () => source.value,
      (v) => {
        cb(v);
      },
      options,
    );

    return proxy({
      pause: handle.pause,
      resume: handle.resume,
      stop: handle.stop,
    });
  };
  const getValue = (key: K): V | undefined => source.value[key];
  const getSource = (): StrictRecord<K, V> => source.value;

  const put = (
    key: K,
    value: PartialDeep<V>,
    options?: DeepPutJsonObjectOptions,
  ) => {
    const oldValue = getValue(key);

    if (isObjectLike(oldValue) && isObjectLike(value)) {
      deepPutJsonObject(oldValue, value, options);
    } else {
      Object.assign(source.value, {
        [key]: value,
      });
    }
  };

  return {
    set: (k: K, v: V) => {
      strictRecordSet(source.value, k, v);
    },

    remove: (k: K) => {
      strictRecordRemove(source.value, k);
    },
    put,

    get: getSource,
    getValue,
    watch: getSourceWatch,
    watchValue: getValueWatch,
  };
};

export interface ReactiveSetStore<V> {
  get: () => V[];

  watch: (cb: (v: V[]) => unknown, options?: WatchOptions) => WatchHandle;

  set: (value: V) => void;

  remove: (value: V) => void;
}

export const useReactiveSetStore = <V>(
  source: Ref<Set<V> | V[]>,
): ReactiveSetStore<V> => {
  const getSourceWatch = (
    cb: (v: V[]) => unknown,
    options?: WatchOptions,
  ): WatchHandle => {
    const handle = watch(
      () => source.value,
      (v) => {
        cb(isArray(v) ? v : Array.from(v));
      },
      options,
    );

    return proxy({
      pause: handle.pause,
      resume: handle.resume,
      stop: handle.stop,
    });
  };

  const getSource = (): V[] => {
    if (isArray(source.value)) {
      return source.value;
    }
    return Array.from(source.value);
  };

  return {
    get: getSource,
    watch: getSourceWatch,

    set: (v: V) => {
      if (isArray(source.value)) {
        if (!source.value.includes(v)) {
          source.value.push(v);
        }
      } else {
        source.value.add(v);
      }
    },

    remove: (v: V) => {
      if (isArray(source.value)) {
        const index = source.value.indexOf(v);
        if (index >= 0) {
          source.value.splice(index, 1);
        }
      } else {
        source.value.delete(v);
      }
    },
  };
};
