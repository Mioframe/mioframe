import { firstValueFrom, timeout, type Observable } from 'rxjs';
import type { Promisable } from 'type-fest';
import type { MaybeRefOrGetter } from 'vue';
import { readonly, shallowRef, toValue, watch } from 'vue';

/**
 * Фабрика для создания конфигурации observable-запроса.
 * Принимает функцию, которая возвращает Observable для заданного типа запроса Q.
 * Возвращает объект с методами subscribe (подписка на поток) и fetch (однократное получение).
 *
 * @param get$ Функция, принимающая query-параметры и возвращающая Observable<T>
 * @returns Объект конфигурации запроса с методами subscribe и fetch
 */
export const defineObservableQuery = <T, Q>(
  get$: (query: Q) => Observable<T>,
): QueryDefinition<T, Q> => {
  return {
    /**
     * Подписывает на изменения observable-источника данных.
     * Передаёт query-параметры и коллбэки для обработки событий потока.
     *
     * @param args Объект с query-параметрами и опциональными обработчиками событий
     * @returns Функция отписки, вызываемая для прекращения подписки
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
     * Выполняет однократный fetch запрос с таймаутом по умолчанию 30 секунд.
     * Использует firstValueFrom для конвертации Observable в Promise.
     *
     * @param query Запросные параметры
     * @param waitTime Таймаут в миллисекундах (по умолчанию 30000)
     * @returns Promise с первым значением из потока или undefined при завершении/ошибке
     */
    fetch: (query: Q, waitTime = 30e3): Promise<T | undefined> =>
      firstValueFrom(get$(query).pipe(timeout(waitTime))),
  };
};

/**
 * Интерфейс конфигурации запроса с методами подписки на поток данных и однократного получения.
 * Используется как тип для объекта, возвращаемого defineObservableQuery.
 *
 * @template T Тип данных, передаваемых по потоку (Observable<T>)
 * @template Q Тип query-параметров запроса
 */
export type QueryDefinition<T, Q> = {
  /**
   * Подписывает на изменения observable-источника данных.
   * Передаёт query-параметры и коллбэки для обработки событий потока (next/error/complete).
   *
   * @param args Объект с обязательными query-параметрами и опциональными обработчиками событий:
   * - `query`: Параметры запроса, передаваемые в функцию get$
   * - `next`: Обработчик успешных значений из потока (вызывается при получении данных)
   * - `error`: Обработчик ошибок (вызывается при сбое подключения или ошибках сервера)
   * - `complete`: Обработчик завершения потока (вызывается при завершении источника)
   * @returns Функция отписки, вызываемая для прекращения подписки. Может быть Promisable (Promise-обёртка).
   */
  subscribe: (args: {
    query: Q;
    next?: (value: T) => void;
    error?: (err: unknown) => void;
    complete?: () => void;
  }) => Promisable<() => void>;

  /**
   * Выполняет однократный fetch запрос с таймаутом по умолчанию 30 секунд.
   * Использует firstValueFrom для конвертации Observable в Promise и возвращает первое значение.
   * При превышении таймаута выбрасывается TimeoutError.
   *
   * @param query Запросные параметры, передаваемые в функцию get$
   * @param waitTime Таймаут в миллисекундах (по умолчанию 30000)
   * @returns Promise с первым значением из потока или undefined при завершении/ошибке
   */
  fetch: (query: Q, waitTime?: number) => Promise<T | undefined>;
};

/**
 * Опции для настройки поведения composable useQuery при изменении параметров запроса.
 * Контролирует стратегию обновления состояния данных при реактивных изменениях queryArgs.
 */
export interface UseQueryOptions {
  /**
   * Флаг сохранения предыдущего состояния (data, error) при смене query-параметров.
   * Включает режим кэширования: старые данные сохраняются до получения новых.
   *
   * @example
   * // Режим кэширования — данные не сбрасываются мгновенно
   * const { data } = useQuery(queryDef, reactive({ page }), { preserveOnQueryChange: true });
   *
   * // Мгновенная очистка — стандартное поведение
   * const { data } = useQuery(queryDef, reactive({ page }));
   * @default false
   */
  preserveOnQueryChange?: boolean;
}

