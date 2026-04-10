import type { ComputedRef, ShallowRef, WatchStopHandle } from 'vue';
import { shallowRef, computed, watchEffect, onScopeDispose } from 'vue';

export enum AsyncStatus {
  idle = 'idle',
  loading = 'loading',
  success = 'success',
  error = 'error',
}

type LazyAsyncComputed<T> = {
  state: ComputedRef<T>;
  status: ComputedRef<AsyncStatus>;
  error: ComputedRef<unknown>;
  refresh: () => void;
};

type OnCleanup = (cleanupFn: () => void) => void;

export function computedAsyncLazy<T>(
  evaluator: (onCleanup: OnCleanup) => Promise<T> | T,
  initialValue: T,
): LazyAsyncComputed<T>;
export function computedAsyncLazy<T>(
  evaluator: (onCleanup: OnCleanup) => Promise<T> | T,
  initialValue?: T,
): LazyAsyncComputed<T | undefined>;
export function computedAsyncLazy<T>(
  evaluator: (onCleanup: OnCleanup) => Promise<T> | T,
  initialValue?: T,
): LazyAsyncComputed<T | undefined> {
  const data: ShallowRef<T | undefined> = shallowRef(initialValue);
  const error = shallowRef<unknown>();
  const status = shallowRef<AsyncStatus>(AsyncStatus.idle);

  let isInitialized = false;
  let stopWatch: WatchStopHandle | undefined;

  const updateTrigger = shallowRef(0);

  const _load = async (cleanupRegistration: OnCleanup) => {
    status.value = AsyncStatus.loading;
    error.value = undefined;

    let isCancelled = false;
    let userCleanupFn: (() => void) | undefined;

    const wrappedCleanup: OnCleanup = (fn) => {
      userCleanupFn = fn;
    };

    cleanupRegistration(() => {
      isCancelled = true;
      userCleanupFn?.();
    });

    try {
      const result = await evaluator(wrappedCleanup);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- The value may change due to Cleanup
      if (!isCancelled) {
        data.value = result;
        status.value = AsyncStatus.success;
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- The value may change due to Cleanup
      if (!isCancelled) {
        error.value = e;
        status.value = AsyncStatus.error;
      }
    }
  };

  const init = () => {
    if (isInitialized) return;
    isInitialized = true;

    stopWatch = watchEffect((onCleanup) => {
      void updateTrigger.value;
      void _load(onCleanup);
    });
  };

  const refresh = () => {
    if (!isInitialized) {
      init();
    } else {
      updateTrigger.value++;
    }
  };

  onScopeDispose(() => {
    stopWatch?.();
  });

  return {
    state: computed((): T | undefined => {
      if (!isInitialized) init();
      return data.value;
    }),
    status: computed(() => status.value),
    error: computed(() => error.value),
    refresh,
  } satisfies LazyAsyncComputed<T | undefined>;
}
