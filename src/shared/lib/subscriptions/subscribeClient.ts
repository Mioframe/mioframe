import type { WatchOptions } from 'vue';
import { computed, nextTick, reactive, shallowRef } from 'vue';
import { isUndefined } from 'es-toolkit';
import { tryOnScopeDispose } from '@vueuse/core';
import type { JsonString } from '../brandJson';
import { jsonParse, jsonStringify } from '../brandJson';
import type { SubscribeClient, WatchHandle } from './types';
import { isObjectLike } from '../typeGuards';
import { deepPutJsonObject } from '../changeObject';

const WAIT_STATUS = Symbol('waiting');
const STOP_STATUS = Symbol('stop');

/**
 * use subscriptions from worker as computed ref
 * @param subscribeService
 * @returns
 */
export function createSubscribeClient<V>(
  subscribeService: (
    cb: (v: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
  defaultValue: V,
): SubscribeClient<V>;
export function createSubscribeClient<V>(
  subscribeService: (
    cb: (v: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
): SubscribeClient<V | undefined>;
export function createSubscribeClient<V>(
  subscribeService: (
    cb: (v: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
  defaultValue?: V,
): SubscribeClient<V | undefined> {
  let mainWatchHandle: undefined | typeof WAIT_STATUS | WatchHandle;

  const main = shallowRef<V>();

  const initialMainSubscribe = async () => {
    if (isUndefined(mainWatchHandle)) {
      mainWatchHandle = WAIT_STATUS;

      mainWatchHandle = await subscribeService(
        (v: V) => {
          main.value = v;
        },
        { immediate: true, deep: 1 },
      );
    }
  };

  tryOnScopeDispose(() => {
    if (mainWatchHandle && mainWatchHandle !== WAIT_STATUS) {
      mainWatchHandle.stop();
    }
  });

  return computed((): V | undefined => {
    void nextTick(initialMainSubscribe);

    return main.value ?? defaultValue;
  });
}

/**
 * use subscription value from worker as get function with reactive
 * @param subscribeValueService
 * @returns
 */
export const useSubscribeByKeyClient = <K extends string, V>(
  subscribeValueService: (
    key: K,
    cb: (v?: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
) => {
  const reactiveValues: Map<K, V> = reactive(new Map());

  const valueWatchHandles: Map<
    K,
    WatchHandle | typeof WAIT_STATUS | typeof STOP_STATUS
  > = new Map();

  const initialValueSubscribe = async (key: K) => {
    const oldHandle = valueWatchHandles.get(key);
    if (isUndefined(oldHandle)) {
      valueWatchHandles.set(key, WAIT_STATUS);

      const handle = await subscribeValueService(
        key,
        (v: V | undefined) => {
          if (!isUndefined(v)) {
            const oldValue = reactiveValues.get(key);

            if (isObjectLike(oldValue) && isObjectLike(v)) {
              deepPutJsonObject(oldValue, v);
            } else {
              reactiveValues.set(key, v);
            }
          } else {
            reactiveValues.delete(key);
          }
        },
        {
          immediate: true,
          deep: 1,
        },
      );

      if (valueWatchHandles.get(key) === STOP_STATUS) {
        handle.stop();
      } else {
        valueWatchHandles.set(key, handle);
      }
    }
  };

  const reactiveGet = (key: K) => {
    void nextTick(() => initialValueSubscribe(key));

    return reactiveValues.get(key);
  };

  const stop = (key: K) => {
    const mbHandle = valueWatchHandles.get(key);

    if (mbHandle && mbHandle !== WAIT_STATUS && mbHandle !== STOP_STATUS) {
      mbHandle.stop();
    }
    valueWatchHandles.set(key, STOP_STATUS);
  };

  tryOnScopeDispose(() => {
    valueWatchHandles.forEach((_v, k) => {
      stop(k);
    });
  });

  return reactiveGet;
};

export interface SubscribeByQueryClient<Q extends unknown[], V> {
  (...query: Q): V | undefined;

  /**
   * @deprecated
   */
  get: (...query: Q) => V | undefined;
}

export const useSubscribeByQueryClient = <Q extends unknown[], V>(
  subscribeQueryService: (
    query: Q,
    cb: (v?: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
): SubscribeByQueryClient<Q, V> => {
  const subscribeValueService = (
    key: JsonString<Q>,
    cb: (v?: V) => unknown,
    options: WatchOptions,
  ) => {
    const query = jsonParse(key);
    return subscribeQueryService(query, cb, options);
  };

  const reactiveGetByKey = useSubscribeByKeyClient(subscribeValueService);

  const reactiveGetByQuery = (...query: Q): V | undefined =>
    reactiveGetByKey(jsonStringify(query));

  reactiveGetByQuery['get'] = reactiveGetByQuery;

  return reactiveGetByQuery;
};
