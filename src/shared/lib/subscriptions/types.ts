import type { ComputedRef, WatchOptions } from 'vue';

export type WatchHandle = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

export const SUBSCRIBE_SERVICE_SYMBOL = Symbol('SUBSCRIBE_SERVICE_SYMBOL');

export type SubscribeServiceHandle = {
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

export type SubscribeService<T = unknown> = ((
  cb: (v: T) => unknown,
  options?: WatchOptions,
) => SubscribeServiceHandle) & {
  [SUBSCRIBE_SERVICE_SYMBOL]: true;
};

export const SUBSCRIBE_BY_QUERY_SERVICE_SYMBOL = Symbol(
  'SUBSCRIBE_BY_QUERY_SERVICE_SYMBOL',
);

export type SubscribeByQueryService<Q extends unknown[], R> = ((
  query: Q,
  cb: (v: R) => unknown,
  options: WatchOptions,
) => WatchHandle) & {
  [SUBSCRIBE_BY_QUERY_SERVICE_SYMBOL]: true;
};

export type SubscribeClient<V> = ComputedRef<V>;
