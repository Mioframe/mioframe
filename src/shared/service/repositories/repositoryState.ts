import { Observable, BehaviorSubject, type Subscription } from 'rxjs';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import type { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import type { DirectoryEntries, DirectoryState } from '../fileSystem/fileSystemContracts';
import type { RepositorySnapshot, RepositoryState } from './repositoryContracts';
import { classifyDirectoryEntries, getRepositoryFacts } from './repositoryStorageFiles';

interface CoordinatorEntry {
  readonly subject: BehaviorSubject<RepositoryState>;
  subscriberCount: number;
  upstreamSubscription: Subscription | undefined;
  derivationActive: boolean;
  derivationNonPublishable: boolean;
  pendingReadyEntries: DirectoryEntries | undefined;
  previousSnapshot: RepositorySnapshot | undefined;
}

/**
 * Owner-local per-normalized-path coordinator for repository candidate derivation.
 *
 * Consumes the file-system directory coordinator's `directoryState$` — it never performs a second
 * canonical `readDirectory()`. At most one derivation is active per normalized path; a directory
 * `reading`/`error` transition immediately makes an in-flight derivation non-publishable, only the
 * newest pending accepted `ready(entries)` survives while a derivation is active, and stale or
 * zero-demand completions never publish. Sticky `error` is preserved across an internal retry
 * derivation, mirroring the file-system coordinator's own sticky-error behavior.
 * @param vfs - Virtual file system used to derive repository facts from an already-read snapshot.
 * @param directoryState$ - File-system directory coordinator's internal reactive read state.
 * @returns Internal `repositoryState$` entry point. Not a public UI lifecycle contract by itself —
 * wrap with `defineObservableQuery` for the public `repositoryState` query.
 */
export const createRepositoryStateCoordinator = (
  vfs: VirtualFileSystem,
  directoryState$: (params: { path: string }) => Observable<DirectoryState>,
) => {
  const coordinators = new Map<string, CoordinatorEntry>();

  const releaseEntry = (path: string, entry: CoordinatorEntry) => {
    if (coordinators.get(path) !== entry) {
      return;
    }

    entry.upstreamSubscription?.unsubscribe();
    coordinators.delete(path);
  };

  const publishLoadingLike = (entry: CoordinatorEntry) => {
    entry.subject.next(
      entry.previousSnapshot
        ? { status: 'refreshing', snapshot: entry.previousSnapshot }
        : { status: 'loading' },
    );
  };

  const runDerivation = (path: string, entry: CoordinatorEntry, entries: DirectoryEntries) => {
    entry.derivationActive = true;
    entry.derivationNonPublishable = false;

    const classifiedEntries = classifyDirectoryEntries(entries);

    getRepositoryFacts(vfs, path, entries).then(
      (facts) => {
        settleDerivation(path, entry, {
          documentIds: facts.documentIds,
          isInitialized: facts.isInitialized,
          entries: classifiedEntries,
        });
      },
      (error: unknown) => {
        // getRepositoryFacts already tolerates expected candidate failures internally; reaching
        // here is an unexpected defect, not a modeled repository lifecycle error. Absorb it as a
        // diagnostic instead of inventing a new terminal repository error taxonomy.
        captureDiagnosticException(
          error instanceof Error
            ? error
            : new Error('Repository derivation failed', { cause: error }),
          { operation: 'repositoryStateDerivation', feature: 'repositoryState' },
        );
        settleAbandoned(path, entry);
      },
    );
  };

  const settleAbandoned = (path: string, entry: CoordinatorEntry) => {
    entry.derivationActive = false;

    if (entry.subscriberCount <= 0) {
      releaseEntry(path, entry);
      return;
    }

    if (entry.pendingReadyEntries) {
      const nextEntries = entry.pendingReadyEntries;
      entry.pendingReadyEntries = undefined;
      runDerivation(path, entry, nextEntries);
    }
  };

  function settleDerivation(path: string, entry: CoordinatorEntry, snapshot: RepositorySnapshot) {
    entry.derivationActive = false;

    if (entry.subscriberCount <= 0) {
      releaseEntry(path, entry);
      return;
    }

    if (entry.pendingReadyEntries) {
      const nextEntries = entry.pendingReadyEntries;
      entry.pendingReadyEntries = undefined;
      runDerivation(path, entry, nextEntries);
      return;
    }

    if (entry.derivationNonPublishable) {
      return;
    }

    entry.previousSnapshot = snapshot;
    entry.subject.next({ status: 'ready', snapshot });
  }

  const handleDirectoryState = (path: string, entry: CoordinatorEntry, state: DirectoryState) => {
    if (state.status === 'reading') {
      if (entry.derivationActive) {
        entry.derivationNonPublishable = true;
      }
      entry.pendingReadyEntries = undefined;
      publishLoadingLike(entry);
      return;
    }

    if (state.status === 'error') {
      if (entry.derivationActive) {
        entry.derivationNonPublishable = true;
      }
      entry.pendingReadyEntries = undefined;
      entry.subject.next({ status: 'error', error: state.error });
      return;
    }

    if (entry.derivationActive) {
      // Only the newest pending accepted ready snapshot survives while a derivation is active.
      entry.pendingReadyEntries = state.entries;
      return;
    }

    runDerivation(path, entry, state.entries);
  };

  const getOrCreateEntry = (path: string): CoordinatorEntry => {
    const existing = coordinators.get(path);

    if (existing) {
      return existing;
    }

    const entry: CoordinatorEntry = {
      subject: new BehaviorSubject<RepositoryState>({ status: 'loading' }),
      subscriberCount: 0,
      upstreamSubscription: undefined,
      derivationActive: false,
      derivationNonPublishable: false,
      pendingReadyEntries: undefined,
      previousSnapshot: undefined,
    };

    coordinators.set(path, entry);

    return entry;
  };

  const repositoryState$ = ({ path }: { path: string }): Observable<RepositoryState> =>
    new Observable<RepositoryState>((subscriber) => {
      const normalizedPath = PathUtils.normalize(path);
      const entry = getOrCreateEntry(normalizedPath);

      entry.subscriberCount += 1;

      entry.upstreamSubscription ??= directoryState$({ path: normalizedPath }).subscribe(
        (state) => {
          handleDirectoryState(normalizedPath, entry, state);
        },
      );

      const innerSubscription = entry.subject.subscribe(subscriber);

      return () => {
        innerSubscription.unsubscribe();
        entry.subscriberCount -= 1;

        if (entry.subscriberCount <= 0) {
          entry.upstreamSubscription?.unsubscribe();
          entry.upstreamSubscription = undefined;

          if (entry.derivationActive) {
            // Mark now, not only at settlement: a resubscribe before settlement must never revive
            // this specific in-flight derivation's result.
            entry.derivationNonPublishable = true;
          } else {
            releaseEntry(normalizedPath, entry);
          }
        }
      };
    });

  return { repositoryState$ };
};
