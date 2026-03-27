import { firstValueFrom, timeout, type Observable } from 'rxjs';
import type { Promisable } from 'type-fest';
import type { MaybeRefOrGetter } from 'vue';
import { readonly, shallowRef, toValue, watch } from 'vue';

/**
 * Factory function for creating observable query configuration.
 * Accepts a get$ function that returns Observable<T> given query parameters Q.
 * Returns a QueryDefinition object with subscribe and fetch methods.
 *
 * @param get$ Function accepting query parameters and returning Observable<T>
 * @returns Query configuration object with subscribe and fetch methods
 */
export const defineObservableQuery = <T, Q>(
  get$: (query: Q) => Observable<T>,
): QueryDefinition<T, Q> => {
  return {
    /**
     * Subscribes to the Observable returned by get$.
     * Passes query parameters and optional event handlers (next/error/complete).
     *
     * @param args Object with query parameters and optional event handlers
     * @returns Unsubscribe function, called to stop the subscription
     */
    subscribe: ({
      query,
      next,
      error,
      complete,
    }: {
      query: Q;
      next?: (value: T) => void;
      error?: (err: unknown) => void;
      complete?: () => void;
    }): Promisable<() => void> => {
      const $ = get$(query);

      const subscription = $.subscribe({
        next,
        error,
        complete,
      });

      return () => {
        subscription.unsubscribe();
      };
    },
    /**
     * Performs a single fetch request with a default timeout of 30 seconds.
     * Converts Observable to Promise via firstValueFrom and applies the timeout operator.
     *
     * @param query Request parameters
     * @param waitTime Timeout in milliseconds (default: 30000)
     * @returns Promise with the first value from the stream or undefined on completion/error
     */
    fetch: (query: Q, waitTime = 30e3): Promise<T | undefined> =>
      firstValueFrom(get$(query).pipe(timeout(waitTime))),
  };
};

/**
 * Query configuration interface with methods for subscribing to a data stream and single retrieval.
 * Used as the type for the object returned by defineObservableQuery.
 *
 * @template T Type of data passed through the stream (Observable<T>)
 * @template Q Type of query parameters
 */
export type QueryDefinition<T, Q> = {
  /**
   * Subscribes to the Observable returned by get$.
   * Passes query parameters and optional event handlers (next/error/complete).
   *
   * @param args Object with required query parameters and optional event handlers:
   * - `query`: Request parameters passed to the get$ function
   * - `next`: Handler for successful values from the stream (called when data is received)
   * - `error`: Error handler (called on connection failure or server errors)
   * - `complete`: Stream completion handler (called when source completes)
   * @returns Unsubscribe function, called to stop subscription. Can be returned synchronously or asynchronously (Promisable).
   */
  subscribe: (args: {
    query: Q;
    next?: (value: T) => void;
    error?: (err: unknown) => void;
    complete?: () => void;
  }) => Promisable<() => void>;

  /**
   * Performs a single fetch request with a default timeout of 30 seconds.
   * Converts Observable to Promise via firstValueFrom and applies the timeout operator.
   *
   * @param query Request parameters passed to the get$ function
   * @param waitTime Timeout in milliseconds (default: 30000)
   * @returns Promise with the first value from the stream or undefined if Observable completes without emissions. Throws TimeoutError or source error on failure.
   */
  fetch: (query: Q, waitTime?: number) => Promise<T | undefined>;
};

/**
 * Options for configuring useObservableQuery composable behavior when query parameters change.
 * Controls state preservation/clearing strategy (data, error) during reactive queryArgs changes.
 */
export interface UseQueryOptions {
  /**
   * Flag to preserve previous data on reactive queryArgs change.
   * When enabled, data is retained from the prior request and error is cleared.
   *
   * @default false
   */
  preserveOnQueryChange?: boolean;
}

