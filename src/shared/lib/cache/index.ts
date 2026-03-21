import { isString } from 'es-toolkit';
import type { BackgroundFetch } from 'lru-cache';
import { LRUCache } from 'lru-cache';
import { configure } from 'safe-stable-stringify';
import type { UnknownRecord } from 'type-fest';

const stringify = configure({ strict: true });

export class Cache<K, T extends UnknownRecord> {
  lruCache: LRUCache<string, T>;

  constructor(
    options: LRUCache<string, T> | LRUCache.Options<string, T, unknown>,
  ) {
    this.lruCache = new LRUCache<string, T>(options);
  }

  #keyToString(k: K | string) {
    return isString(k) ? k : (stringify(k) ?? 'default-key');
  }

  set(k: K | string, v: T | BackgroundFetch<T> | undefined) {
    this.lruCache.set(this.#keyToString(k), v);
  }

  get(k: K | string) {
    return this.lruCache.get(this.#keyToString(k));
  }

  delete(k: K | string) {
    return this.lruCache.delete(this.#keyToString(k));
  }

  clear() {
    this.lruCache.clear();
  }

  forEach(fn: (value: T, cacheKey: string) => unknown) {
    this.lruCache.forEach(fn);
  }
}
