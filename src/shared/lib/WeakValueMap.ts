/**
 * Коллекция с сильными ключами и слабыми значениями.
 *
 * Значения хранятся через WeakRef, поэтому если на объект нет внешних сильных ссылок,
 * сборщик мусора может его удалить, а запись автоматически будет очищена из коллекции
 * с помощью FinalizationRegistry.
 * @template K — тип ключей (хранятся сильно, могут быть любыми, например: string, number, объект)
 * @template V — тип значений (ограничен объектами, поскольку WeakRef может ссылаться только на объекты)
 */
export class WeakValueMap<K, V extends object> implements Iterable<[K, V]> {
  // Приватное хранилище: сильные ссылки на ключи, а значения обёрнуты в WeakRef.
  #map: Map<K, WeakRef<V>>;
  // FinalizationRegistry для очистки записей после удаления значения сборщиком мусора.
  #registry: FinalizationRegistry<K>;

  constructor() {
    this.#map = new Map<K, WeakRef<V>>();
    this.#registry = new FinalizationRegistry((key: K) => {
      this.#map.delete(key);
    });
  }

  /**
   * Добавляет или обновляет запись в коллекции.
   * @param key — ключ записи.
   * @param value — объект-значение.
   * @returns this для возможности цепочки вызовов.
   */
  set(key: K, value: V): this {
    this.#map.set(key, new WeakRef(value));
    // Регистрируем значение для автоматической очистки. В качестве unregister token используем само значение.
    this.#registry.register(value, key, value);
    return this;
  }

  /**
   * Возвращает значение по ключу, если оно существует и ещё не было удалено сборщиком мусора.
   * Если объект был сборщиком удалён, соответствующая запись очищается.
   * @param key — ключ записи.
   * @returns Объект V, либо undefined.
   */
  get(key: K): V | undefined {
    const ref = this.#map.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (value === undefined) {
      // Запись «мертвая»: очищаем её.
      this.#map.delete(key);
    }
    return value;
  }

  /**
   * Проверяет наличие «живого» значения по ключу.
   * @param key — ключ.
   * @returns true, если значение существует и ещё не удалено сборщиком мусора.
   */
  has(key: K): boolean {
    const ref = this.#map.get(key);
    if (!ref) return false;
    const value = ref.deref();
    if (value === undefined) {
      this.#map.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Удаляет запись по ключу.
   *
   * Если значение ещё существует, отменяет его регистрацию в FinalizationRegistry.
   * @param key — ключ для удаления.
   * @returns true, если запись была удалена.
   */
  delete(key: K): boolean {
    const ref = this.#map.get(key);
    if (ref) {
      const value = ref.deref();
      if (value !== undefined) {
        this.#registry.unregister(value);
      }
    }
    return this.#map.delete(key);
  }

  /**
   * Очищает всю коллекцию, отменяя регистрацию всех значений.
   */
  clear(): void {
    for (const [, ref] of this.#map) {
      const value = ref.deref();
      if (value !== undefined) {
        this.#registry.unregister(value);
      }
    }
    this.#map.clear();
  }

  /**
   * Итератор по записям коллекции в формате [ключ, значение].
   *
   * Если значение уже было удалено сборщиком мусора, запись очищается.
   */
  *[Symbol.iterator](): IterableIterator<[K, V]> {
    yield* this.entries();
  }

  /**
   * Возвращает итератор по ключам.
   */
  *keys(): IterableIterator<K> {
    for (const [key, ref] of this.#map) {
      if (ref.deref() !== undefined) {
        yield key;
      } else {
        this.#map.delete(key);
      }
    }
  }

  /**
   * Возвращает итератор по значениям.
   */
  *values(): IterableIterator<V> {
    for (const [key, ref] of this.#map) {
      const value = ref.deref();
      if (value !== undefined) {
        yield value;
      } else {
        this.#map.delete(key);
      }
    }
  }

  /**
   * Возвращает итератор по записям (ключ, значение).
   */
  *entries(): IterableIterator<[K, V]> {
    for (const [key, ref] of this.#map) {
      const value = ref.deref();
      if (value !== undefined) {
        yield [key, value];
      } else {
        this.#map.delete(key);
      }
    }
  }

  /**
   * Вызывает callback для каждой «живой» записи в коллекции.
   * @param callback — функция, принимающая (value, key, map).
   * @param thisArg — значение, используемое в качестве this при вызове callback.
   */
  forEach(callback: (value: V, key: K, map: this) => void, thisArg?: unknown): void {
    for (const [key, ref] of this.#map) {
      const value = ref.deref();
      if (value !== undefined) {
        callback.call(thisArg, value, key, this);
      } else {
        this.#map.delete(key);
      }
    }
  }

  /**
   * Возвращает количество «живых» записей.
   *
   * Обратите внимание, что это вычисляемое значение, и обход коллекции может быть затратным.
   */
  get size(): number {
    let count = 0;
    for (const ref of this.#map.values()) {
      if (ref.deref() !== undefined) {
        count++;
      }
    }
    return count;
  }
}
