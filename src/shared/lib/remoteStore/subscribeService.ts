import type { MaybeRefOrGetter, WatchOptions, WatchSource } from 'vue';
import { toValue, watch } from 'vue';
import type { StrictRecord } from '../strictRecord/types';
import type { PartialDeep } from 'type-fest';
import type { DeepPutJsonObjectOptions } from '../changeObject/deepPutJsonObject';

import { strictRecordGet } from '../strictRecord/wrapStrictRecord';

import { proxy } from 'comlink';
import { cloneDeepSerialize } from '../wrapWorker/vueTransferHandlerSet';

export type WatchHandle = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

export interface ReactiveMapStore<K extends string, V> {
  get: () => StrictRecord<K, V>;

  getValue: (key: K) => V | undefined;

  subscribe: (
    cb: (v: StrictRecord<K, V>) => unknown,
    options: WatchOptions,
  ) => WatchHandle;

  subscribeValue: (
    key: K,
    cb: (v?: V) => unknown,
    options: WatchOptions,
  ) => WatchHandle;

  set: (key: K, value: V) => void;

  remove: (key: K) => void;

  put: (
    key: K,
    value: PartialDeep<V>,
    options?: DeepPutJsonObjectOptions,
  ) => void;
}

/**
 * define a subscription to a reactive property
 * @param source
 * @returns
 */
export const defineSubscribeService =
  <T>(
    source: WatchSource<T>,
    defineOptions?: {
      onStart?: () => unknown;
      onStop?: () => unknown;
    },
  ) =>
  (cb: (v: T) => unknown, options: WatchOptions): WatchHandle => {
    console.debug('create watch');

    const handle = watch(
      source,
      (v) => {
        cb(cloneDeepSerialize(v));
      },
      options,
    );

    defineOptions?.onStart?.();

    return proxy({
      pause: handle.pause,
      resume: handle.resume,
      stop: () => {
        defineOptions?.onStop?.();
        handle.stop();
      },
    });
  };

export const defineSubscribeValueService =
  <K extends string, V>(
    source: MaybeRefOrGetter<StrictRecord<K, V>>,
    defineOptions?: {
      onStart?: (key: K) => unknown;
      onStop?: (key: K) => unknown;
    },
  ) =>
  (key: K, cb: (v?: V) => unknown, options: WatchOptions): WatchHandle => {
    const proxyHandle = defineSubscribeService(
      () => strictRecordGet(toValue(source), key),
      {
        onStart: () => defineOptions?.onStart?.(key),
        onStop: () => defineOptions?.onStop?.(key),
      },
    );

    return proxyHandle(cb, options);
  };

export const defineSubscribeGetterValueService =
  <K extends string, V, R>(
    source: MaybeRefOrGetter<StrictRecord<K, V>>,
    getter: (key: K, value?: V) => R,
    defineOptions?: {
      onStart?: (key: K) => unknown;
      onStop?: (key: K) => unknown;
    },
  ) =>
  (key: K, cb: (v: R) => unknown, options: WatchOptions): WatchHandle => {
    const proxyHandle = defineSubscribeService(
      () => getter(key, strictRecordGet(toValue(source), key)),
      {
        onStart: () => defineOptions?.onStart?.(key),
        onStop: () => defineOptions?.onStop?.(key),
      },
    );

    return proxyHandle(cb, options);
  };
