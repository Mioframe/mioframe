import { firstValueFrom, timeout, type Observable } from 'rxjs';
import type { Promisable } from 'type-fest';
import type { MaybeRefOrGetter } from 'vue';
import { readonly, shallowRef, toValue, watch } from 'vue';

export const defineQuery = <T, Q>(get$: (query: Q) => Observable<T>) => {
  return {
    subscribe: ({
      query,
      next,
      error,
      complete,
    }: {
      query: Q;
      next?: (value: T) => unknown;
      error?: (err: unknown) => unknown;
      complete?: () => unknown;
    }) => {
      const $ = get$(query);

      const subscription = $.subscribe({
        next,
        error,
        complete,
      });

      const unsubscribe = () => {
        subscription.unsubscribe();
      };

      return unsubscribe;
    },
    fetch: (query: Q, waitTime = 30e3) =>
      firstValueFrom(get$(query).pipe(timeout(waitTime))),
  } satisfies QueryDefinition<T, Q>;
};

/**
 * Тип возвращаемого значения из defineQuery
 */
type QueryDefinition<T, Q> = {
  subscribe: (args: {
    query: Q;
    next?: (value: T) => void;
    error?: (err: unknown) => void;
    complete?: () => void;
  }) => Promisable<() => void>;
  fetch: (query: Q, waitTime?: number) => Promise<T | undefined>;
};

/**
 * Vue Composable для работы с defineQuery.
 *
 * @param queryDef Объект, возвращаемый функцией defineQuery
 * @param queryArgs Реактивный источник аргументов (Ref, геттер или значение). Может быть undefined, тогда подписка не создается.
 */
export function useQuery<T, Q>(
  queryDef: QueryDefinition<T, Q>,
  queryArgs: MaybeRefOrGetter<Q | undefined>,
) {
  // Используем shallowRef для data, чтобы избежать лишних проксирований для больших структур данных
  const data = shallowRef<T | undefined>();
  const error = shallowRef<unknown>();
  const isLoading = shallowRef(false);

  watch(
    () => toValue(queryArgs),
    async (newQuery, _, onCleanup) => {
      error.value = undefined;

      if (newQuery === undefined) {
        data.value = undefined;
        isLoading.value = false;
        return;
      }

      isLoading.value = true;

      const unsubscribe = await queryDef.subscribe({
        query: newQuery,
        next: (val) => {
          data.value = val;
          isLoading.value = false;
        },
        error: (err) => {
          error.value = err;
          isLoading.value = false;
        },
      });

      onCleanup(() => {
        unsubscribe();
      });
    },
    { immediate: true },
  );

  return {
    data: readonly(data),
    error: readonly(error),
    isLoading: readonly(isLoading),
    refetch: async () => {
      const q = toValue(queryArgs);
      if (q !== undefined) {
        isLoading.value = true;
        try {
          const res = await queryDef.fetch(q);
          if (res !== undefined) {
            data.value = res;
          }
        } catch (e) {
          error.value = e;
        } finally {
          isLoading.value = false;
        }
      }
    },
  };
}
