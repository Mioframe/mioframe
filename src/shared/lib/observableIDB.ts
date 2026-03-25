/**
 * Observable-обёртка над idb-keyval для реактивного хранения данных в IndexedDB.
 *
 * @description
 * Класс предоставляет реактивный доступ к данным, хранящимся в IndexedDB через библиотеку `idb-keyval`.
 * Использует `BehaviorSubject` из RxJS для обеспечения реактивности и мгновенного обновления UI.
 *
 * **Архитектурное место:**
 * - Находится в слое `src/shared/lib/` (фундаментальный слой)
 * - Предназначен для абстракции операций CRUD над IndexedDB с реактивным обновлением
 * - Не отвечает за синхронизацию между несколькими источниками данных (это задача Automerge)
 *
 * **Связи:**
 * - Зависит от: `idb-keyval` (IndexedDB API), `rxjs/BehaviorSubject`, `zod/v4-mini` (валидация)
 * - Используется в: сервисы синхронизации, composables для реактивного доступа к данным
 *
 * **Edge cases:**
 * - При инициализации значение может быть `null`, если ключ не существует в IndexedDB
 * - Валидация через Zod возвращает объект `{ success: boolean; data?: T; error?: unknown }`
 * - Если валидация проваливается, Observable всё равно эмитит результат с `success: false`
 *
 * @example
 * ```typescript
 * import { observableIDB } from './observableIDB';
 *
 * // Создание экземпляра для хранения настроек пользователя
 * const userSettings = new ObservableIDB<UserSettings>(
 *   'user_settings',
 *   z.object({
 *     theme: z.enum(['light', 'dark']),
 *     notifications: z.boolean(),
 *   }),
 * );
 *
 * // Подписка на изменения
 * userSettings.observable().subscribe(result => {
 *   if (result.success) {
 *     console.log('Текущие настройки:', result.data);
 *   } else {
 *     console.error('Ошибка валидации:', result.error);
 *   }
 * });
 *
 * // Обновление данных
 * await userSettings.set({ theme: 'dark', notifications: true });
 * ```
 */

import { set, get } from 'idb-keyval';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import type z from 'zod/v4-mini';

/**
 * Класс для реактивного хранения и доступа к данным в IndexedDB с валидацией через Zod.
 *
 * @typeParam T - Тип хранимых данных, должен соответствовать схеме Zod
 *
 * @param key - Уникальный ключ для хранения в IndexedDB (IDBValidKey)
 * @param zod - Схема Zod для валидации и сериализации данных
 */
export class ObservableIDB<T> {
  /**
   * Поведенческий субъект RxJS, хранящий текущее состояние данных.
   * Инициализируется с `null`, пока данные не будут загружены или установлены.
   *
   * @remarks
   * Эмитит результаты валидации Zod: `{ success: boolean; data?: T; error?: unknown }`
   * или `null`, если данных нет в IndexedDB.
   */
  private value$ = new BehaviorSubject<z.core.util.SafeParseResult<T> | null>(
    null,
  );

  /**
   * Конструктор класса ObservableIDB.
   *
   * @param key - Уникальный ключ для хранения данных в IndexedDB
   * @param zod - Схема Zod для валидации и сериализации данных
   *
   * @example
   * ```typescript
   * const config = new ObservableIDB<Config>('app_config', z.object({
   *   apiUrl: z.string().url(),
   *   timeout: z.number().positive(),
   * }));
   * ```
   */
  constructor(
    private key: IDBValidKey,
    private zod: z.ZodMiniType<T>,
  ) {
    void this.init();
  }

  /**
   * Внутренний метод для обновления BehaviorSubject с результатом валидации.
   *
   * @param v - Данные для валидации и хранения
   *
   * @remarks
   * Использует `zod.safeParse()` для безопасной валидации данных.
   * Результат всегда эмитируется, независимо от успеха или неудачи валидации.
   */
  #set(v: T) {
    this.value$.next(this.zod.safeParse(v));
  }

  /**
   * Инициализация экземпляра загрузкой данных из IndexedDB.
   *
   * @returns `void` (асинхронная операция, результат игнорируется через void)
   *
   * @description
   * Асинхронно загружает данные по ключу из IndexedDB и обновляет BehaviorSubject.
   * Если данных нет в хранилище, эмитит `null`.
   * Вызывается автоматически при создании экземпляра класса.
   *
   * @example
   * ```typescript
   * const settings = new ObservableIDB<Settings>('user_settings', schema);
   * // init() вызывается автоматически в конструкторе
   * ```
   */
  async init() {
    const val = await get(this.key);
    this.#set(val);
  }

  /**
   * Возвращает Observable для реактивного наблюдения за изменениями данных.
   *
   * @returns Observable, эмитирующий результаты валидации Zod или `null`
   *
   * @description
   * Подписка на этот Observable позволяет реагировать на любые изменения данных:
   * - При инициализации (первое значение может быть `null`)
   * - После вызова метода `set()`
   *
   * @example
   * ```typescript
   * const observable = userSettings.observable();
   *
   * // Подписка с обработкой успеха/ошибки
   * observable.subscribe({
   *   next: result => {
   *     if (result.success) {
   *       console.log('Данные:', result.data);
   *     } else {
   *       console.error('Ошибка валидации:', result.error);
   *     }
   *   },
   *   complete: () => console.log('Подписка завершена'),
   * });
   * ```
   */
  observable(): Observable<z.z.core.util.SafeParseResult<T> | null> {
    return this.value$.asObservable();
  }

  /**
   * Асинхронно сохраняет данные в IndexedDB и обновляет реактивное состояние.
   *
   * @param newValue - Новые данные для сохранения
   *
   * @returns `Promise<void>` - завершается после записи в IndexedDB и обновления BehaviorSubject
   *
   * @description
   * Двухэтапная операция:
   * 1. Запись данных в IndexedDB через `idb-keyval.set()`
   * 2. Обновление BehaviorSubject с результатом валидации Zod
   *
   * **Важно:** Валидация происходит после записи, поэтому если валидация провалится,
   * данные всё равно будут сохранены в IndexedDB (возможно, стоит добавить валидацию до записи).
   *
   * @example
   * ```typescript
   * // Успешное обновление
   * await userSettings.set({ theme: 'dark', notifications: true });
   *
   * // Обработка ошибки валидации
   * try {
   *   await userSettings.set({ theme: 'invalid' }); // Zod вернёт ошибку
   * } catch (error) {
   *   console.error('Ошибка:', error);
   * }
   * ```
   */
  async set(newValue: T) {
    await set(this.key, newValue);
    this.#set(newValue);
  }
}