/**
 * Vue composable для работы с объектом конфигурации запроса.
 * Автоматически подписывается на изменения реактивных аргументов queryArgs через watch,
 * выполняя новую подписку при их изменении и отменяя предыдущую.
 * При установке undefined в queryArgs подписка отменяется:
 * - если preserveOnQueryChange включён — data очищается, error сбрасывается
 * - иначе — все состояния (data, error, isLoading) мгновенно сбрасываются.
 * Возвращает readonly реактивные ref для data, error, isLoading и метод refetch для ручного перезапуска запроса.
 *
 * @template T Тип данных, передаваемых по потоку (Observable<T>)
 * @template Q Тип query-параметров запроса
 * @param queryDef Объект конфигурации с методами subscribe и fetch (результат вызова defineObservableQuery)
 * @param queryArgs Реактивный источник аргументов запроса (Ref, getter или значение). Может быть undefined — в этом случае подписка не создаётся.
 * @param options Настройки поведения при изменении параметров запроса
 * @returns Объект с readonly реактивными ref для data, error, isLoading и async методом refetch
 *
 * @example
 * // Базовое использование с реактивным объектом
 * const query = reactive({ page: 1 });
 * const { data, isLoading } = useQuery(apiQuery, query);
 *
 * // С режимом сохранения данных при изменении параметров
 * const { data } = useQuery(apiQuery, reactive({ page }), { preserveOnQueryChange: true });
 *
 * // Ручная перезагрузка запроса
 * await refetch();
 */
export function useObservableQuery<T, Q>(
  queryDef: QueryDefinition<T, Q>,
  queryArgs: MaybeRefOrGetter<Q | undefined>,
  options?: UseQueryOptions,
) {
  /**
   * Реактивное хранилище для данных запроса.
   * Используется shallowRef, так как данные могут быть сложными объектами.
   * Тип T | undefined позволяет хранить любые значения из потока, включая Error (который обрабатывается отдельно).
   */
  const data = shallowRef<Exclude<T, Error> | undefined>();

  /**
   * Хранилище для ошибок запроса.
   * Может содержать любое значение unknown (ошибки RxJS, HTTP-статусы и т.д.).
   */
  const error = shallowRef<unknown>();

  /**
   * Флаг загрузки данных. Устанавливается в true при начале запроса, false — после завершения.
   */
  const isLoading = shallowRef(false);

  /**
   * Обработчик успешного получения значения из потока.
   * Проверяет, не является ли значение ошибкой (RxJS может передавать Error как next-значение),
   и обновляет соответствующие состояния.
   *
   * @param v Значение из потока Observable
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
   * Обработчик ошибок из потока.
   * Сохраняет ошибку в state и сбрасывает флаг загрузки.
   *
   * @param e Ошибка, возникшая в потоке (может быть любым типом unknown)
   */
  const onError = (e: unknown) => {
    error.value = e;
    isLoading.value = false;
  };

  /**
   * Наблюдатель за реактивными аргументами запроса.
   * Автоматически создаёт/отменяет подписку при изменении queryArgs.
   * При undefined — отменяет текущую подписку и сбрасывает состояние (если не включён режим сохранения).
   *
   * @param newQuery Новые параметры запроса
   * @param _oldQuery Предыдущие параметры запроса (не используется)
   * @param onCleanup Функция очистки, вызываемая при отписке от watch
   */
  watch(
    () => toValue(queryArgs),
    async (newQuery, _oldQuery, onCleanup) => {
      const shouldPreserve = options?.preserveOnQueryChange ?? false;

      // Если режим сохранения не включён — очищаем данные и ошибки
      if (!shouldPreserve) {
        data.value = undefined;
        error.value = undefined;
      }

      // Если queryArgs равен undefined — отменяем подписку
      if (newQuery === undefined) {
        if (shouldPreserve) {
          error.value = undefined;
        }
        isLoading.value = false;
        return;
      }

      isLoading.value = true;

      // Создаём новую подписку на observable-источник
      const unsubscribe = await queryDef.subscribe({
        query: newQuery,
        next: onNext,
        error: onError,
      });

      // Регистрируем очистку при отписке от watch
      onCleanup(() => {
        unsubscribe();
      });
    },
    { immediate: true },
  );

  return {
    /**
     * Readonly реактивный ref с данными запроса.
     */
    data: readonly(data),

    /**
     * Readonly реактивный ref с ошибкой запроса (если возникла).
     */
    error: readonly(error),

    /**
     * Readonly реактивный флаг загрузки данных.
     */
    isLoading: readonly(isLoading),

    /**
     * Асинхронный метод для ручного перезапуска запроса.
     * Выполняет однократный fetch через queryDef.fetch и обновляет состояние данными.
     * Если queryArgs равен undefined — ничего не делает.
     *
     * @returns Promise<void>
     */
    refetch: async () => {
      const q = toValue(queryArgs);

      // Не выполняем запрос, если queryArgs равен undefined
      if (q !== undefined) {
        isLoading.value = true;

        try {
          const res = await queryDef.fetch(q);

          // Если fetch вернул значение — обновляем данные через onNext
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
