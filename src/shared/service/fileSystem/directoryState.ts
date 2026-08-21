import { Observable, BehaviorSubject } from 'rxjs';
import { sortBy } from 'es-toolkit';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import type { FSNodeStat } from '@shared/lib/virtualFileSystem';
import type { DirectoryEntries, DirectoryState } from './fileSystemContracts';

/**
 * Narrow dependency contract for the directory state coordinator: only the two `VirtualFileSystem`
 * members it actually calls. A real `VirtualFileSystem` instance satisfies this structurally.
 */
export interface DirectoryReadSource {
  /** Reads the raw, unsorted entries of one directory. */
  readDirectory(path: string): Promise<[string, FSNodeStat][]>;
  /** Subscribes to invalidation events for one path; returns an unsubscribe function. */
  watch(path: string, callback: () => void): () => void;
}

interface CoordinatorEntry {
  readonly subject: BehaviorSubject<DirectoryState>;
  subscriberCount: number;
  dirty: boolean;
  reading: boolean;
  unwatch: (() => void) | undefined;
}

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

/**
 * Owner-local per-normalized-path coordinator for reactive directory reads.
 *
 * Serializes coordinator-owned physical `vfs.readDirectory()` calls to at most one in flight per
 * normalized path, coalesces invalidations received while a read is in flight through a single
 * `dirty` bit, suppresses stale/zero-demand completions, and preserves in-flight ownership across a
 * quick unsubscribe/resubscribe so overlapping reads can never occur. Not a cache: state is
 * released once the last subscriber leaves and any in-flight read has settled.
 * @param vfs - Virtual file system used for the coordinator-owned physical reads and invalidation.
 * @returns Internal `directoryState$` entry point. Not a public UI lifecycle contract.
 */
export const createDirectoryStateCoordinator = (vfs: DirectoryReadSource) => {
  const coordinators = new Map<string, CoordinatorEntry>();

  const releaseEntry = (path: string, entry: CoordinatorEntry) => {
    if (coordinators.get(path) !== entry) {
      // Already replaced by a later coordinator instance for this path; nothing to release.
      return;
    }

    entry.unwatch?.();
    coordinators.delete(path);
  };

  const startRead = (path: string, entry: CoordinatorEntry) => {
    entry.dirty = false;
    entry.reading = true;

    vfs.readDirectory(path).then(
      (rawEntries) => {
        settle(path, entry, {
          status: 'ready',
          entries: sortBy(rawEntries, [0]),
        });
      },
      (error: unknown) => {
        settle(path, entry, { status: 'error', error: toError(error) });
      },
    );
  };

  function settle(
    path: string,
    entry: CoordinatorEntry,
    outcome: { status: 'ready'; entries: DirectoryEntries } | { status: 'error'; error: Error },
  ) {
    entry.reading = false;

    if (entry.subscriberCount <= 0) {
      // Zero demand at settlement: discard the result, start no trailing read, release ownership.
      releaseEntry(path, entry);
      return;
    }

    if (entry.dirty) {
      // A stale/superseded result never publishes; run exactly one trailing read instead.
      startRead(path, entry);
      return;
    }

    entry.subject.next(outcome);
  }

  const invalidate = (path: string, entry: CoordinatorEntry) => {
    if (entry.reading) {
      entry.dirty = true;
      return;
    }

    // Sticky error retry: while `error` is the current published state, a retry runs internally
    // without clearing it. Only a clean outcome (ready or replacement error) replaces it.
    if (entry.subject.getValue().status !== 'error') {
      entry.subject.next({ status: 'reading' });
    }

    startRead(path, entry);
  };

  const getOrCreateEntry = (path: string): CoordinatorEntry => {
    const existing = coordinators.get(path);

    if (existing) {
      return existing;
    }

    const entry: CoordinatorEntry = {
      subject: new BehaviorSubject<DirectoryState>({ status: 'reading' }),
      subscriberCount: 0,
      dirty: false,
      reading: false,
      unwatch: undefined,
    };

    coordinators.set(path, entry);
    entry.unwatch = vfs.watch(path, () => {
      invalidate(path, entry);
    });
    startRead(path, entry);

    return entry;
  };

  const directoryState$ = ({ path }: { path: string }): Observable<DirectoryState> =>
    new Observable<DirectoryState>((subscriber) => {
      const normalizedPath = PathUtils.normalize(path);
      const entry = getOrCreateEntry(normalizedPath);

      entry.subscriberCount += 1;
      const innerSubscription = entry.subject.subscribe(subscriber);

      return () => {
        innerSubscription.unsubscribe();
        entry.subscriberCount -= 1;

        if (entry.subscriberCount <= 0 && !entry.reading) {
          releaseEntry(normalizedPath, entry);
        }
      };
    });

  return { directoryState$ };
};
