import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { defineCacheObservable } from './defineCacheObservable';

describe('defineCacheObservable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the underlying source alive across a brief all-unsubscribed gap', () => {
    const constructorMock = vi.fn((_key: string) => new Subject<number>());
    const onCacheDelete = vi.fn();
    const cached$ = defineCacheObservable(constructorMock, { onCacheDelete });

    const firstSubscription = cached$('key').subscribe();
    expect(constructorMock).toHaveBeenCalledTimes(1);

    firstSubscription.unsubscribe();
    expect(onCacheDelete).not.toHaveBeenCalled();

    // A resubscribe within the grace period reuses the same source instead
    // of restarting it.
    vi.advanceTimersByTime(500);
    cached$('key').subscribe();

    expect(constructorMock).toHaveBeenCalledTimes(1);
    expect(onCacheDelete).not.toHaveBeenCalled();
  });

  it('tears down the source once no subscriber returns within the grace period', () => {
    const constructorMock = vi.fn((_key: string) => new Subject<number>());
    const onCacheDelete = vi.fn();
    const cached$ = defineCacheObservable(constructorMock, { onCacheDelete });

    const subscription = cached$('key').subscribe();
    subscription.unsubscribe();

    vi.advanceTimersByTime(1000);
    expect(onCacheDelete).toHaveBeenCalledTimes(1);

    cached$('key').subscribe();
    expect(constructorMock).toHaveBeenCalledTimes(2);
  });

  it('replays the last value to a new subscriber', () => {
    const source = new Subject<number>();
    const constructorMock = vi.fn((_key: string) => source);
    const cached$ = defineCacheObservable(constructorMock);

    cached$('key').subscribe();
    source.next(42);

    const received: number[] = [];
    cached$('key').subscribe((value) => received.push(value));

    expect(received).toEqual([42]);
  });
});
