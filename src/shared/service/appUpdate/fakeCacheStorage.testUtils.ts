const ORIGIN = 'https://mioframe.example/';

/**
 * Resolves a `Cache.put`/`match`/`delete` key exactly like the real Cache
 * Storage API: a relative string key (e.g. `/assets/app.js`, as production
 * code passes) resolves against this worker's own origin, matching what an
 * absolute `Request`'s `.url` already is.
 * @param request - A cache key, as a relative/absolute string or a `Request`.
 * @returns The absolute URL string used as this fake cache's internal key.
 */
function toCacheKey(request: RequestInfo): string {
  return typeof request === 'string' ? new URL(request, ORIGIN).toString() : request.url;
}

/** Minimal in-memory `Cache` fake keyed by absolute request URL. */
function createFakeCache() {
  const store = new Map<string, Response>();
  return {
    put(request: RequestInfo, response: Response): Promise<void> {
      store.set(toCacheKey(request), response.clone());
      return Promise.resolve();
    },
    match(request: RequestInfo): Promise<Response | undefined> {
      const found = store.get(toCacheKey(request));
      return Promise.resolve(found ? found.clone() : undefined);
    },
    keys(): Promise<Request[]> {
      return Promise.resolve([...store.keys()].map((url) => new Request(url)));
    },
  };
}
type FakeCache = ReturnType<typeof createFakeCache>;

/**
 * Creates an in-memory fake of the global `CacheStorage`/`caches` API,
 * scoped to one test. Each named cache is created lazily and persists for
 * the fake's lifetime; `delete` actually removes it, matching real
 * Cache Storage semantics (a later `open` of the same name starts empty).
 * @returns `{ caches, cachesByName }`: the fake global and its backing map, for direct test setup/inspection.
 */
export function createFakeCacheStorage(): {
  caches: {
    open: (name: string) => Promise<FakeCache>;
    delete: (name: string) => Promise<boolean>;
  };
  cachesByName: Map<string, FakeCache>;
} {
  const cachesByName = new Map<string, FakeCache>();
  return {
    cachesByName,
    caches: {
      open: (name: string): Promise<FakeCache> => {
        let cache = cachesByName.get(name);
        if (!cache) {
          cache = createFakeCache();
          cachesByName.set(name, cache);
        }
        return Promise.resolve(cache);
      },
      delete: (name: string): Promise<boolean> => Promise.resolve(cachesByName.delete(name)),
    },
  };
}
