import { wrap } from 'comlink';
import { createGlobalState } from '@vueuse/core';
import type { Asyncify, UnknownRecord } from 'type-fest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- for utils
type AnyFunction = (...args: any[]) => any;

type AnyRecord = UnknownRecord;

export type RemoteObject<T> = { [K in keyof T]: RemoteValue<T[K]> };

export type RemoteValue<T> = T extends AnyRecord
  ? RemoteObject<T>
  : T extends Asyncify<AnyFunction>
    ? T
    : T extends AnyFunction
      ? Asyncify<T>
      : Promise<T>;

export type RemoteWorker<T> = RemoteValue<T>;

export const defineRemoteWorker = <T>(ep: Worker) => {
  const useWrap = createGlobalState(() => {
    return wrap(ep) as RemoteWorker<T>;
  });

  return useWrap;
};
