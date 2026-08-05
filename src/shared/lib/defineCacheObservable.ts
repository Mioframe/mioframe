import type { Observable } from 'rxjs';
import { distinctUntilChanged, finalize, shareReplay } from 'rxjs';
import { configure } from 'safe-stable-stringify';

const generateKey = (v: unknown): string =>
  configure({
    strict: false,
    deterministic: true,
  })(v) ?? 'undefined';

export const defineCacheObservable = <Q extends unknown[], T>(
  constructor: (...q: Q) => Observable<T>,
  {
    onCacheDelete,
    onCacheSet,
  }: {
    onCacheDelete?: (...q: Q) => unknown;
    onCacheSet?: (...q: Q) => unknown;
  } = {},
) => {
  const $Cache = new Map<string, Observable<T>>();

  return (...q: Q): Observable<T> => {
    const cacheKey = generateKey(q);

    let $ = $Cache.get(cacheKey);

    if (!$) {
      $ = constructor(...q).pipe(
        distinctUntilChanged(),
        finalize(() => {
          onCacheDelete?.(...q);
          return $Cache.delete(cacheKey);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

      onCacheSet?.(...q);
      $Cache.set(cacheKey, $);
    }

    return $;
  };
};
