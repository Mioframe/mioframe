import { tryOnScopeDispose } from '@vueuse/core';
import { firstValueFrom, timeout, type Observable } from 'rxjs';
import type { Promisable } from 'type-fest';
import { readonly, shallowRef } from 'vue';

/**
 * Adapts an RxJS Observable to the project's reactive source contract.
 * Returns an object with subscribe and fetch methods for interacting with the source.
 *
 * @param observable RxJS Observable<T> to adapt
 * @returns Reactive source object with subscribe and fetch methods
 */
export const fromObservable = <T>($observable: Observable<T>): ObservableSource<T> => {
  return {
    /**
     * Subscribes to the Observable with optional event handlers.
     * Returns an unsubscribe function to stop the subscription.
     *
     * @param args Object with optional event handlers:
     * - `next`: Callback invoked with each emitted value
     * - `error`: Callback invoked when the Observable errors
     * - `complete`: Callback invoked when the Observable completes
     * @returns Unsubscribe function that stops the subscription.
     */
    subscribe: ({
      next,
      error,
      complete,
    }: {
      next?: (value: T) => void;
      error?: (err: unknown) => void;
      complete?: () => void;
    }): Promisable<() => void> => {
      const subscription = $observable.subscribe({
        next,
        error,
        complete,
      });

      return () => {
        subscription.unsubscribe();
      };
    },
    /**
     * Performs a single fetch request with a configurable timeout.
     * Converts Observable to Promise via firstValueFrom and applies the timeout operator.
     * Returns undefined if the Observable completes without emitting any values.
     *
     * @param waitTime Timeout duration in milliseconds. Defaults to 30000 (30 seconds).
     * @returns Promise resolving to the first emitted value, or undefined if no values were emitted or if the Observable completes immediately.
     */
    fetch: (waitTime = 30e3): Promise<T | undefined> =>
      firstValueFrom($observable.pipe(timeout(waitTime))),
  };
};

/**
 * Reactive source contract used by composables that need both subscription and one-shot fetch behavior.
 * This is typically an adapter around an RxJS Observable.
 *
 * @template T Type of data emitted by the Observable
 */
export type ObservableSource<T> = {
  /**
   * Subscribes to the Observable with optional event handlers.
   * Returns an unsubscribe function to stop the subscription.
   *
   * @param args Object with optional event handlers:
   * - `next`: Callback invoked with each emitted value
   * - `error`: Callback invoked when the Observable errors
   * - `complete`: Callback invoked when the Observable completes
   * @returns Unsubscribe function that stops the subscription.
   */
  subscribe: (args: {
    next?: (value: T) => void;
    error?: (err: unknown) => void;
    complete?: () => void;
  }) => Promisable<() => void>;

  /**
   * Performs a single fetch request with a configurable timeout.
   * Converts Observable to Promise via firstValueFrom and applies the timeout operator.
   * Returns undefined if the Observable completes without emitting any values.
   *
   * @param waitTime Timeout duration in milliseconds. Defaults to 30000 (30 seconds).
   * @returns Promise resolving to the first emitted value, or undefined if no values were emitted or if the Observable completes immediately.
   */
  fetch: (waitTime?: number) => Promise<T | undefined>;
};

/**
 * Options interface for useObservable composable configuration.
 * Currently defines placeholder options for potential future features.
 */
export interface UseQueryOptions {
  /**
   * Reserved for future use.
   * Currently unused.
   *
   * @default false
   */
  preserveOnQueryChange?: boolean;
}

/**
 * Vue composable for interacting with an Observable through a query configuration.
 * Initializes a subscription to the Observable and provides reactive access to data, errors, and loading state.
 * Automatically handles cleanup on scope disposal.
 *
 * @template T Type of data emitted by the Observable
 * @param queryDef Reactive source object returned by fromObservable
 * @returns Object with readonly reactive refs for data, error, isLoading and async refetch method
 *
 * @example
 * // Basic usage
 * const observable = from([1, 2, 3]);
 * const wrapped = fromObservable(observable);
 * const { data, error, isLoading, refetch } = useObservable(wrapped);
 */
export function useObservable<T>(queryDef: ObservableSource<T>) {
  /**
   * Reactive storage for query data.
   * Uses shallowRef to track object data changes.
   * Type Exclude<T, Error> | undefined prevents Error-type values from entering data — such values are handled via onError handler and stored in error.ref. RxJS does not guarantee Error instances as next values; this is an implementation assumption.
   */
  const data = shallowRef<Exclude<T, Error> | undefined>();

  /**
   * Storage for query errors.
   * Can hold any unknown type value (RxJS errors, TimeoutError, etc.).
   */
  const error = shallowRef<unknown>();

  /**
   * Data loading flag. Set to true at request start, false after completion.
   */
  const isLoading = shallowRef(false);

  /**
   * Handler for successful value reception from the stream.
   * Checks if the value is an Error instance (RxJS does not guarantee Error instances as next values; this is an implementation assumption),
   and updates corresponding states accordingly.
   *
   * @param v Value from Observable stream
   */
  const onNext = (v: T) => {
    if (v instanceof Error) {
      onError(v);
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- RxJS may pass Error as a next-value, but we already handle this case above; the assertion here is safe because v is guaranteed not to be an Error
      data.value = v as Exclude<T, Error>;
      isLoading.value = false;
      error.value = undefined;
    }
  };

  /**
   * Stream error handler.
   * Stores the error in state and resets the loading flag.
   *
   * @param e Error occurred in the stream (can be any unknown type)
   */
  const onError = (e: unknown) => {
    error.value = e;
    isLoading.value = false;

    console.error(e);
  };

  isLoading.value = true;

  // Create new subscription to observable source

  let unsubscribe: undefined | (() => unknown);

  tryOnScopeDispose(() => {
    unsubscribe?.();
  });

  const init = async () => {
    unsubscribe = await queryDef.subscribe({
      next: onNext,
      error: onError,
    });
  };

  void init();

  return {
    /**
     * Readonly reactive ref with query data. Data type is Exclude<T, Error> | undefined. RxJS does not guarantee Error instances as next values; this is an implementation assumption.
     */
    data: readonly(data),

    /**
     * Readonly reactive ref with query error (if occurred).
     */
    error: readonly(error),

    /**
     * Readonly reactive flag for data loading status.
     */
    isLoading: readonly(isLoading),

    /**
     * Async method for manual request restart.
     * Performs single fetch via queryDef.fetch and updates state with data. Does not clear previous error state.
     *
     * @returns Promise<void>
     */
    refetch: async () => {
      isLoading.value = true;

      try {
        const res = await queryDef.fetch();

        if (res !== undefined) {
          onNext(res);
        }
      } catch (e) {
        onError(e);
      } finally {
        isLoading.value = false;
      }
    },
  };
}
