import type { Observable } from 'rxjs';
import { distinctUntilChanged, finalize, ReplaySubject, share, timer } from 'rxjs';
import { configure } from 'safe-stable-stringify';

const generateKey = (v: unknown): string =>
  configure({
    strict: false,
    deterministic: true,
  })(v) ?? 'undefined';

/**
 * Grace period, in milliseconds, before an unsubscribed cache entry's
 * underlying source subscription is actually torn down. Consumers of the
 * same query key routinely drop to zero subscribers for a moment during a
 * Vue re-render (e.g. a component remount) and resubscribe on the very next
 * tick; without this grace period, `share`'s ref-counted reset would restart
 * `constructor` from scratch on that resubscribe, momentarily replaying its
 * observable's own initial (often not-yet-loaded) state to every consumer
 * even though the underlying resource never stopped being relevant — and
 * that gap widens under main-thread contention, making it user-visible.
 */
const CACHE_RESET_GRACE_PERIOD_MS = 1000;

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
        share({
          connector: () => new ReplaySubject<T>(1),
          resetOnRefCountZero: () => timer(CACHE_RESET_GRACE_PERIOD_MS),
        }),
      );

      onCacheSet?.(...q);
      $Cache.set(cacheKey, $);
    }

    return $;
  };
};
