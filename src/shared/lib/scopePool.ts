import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import type { ComputedRef, EffectScope, MaybeRefOrGetter } from 'vue';
import {
  effectScope,
  watch,
  computed,
  shallowRef,
  toValue,
  getCurrentScope,
} from 'vue';
type ScopePool<K extends WeakKey, V> = {
  /** Увеличить счетчик использования и получить состояние */
  retain: (key: K) => V;
  /** Уменьшить счетчик и, если нужно, освободить память */
  release: (key: K) => void;
};

type UseScopePool<K extends WeakKey, V> = () => ScopePool<K, V>;

interface ScopePoolOptions {
  /**
   * Максимальное количество ссылок на один ключ перед тем, как вывести предупреждение.
   * Помогает отловить утечки при неправильном использовании retain/release.
   * @default 100
   */
  maxRefsWarnThreshold?: number;
  /**
   * Включить логирование в консоль при создании/удалении scope (для отладки)
   * @default false
   */
  debug?: boolean;
}

/**
 * Создает пул реактивных областей с подсчетом ссылок.
 * Автоматически удаляет scope, когда количество подписчиков становится 0.
 */
export const defineScopePool = <K extends WeakKey, V extends object>(
  // TODO: добавить поддержку примитивов и использовать для кеширования путей в сервисе.
  // TODO: добавить предохранитель idle, очистку по таймеру бездействия.
  setupFn: (key: K) => V,
  options: ScopePoolOptions = {},
): UseScopePool<K, V> =>
  createGlobalState((): ScopePool<K, V> => {
    const { maxRefsWarnThreshold = 100, debug = false } = options;

    const cacheMap = new WeakMap<
      K,
      { scope: EffectScope; state: V; refs: number }
    >();
    const finalizationRegistry = new FinalizationRegistry(
      (scope: EffectScope) => {
        scope.stop();
      },
    );

    const retain = (key: K): V => {
      let entry = cacheMap.get(key);

      if (!entry) {
        const scope = effectScope(true);
        // Важно: запускаем scope
        const state = scope.run(() => setupFn(key));

        if (state === undefined) {
          scope.stop();
          throw new Error('Scope setup must return a value');
        }

        entry = { scope, state, refs: 0 };

        cacheMap.set(key, entry);
        // Регистрируем токен (сам ключ) для отписки, если ключ будет удален GC
        finalizationRegistry.register(key, scope, key);
      }

      entry.refs++;

      // ⚠️ WARNING 2: Подозрительно много подписчиков
      if (entry.refs > maxRefsWarnThreshold) {
        // eslint-disable-next-line no-console -- Memory Leak Detected
        console.warn(
          `[ScopePool] High ref count warning! Key has ${entry.refs} active references.`,
          `Check for memory leaks or missing release() calls. Key:`,
          key,
        );
      }

      return entry.state;
    };

    const release = (key: K) => {
      const entry = cacheMap.get(key);
      if (!entry) return;

      entry.refs--;

      // Если подписчиков нет — убиваем скоуп и чистим карту
      if (entry.refs <= 0) {
        entry.scope.stop();
        cacheMap.delete(key);
        // Снимаем с регистрации в GC, так как мы удалили всё вручную
        finalizationRegistry.unregister(key);

        if (debug) {
          // eslint-disable-next-line no-console -- for debug
          console.debug('[ScopePool] Disposed scope for key', key);
        }
      }
    };

    return { retain, release };
  });

/**
 * Реактивно подключается к пулу областей.
 * Автоматически управляет жизненным циклом (retain/release).
 */
export const usePoolState = <K extends WeakKey, V>(
  usePool: UseScopePool<K, V>,
  keyOrGetter: MaybeRefOrGetter<K | undefined>,
): ComputedRef<V | undefined> => {
  // ⚠️ WARNING 1: Вызов вне реактивного контекста
  if (!getCurrentScope()) {
    // eslint-disable-next-line no-console -- Memory Leak Detected
    console.warn(
      '[ScopePool] Memory Leak Detected: "usePoolState" called outside of an active EffectScope.',
      'Cleanup handlers will never run. Use "pool.retain/release" manually or wrap this in an "effectScope".',
    );
  }

  const { retain, release } = usePool();

  const keyRef = computed(() => toValue(keyOrGetter));

  const state = shallowRef<V>();

  // Логика переключения ключей
  watch(
    keyRef,
    (newKey, oldKey) => {
      // 1. Освобождаем старый ключ
      if (oldKey) {
        release(oldKey);
      }

      // 2. Захватываем новый ключ
      if (newKey) {
        state.value = retain(newKey);
      } else {
        state.value = undefined;
      }
    },
    { immediate: true, flush: 'sync' },
  );

  // cleanup при размонтировании компонента, который вызвал usePoolState
  tryOnScopeDispose(() => {
    const key = keyRef.value;
    if (key) {
      release(key);
    }
  });
  return computed(() => state.value);
};

/**
 * Создает готовый хук для конкретного пула (синтаксический сахар)
 */
export const createUsePoolHook =
  <K extends WeakKey, V>(usePool: UseScopePool<K, V>) =>
  (key: MaybeRefOrGetter<K | undefined>) =>
    usePoolState(usePool, key);
