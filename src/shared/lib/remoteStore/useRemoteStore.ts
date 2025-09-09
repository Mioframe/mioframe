import type { StrictRecord } from '../strictRecord/types';
import type { WatchHandle } from './useReactiveStore';
import type { ComputedRef, WatchOptions } from 'vue';
import { computed, nextTick, reactive, shallowRef } from 'vue';
import { proxy } from 'comlink';
import { isUndefined } from 'es-toolkit';
import { tryOnScopeDispose } from '@vueuse/core';
import type { PartialDeep } from 'type-fest';
import type { DeepPutJsonObjectOptions } from '../changeObject/deepPutJsonObject';

interface UseRemoteMapStoreReturn<K extends string, V> {
  store: ComputedRef<StrictRecord<K, V>>;
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => Promise<void>;
  remove: (key: K) => Promise<void>;
}

interface RemoteMapStore<K extends string, V> {
  watch: (
    cb: (v: StrictRecord<K, V>) => unknown,
    options?: WatchOptions,
  ) => Promise<WatchHandle>;

  watchValue: (
    key: K,
    cb: (v?: V) => unknown,
    options?: WatchOptions,
  ) => Promise<WatchHandle>;

  set: (key: K, value: V) => Promise<void>;

  remove: (key: K) => Promise<void>;

  put: (
    key: K,
    value: PartialDeep<V>,
    options?: DeepPutJsonObjectOptions,
  ) => Promise<void>;
}

const WAIT_STATUS = Symbol('waiting');

export const useRemoteMapStore = <K extends string, V>(
  remoteStore: RemoteMapStore<K, V>,
): UseRemoteMapStoreReturn<K, V> => {
  const main = shallowRef<StrictRecord<K, V>>();

  let mainWatchHandle: undefined | typeof WAIT_STATUS | WatchHandle;

  const initialMainWatch = async () => {
    if (isUndefined(mainWatchHandle)) {
      mainWatchHandle = WAIT_STATUS;

      mainWatchHandle = await remoteStore.watch(
        proxy((v: StrictRecord<K, V>) => {
          main.value = v;
        }),
        { immediate: true, deep: 1 },
      );
    }
  };
  const reactiveValues: Map<K, V> = reactive(new Map());

  const valueWatchHandles: Map<K, WatchHandle | typeof WAIT_STATUS> = reactive(
    new Map(),
  );

  const initialValueWatcher = async (key: K) => {
    const oldHandle = valueWatchHandles.get(key);
    if (isUndefined(oldHandle)) {
      valueWatchHandles.set(key, WAIT_STATUS);

      const handle = await remoteStore.watchValue(
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

      valueWatchHandles.set(key, handle);
    }
  };

  const get = (key: K) => {
    void nextTick(() => initialValueWatcher(key));

    return reactiveValues.get(key);
  };

  const set = async (key: K, value: V) => {
    await remoteStore.set(key, value);
  };

  const remove = async (key: K) => {
    await remoteStore.remove(key);
  };

  tryOnScopeDispose(() => {
    if (mainWatchHandle && mainWatchHandle !== WAIT_STATUS) {
      mainWatchHandle.stop();
    }

    valueWatchHandles.forEach((v) => {
      if (v !== WAIT_STATUS) {
        v.stop();
      }
    });
  });

  return {
    set,
    remove,
    store: computed((): StrictRecord<K, V> => {
      void nextTick(initialMainWatch);

      return main.value ?? <StrictRecord<K, V>>{};
    }),
    get,
  };
};

interface RemoteSetStore<V> {
  watch: (
    cb: (v: V[]) => unknown,
    options?: WatchOptions,
  ) => Promise<WatchHandle>;

  set: (value: V) => Promise<void>;

  remove: (key: V) => Promise<void>;
}

interface UseRemoteSetStoreReturn<V> {
  store: ComputedRef<V[]>;
  set: (value: V) => Promise<void>;
  remove: (value: V) => Promise<void>;
}

export const useRemoteSetStore = <V>(
  remoteStore: RemoteSetStore<V>,
): UseRemoteSetStoreReturn<V> => {
  const main = shallowRef<V[]>();

  let mainWatchHandle: undefined | typeof WAIT_STATUS | WatchHandle;

  const initialMainWatch = async () => {
    if (isUndefined(mainWatchHandle)) {
      mainWatchHandle = WAIT_STATUS;

      mainWatchHandle = await remoteStore.watch(
        proxy((v: V[]) => {
          main.value = v;
        }),
        { immediate: true, deep: 1 },
      );
    }
  };

  const set = async (value: V) => {
    await remoteStore.set(value);
  };

  const remove = async (value: V) => {
    await remoteStore.remove(value);
  };

  tryOnScopeDispose(() => {
    if (mainWatchHandle && mainWatchHandle !== WAIT_STATUS) {
      mainWatchHandle.stop();
    }
  });

  return {
    set,
    remove,
    store: computed((): V[] => {
      void nextTick(initialMainWatch);

      return main.value ?? [];
    }),
  };
};
