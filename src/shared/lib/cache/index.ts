import { isString } from 'es-toolkit';
import { LRUCache } from 'lru-cache';
import { configure } from 'safe-stable-stringify';
import type { UnknownRecord } from 'type-fest';

const stringify = configure({ strict: true });

export class Cache<K, T extends UnknownRecord> {
  lruCache: LRUCache<string, T>;
  originalKeys = new Map<string, K | string>();

  constructor(options: LRUCache.Options<string, T, unknown>) {
    const userDisposeAfter = options.disposeAfter;

    this.lruCache = new LRUCache<string, T>({
      ...options,
      disposeAfter: (value, key, reason) => {
        if (!this.lruCache.has(key)) {
          this.originalKeys.delete(key);
        }
        userDisposeAfter?.(value, key, reason);
      },
    });
  }

  #keyToString(k: K | string) {
    return isString(k) ? k : (stringify(k) ?? 'default-key');
  }

  set(k: K | string, v: T | undefined) {
    const cacheKey = this.#keyToString(k);

    this.originalKeys.set(cacheKey, k);
    this.lruCache.set(cacheKey, v);
  }

  get(k: K | string) {
    return this.lruCache.get(this.#keyToString(k));
  }

  delete(k: K | string) {
    const cacheKey = this.#keyToString(k);

    this.originalKeys.delete(cacheKey);

    return this.lruCache.delete(cacheKey);
  }

  clear() {
    this.originalKeys.clear();
    this.lruCache.clear();
  }

  forEach(fn: (value: T, cacheKey: string) => unknown) {
    this.lruCache.forEach(fn);
  }

  forEachEntry(fn: (value: T, cacheKey: string, originalKey: K | string) => unknown) {
    this.lruCache.forEach((value, cacheKey) => {
      fn(value, cacheKey, this.originalKeys.get(cacheKey) ?? cacheKey);
    });
  }
}
