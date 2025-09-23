import type { WatchHandle } from './subscribeService';
import type { ComputedRef, WatchOptions } from 'vue';
import { computed, nextTick, reactive, shallowRef } from 'vue';
import { proxy } from 'comlink';
import { isUndefined } from 'es-toolkit';
import { tryOnScopeDispose } from '@vueuse/core';
import type { JsonString } from '../brandJson';
import { jsonParse, jsonStringify } from '../brandJson';

const WAIT_STATUS = Symbol('waiting');
const STOP_STATUS = Symbol('stop');

/**
 * use subscriptions from worker as computed ref
 * @param subscribeService
 * @returns
 */
export function useSubscribeClient<V>(
  subscribeService: (
    cb: (v: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
  defaultValue: V,
): ComputedRef<V>;
export function useSubscribeClient<V>(
  subscribeService: (
    cb: (v: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
): ComputedRef<V | undefined>;
export function useSubscribeClient<V>(
  subscribeService: (
    cb: (v: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
  defaultValue?: V,
): ComputedRef<V | undefined> {
  let mainWatchHandle: undefined | typeof WAIT_STATUS | WatchHandle;

  const main = shallowRef<V>();

  const initialMainSubscribe = async () => {
    console.debug('initialMainSubscribe', subscribeService);

    if (isUndefined(mainWatchHandle)) {
      mainWatchHandle = WAIT_STATUS;

      try {
        console.debug('await subscribeService', subscribeService); // FIXME: не работает инициализация подписки.
        mainWatchHandle = await subscribeService(
          proxy((v: V) => {
            console.debug('cb subscribeService', v);
            main.value = v;
          }),
          { immediate: true, deep: 1 },
        );
      } catch (error) {
        console.debug('error await subscribeService', error);
        throw error;
      } finally {
        console.debug('🟢 🏁 finally await subscribeService');
      }

      console.debug('mainWatchHandle', mainWatchHandle);
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
        proxy((v: V | undefined) => {
          if (!isUndefined(v)) {
            reactiveValues.set(key, v);
          } else {
            reactiveValues.delete(key);
          }
        }),
        {
          immediate: true,
        },
      );

      if (valueWatchHandles.get(key) === STOP_STATUS) {
        handle.stop();
      } else {
        valueWatchHandles.set(key, handle);
      }
    }
  };

  const get = (key: K) => {
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

  return {
    get,
    stop,
  };
};

export const useSubscribeByQueryClient = <Q extends unknown[], V>(
  subscribeQueryService: (
    query: Q,
    cb: (v?: V) => unknown,
    options: WatchOptions,
  ) => Promise<WatchHandle>,
) => {
  const wrapService = (
    key: JsonString<Q>,
    cb: (v?: V) => unknown,
    options: WatchOptions,
  ) => {
    const query = jsonParse(key);
    return subscribeQueryService(query, cb, options);
  };

  const { get, stop } = useSubscribeByKeyClient(wrapService);

  return {
    get: (...query: Q) => get(jsonStringify(query)),
    stop: (...query: Q) => {
      stop(jsonStringify(query));
    },
  };
};
