import type { WatchOptions, WatchSource } from 'vue';
import { watch } from 'vue';

import { proxy } from 'comlink';

export type WatchHandle = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

/**
 * define a subscription to a reactive property
 * @param source
 * @returns
 */
export const defineSubscribeService = <T>(
  source: WatchSource<T>,
  defineOptions?: {
    onStart?: () => unknown;
    onStop?: () => unknown;
  },
) => {
  console.debug('defineSubscribeService');

  const initialSubscribeService = (
    cb: (v: T) => unknown,
    options?: WatchOptions,
  ): WatchHandle => {
    console.debug('🟢 initialSubscribeService');

    const handle = watch(
      source,
      (v) => {
        cb(v);
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

  return initialSubscribeService;
};

export const defineSubscribeByKeyService =
  <K extends string, R>(
    getter: (key: K) => R,
    defineOptions?: {
      onStart?: (key: K) => unknown;
      onStop?: (key: K) => unknown;
    },
  ) =>
  (key: K, cb: (v: R) => unknown, options: WatchOptions): WatchHandle => {
    const proxyHandle = defineSubscribeService(() => getter(key), {
      onStart: () => defineOptions?.onStart?.(key),
      onStop: () => defineOptions?.onStop?.(key),
    });

    return proxyHandle(cb, options);
  };

export const defineSubscribeByQueryService =
  <Q extends unknown[], R>(
    getter: (...query: Q) => R,
    defineOptions?: {
      onStart?: (...query: Q) => unknown;
      onStop?: (...query: Q) => unknown;
    },
  ) =>
  (query: Q, cb: (v: R) => unknown, options: WatchOptions): WatchHandle => {
    const proxyHandle = defineSubscribeService(() => getter(...query), {
      onStart: () => defineOptions?.onStart?.(...query),
      onStop: () => defineOptions?.onStop?.(...query),
    });

    return proxyHandle(cb, options);
  };