/**
 * Vue composable for working with a query configuration object.
 * Automatically subscribes to reactive queryArgs changes via watch,
 * creating a new subscription on change and cancelling the previous one.
 * When undefined is set in queryArgs, the current subscription is cancelled:
 * - if preserveOnQueryChange is enabled — error is cleared, data is retained
 * - otherwise — all states (data, error, isLoading) are reset.
 * Returns readonly reactive refs for data, error, isLoading and a refetch method for manual request restart.
 *
 * @template T Type of data passed through the stream (Observable<T>)
 * @template Q Type of query parameters
 * @param queryDef Configuration object with subscribe and fetch methods (result of defineObservableQuery call)
 * @param queryArgs Reactive source of query arguments (Ref, getter, or value). When undefined, current subscription is cancelled without creating a new one.
 * @param options Behavior settings when query parameters change
 * @returns Object with readonly reactive refs for data, error, isLoading and async refetch method
 *
 * @example
 * // Basic usage with reactive object
 * const query = reactive({ page: 1 });
 * const { data, error, isLoading, refetch } = useObservableQuery(apiQuery, query);
 *
 * // With data preservation mode on parameter change
 * const { data, error, isLoading, refetch } = useObservableQuery(apiQuery, reactive({ page }), { preserveOnQueryChange: true });
 *
 * // Manual request reload
 * await refetch();
 */
export function useObservableQuery<T, Q>(
  queryDef: QueryDefinition<T, Q>,
  queryArgs: MaybeRefOrGetter<Q | undefined>,
  options?: UseQueryOptions,
) {
  /**
   * Reactive storage for query data.
   * Uses shallowRef to track object data changes.
   * Type Exclude<T, Error> | undefined prevents Error-type values from entering data — such values are handled via onError handler and stored in error.ref.
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
   * Checks if the value is an error (RxJS may pass Error as next-value),
   and updates corresponding states accordingly.
   *
   * @param v Value from Observable stream
   */
  const onNext = (v: T) => {
    if (v instanceof Error) {
      onError(v);
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
  };

  /**
   * Observer for reactive query arguments.
   * Automatically creates/cancels subscription on queryArgs change via await subscribe call.
   * On undefined — cancels current subscription and resets state (unless preservation mode is enabled).
   *
   * @param newQuery New request parameters
   * @param _oldQuery Previous request parameters (unused)
   * @param onCleanup Cleanup function called when unsubscribing from watch
   */
  watch(
    () => toValue(queryArgs),
    async (newQuery, _oldQuery, onCleanup) => {
      const shouldPreserve = options?.preserveOnQueryChange ?? false;

      // If preservation mode is disabled — clear data and errors
      if (!shouldPreserve) {
        data.value = undefined;
        error.value = undefined;
      }

      // If queryArgs equals undefined — cancel subscription
      if (newQuery === undefined) {
        if (shouldPreserve) {
          error.value = undefined;
        }
        isLoading.value = false;
        return;
      }

      isLoading.value = true;

      // Create new subscription to observable source
      const unsubscribe = await queryDef.subscribe({
        query: newQuery,
        next: onNext,
        error: onError,
      });

      // Register cleanup on watch unsubscription
      onCleanup(() => {
        unsubscribe();
      });
    },
    { immediate: true },
  );

  return {
    /**
     * Readonly reactive ref with query data. Data type is Exclude<T, Error> | undefined. Errors are handled via error.ref.
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
     * Performs single fetch via queryDef.fetch and updates state with data.
     * If queryArgs equals undefined — does nothing.
     *
     * @returns Promise<void>
     */
    refetch: async () => {
      const q = toValue(queryArgs);

      // Do not perform request if queryArgs equals undefined
      if (q !== undefined) {
        isLoading.value = true;

        try {
          const res = await queryDef.fetch(q);

          // If fetch returned a value — update data via onNext
          if (res !== undefined) {
            onNext(res);
          }
        } catch (e) {
          onError(e);
        } finally {
          isLoading.value = false;
        }
      }
    },
  };
}
