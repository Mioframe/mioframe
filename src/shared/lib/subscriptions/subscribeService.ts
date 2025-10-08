import { isEqual, throttle } from 'es-toolkit';
import type { WatchOptions, WatchSource } from 'vue';
import { watch } from 'vue';
import type { SubscribeByQueryService, WatchHandle } from './types';
import {
  SUBSCRIBE_BY_QUERY_SERVICE_SYMBOL,
  SUBSCRIBE_SERVICE_SYMBOL,
  type SubscribeService,
  type SubscribeServiceHandle,
} from './types';

/**
 * define a subscription to a reactive property
 * @param source
 * @returns
 */
export const defineSubscribeService = <T>(
  source: WatchSource<T>,
): SubscribeService<T> => {
  const initialSubscribeService = (
    cb: (v: T) => unknown,
    options?: WatchOptions,
  ): SubscribeServiceHandle => {
    const throttleCb = throttle(cb, 100, {
      edges: ['leading', 'trailing'],
    });

    const handle = watch(
      source,
      (v, old) => {
        if (!isEqual(v, old)) {
          throttleCb(v);
        }
      },
      options,
    );

    return {
      pause: handle.pause,
      resume: handle.resume,
      stop: () => {
        handle.stop();
      },
    };
  };

  initialSubscribeService[SUBSCRIBE_SERVICE_SYMBOL] = true as const;

  return initialSubscribeService;
};

export const defineSubscribeByKeyService =
  <K extends string, R>(getter: (key: K) => R) =>
  (key: K, cb: (v: R) => unknown, options: WatchOptions): WatchHandle => {
    const proxyHandle = defineSubscribeService(() => getter(key));

    return proxyHandle(cb, options);
  };

export const defineSubscribeByQueryService = <Q extends unknown[], R>(
  getter: (...query: Q) => R,
): SubscribeByQueryService<Q, R> => {
  const initialService = (
    query: Q,
    cb: (v: R) => unknown,
    options: WatchOptions,
  ): WatchHandle => {
    const subscribeService = defineSubscribeService(() => getter(...query));

    return subscribeService(cb, options);
  };

  initialService[SUBSCRIBE_BY_QUERY_SERVICE_SYMBOL] = true as const;

  return initialService;
};
