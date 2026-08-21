import type { Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { FSNodeStat } from '@shared/lib/virtualFileSystem';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { createDirectoryStateCoordinator, type DirectoryReadSource } from './directoryState';
import type { DirectoryState } from './fileSystemContracts';

const stat = (size = 0): FSNodeStat => ({
  type: FSNodeType.File,
  size,
  capabilities: { canDelete: true, canChangePath: true },
});

type PendingRead = {
  path: string;
  resolve: (entries: [string, FSNodeStat][]) => void;
  reject: (error: unknown) => void;
};

const createControllableVfs = () => {
  const watchers = new Map<string, Set<() => void>>();
  const pendingReads: PendingRead[] = [];
  let readCallCount = 0;
  let maxConcurrentReads = 0;
  const unwatchCalls: string[] = [];

  const readDirectory = vi.fn((path: string) => {
    readCallCount += 1;

    return new Promise<[string, FSNodeStat][]>((resolve, reject) => {
      pendingReads.push({ path, resolve, reject });
      maxConcurrentReads = Math.max(maxConcurrentReads, pendingReads.length);
    });
  });

  const watch = vi.fn((path: string, callback: () => void) => {
    let set = watchers.get(path);
    if (!set) {
      set = new Set();
      watchers.set(path, set);
    }
    set.add(callback);

    return () => {
      set.delete(callback);
      unwatchCalls.push(path);
    };
  });

  const vfs: DirectoryReadSource = { readDirectory, watch };

  return {
    vfs,
    invalidate: (path: string) => {
      watchers.get(path)?.forEach((callback) => {
        callback();
      });
    },
    resolveNextRead: (entries: [string, FSNodeStat][]) => {
      const item = pendingReads.shift();
      if (!item) throw new Error('No pending read to resolve');
      item.resolve(entries);
    },
    rejectNextRead: (error: unknown) => {
      const item = pendingReads.shift();
      if (!item) throw new Error('No pending read to reject');
      item.reject(error);
    },
    pendingReadCount: () => pendingReads.length,
    readCallCount: () => readCallCount,
    maxConcurrentReads: () => maxConcurrentReads,
    hasActiveWatcher: (path: string) => (watchers.get(path)?.size ?? 0) > 0,
    unwatchCalls,
  };
};

const collectStates = (state$: Observable<DirectoryState>) => {
  const states: DirectoryState[] = [];
  const subscription = state$.subscribe((value) => states.push(value));

  return {
    states,
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
};

describe('createDirectoryStateCoordinator', () => {
  it('sorts a successful read by name exactly once', async () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const { states } = collectStates(directoryState$({ path: '/A' }));

    controllable.resolveNextRead([
      ['c', stat()],
      ['a', stat()],
      ['b', stat()],
    ]);

    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({
        status: 'ready',
        entries: [
          ['a', stat()],
          ['b', stat()],
          ['c', stat()],
        ],
      });
    });
    expect(controllable.readCallCount()).toBe(1);
  });

  it('publishes reading synchronously on subscribe before the physical read starts', () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const { states } = collectStates(directoryState$({ path: '/A' }));

    expect(states).toEqual([{ status: 'reading' }]);
    expect(controllable.readCallCount()).toBe(1);
  });

  it('keeps coordinator-owned same-path read concurrency at or below 1 while coalescing a burst of invalidations, and suppresses the stale result', async () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const { states } = collectStates(directoryState$({ path: '/A' }));

    // Burst of invalidations while the first read is still in flight: must coalesce into a single
    // dirty bit, not start additional physical reads.
    controllable.invalidate('/A');
    controllable.invalidate('/A');
    controllable.invalidate('/A');

    expect(controllable.readCallCount()).toBe(1);
    expect(controllable.pendingReadCount()).toBe(1);

    // Resolve the now-stale first read: it must never publish, and must be immediately superseded
    // by exactly one trailing read.
    controllable.resolveNextRead([['stale', stat()]]);

    await vi.waitFor(() => {
      expect(controllable.readCallCount()).toBe(2);
    });
    expect(controllable.maxConcurrentReads()).toBe(1);
    // Only the initial `reading` was published; the stale result never surfaced.
    expect(states).toEqual([{ status: 'reading' }]);

    controllable.resolveNextRead([['fresh', stat()]]);

    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({ status: 'ready', entries: [['fresh', stat()]] });
    });
    expect(states).toEqual([
      { status: 'reading' },
      { status: 'ready', entries: [['fresh', stat()]] },
    ]);
  });

  it('synchronously republishes reading on invalidation while ready, then reads again', async () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const { states } = collectStates(directoryState$({ path: '/A' }));
    controllable.resolveNextRead([['first', stat()]]);
    await vi.waitFor(() => {
      expect(states.at(-1)?.status).toBe('ready');
    });

    controllable.invalidate('/A');

    // The transition to `reading` must be synchronous, before the second read settles.
    expect(states.at(-1)).toEqual({ status: 'reading' });
    expect(controllable.readCallCount()).toBe(2);

    controllable.resolveNextRead([['second', stat()]]);
    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({ status: 'ready', entries: [['second', stat()]] });
    });
  });

  it('normalized-equivalent paths share one coordinator and one physical read', () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const first = collectStates(directoryState$({ path: '/A//B' }));
    const second = collectStates(directoryState$({ path: '/A/B/' }));

    expect(controllable.readCallCount()).toBe(1);
    expect(first.states).toEqual(second.states);
  });

  it('reuses the coordinator across a quick unsubscribe/resubscribe during an in-flight read without starting an overlapping read', async () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const first = collectStates(directoryState$({ path: '/A' }));
    expect(controllable.readCallCount()).toBe(1);

    first.unsubscribe();

    const second = collectStates(directoryState$({ path: '/A' }));

    expect(controllable.readCallCount()).toBe(1);
    expect(controllable.pendingReadCount()).toBe(1);

    controllable.resolveNextRead([['x', stat()]]);

    await vi.waitFor(() => {
      expect(second.states.at(-1)).toEqual({ status: 'ready', entries: [['x', stat()]] });
    });
  });

  it('discards a zero-demand settlement, starts no trailing read, and releases coordinator/watcher state', async () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const first = collectStates(directoryState$({ path: '/A' }));
    expect(controllable.hasActiveWatcher('/A')).toBe(true);

    first.unsubscribe();
    expect(controllable.hasActiveWatcher('/A')).toBe(true); // still owned until settlement

    controllable.resolveNextRead([['discarded', stat()]]);

    await vi.waitFor(() => {
      expect(controllable.hasActiveWatcher('/A')).toBe(false);
    });
    expect(first.states).toEqual([{ status: 'reading' }]);

    // A later fresh subscribe must start a brand-new read, not reuse stale state.
    const second = collectStates(directoryState$({ path: '/A' }));
    expect(second.states).toEqual([{ status: 'reading' }]);
    expect(controllable.readCallCount()).toBe(2);
  });

  it('keeps a sticky error current across an internal retry, replacing it only on a clean outcome', async () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const { states } = collectStates(directoryState$({ path: '/A' }));
    const firstError = new Error('first failure');
    controllable.rejectNextRead(firstError);

    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({ status: 'error', error: firstError });
    });

    controllable.invalidate('/A');

    // Retry runs internally: the sticky error must not be cleared before the retry settles.
    expect(states.at(-1)).toEqual({ status: 'error', error: firstError });
    expect(controllable.readCallCount()).toBe(2);

    controllable.resolveNextRead([['recovered', stat()]]);

    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({ status: 'ready', entries: [['recovered', stat()]] });
    });
    expect(states).toEqual([
      { status: 'reading' },
      { status: 'error', error: firstError },
      { status: 'ready', entries: [['recovered', stat()]] },
    ]);
  });

  it('replaces a sticky error with a new error on a clean failed retry', async () => {
    const controllable = createControllableVfs();
    const { directoryState$ } = createDirectoryStateCoordinator(controllable.vfs);

    const { states } = collectStates(directoryState$({ path: '/A' }));
    const firstError = new Error('first failure');
    controllable.rejectNextRead(firstError);
    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({ status: 'error', error: firstError });
    });

    controllable.invalidate('/A');
    const secondError = new Error('second failure');
    controllable.rejectNextRead(secondError);

    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({ status: 'error', error: secondError });
    });
  });
});
