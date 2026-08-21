import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import type { FSNodeStat } from '@shared/lib/virtualFileSystem';
import { FSNodeType, VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { partialKeyToFileName, storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import type { DirectoryEntries, DirectoryState } from '../fileSystem/fileSystemContracts';
import type { RepositoryState } from './repositoryContracts';
import type { RepositoryFacts } from './repositoryStorageFiles';
import { createRepositoryStateCoordinator } from './repositoryState';

const captureDiagnosticExceptionMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    captureDiagnosticException: captureDiagnosticExceptionMock,
  };
});

const getRepositoryFactsMock = vi.hoisted(() => vi.fn());

vi.mock('./repositoryStorageFiles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./repositoryStorageFiles')>();
  return {
    ...actual,
    getRepositoryFacts: getRepositoryFactsMock,
  };
});

const fileStat: FSNodeStat = {
  type: FSNodeType.File,
  size: 0,
  capabilities: { canDelete: true, canChangePath: true },
};

const documentId = () => new Repo().create({}).documentId;

const entries = (...names: string[]): DirectoryEntries => names.map((name) => [name, fileStat]);

type PendingFacts = { resolve: (facts: RepositoryFacts) => void; reject: (error: unknown) => void };

const createControllableFacts = () => {
  const pending: PendingFacts[] = [];

  getRepositoryFactsMock.mockImplementation(
    () =>
      new Promise<RepositoryFacts>((resolve, reject) => {
        pending.push({ resolve, reject });
      }),
  );

  return {
    resolveNext: (facts: RepositoryFacts) => {
      const item = pending.shift();
      if (!item) throw new Error('No pending getRepositoryFacts call to resolve');
      item.resolve(facts);
    },
    rejectNext: (error: unknown) => {
      const item = pending.shift();
      if (!item) throw new Error('No pending getRepositoryFacts call to reject');
      item.reject(error);
    },
    pendingCount: () => pending.length,
    callCount: () => getRepositoryFactsMock.mock.calls.length,
  };
};

const createDirectorySource = () => {
  const subjects = new Map<string, Subject<DirectoryState>>();

  const getSubject = (path: string) => {
    let subject = subjects.get(path);
    if (!subject) {
      subject = new Subject<DirectoryState>();
      subjects.set(path, subject);
    }
    return subject;
  };

  return {
    directoryState$: ({ path }: { path: string }): Observable<DirectoryState> =>
      getSubject(path).asObservable(),
    emit: (path: string, state: DirectoryState) => {
      getSubject(path).next(state);
    },
    subscriberCount: (path: string) => subjects.get(path)?.observed ?? false,
  };
};

const collectStates = (state$: Observable<RepositoryState>) => {
  const states: RepositoryState[] = [];
  const subscription = state$.subscribe((value) => states.push(value));

  return {
    states,
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
};

const vfsStub = new VirtualFileSystem();

describe('createRepositoryStateCoordinator', () => {
  beforeEach(() => {
    getRepositoryFactsMock.mockReset();
    captureDiagnosticExceptionMock.mockReset();
  });

  it('publishes loading while the directory is reading with no previous snapshot, then derives on ready', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', { status: 'reading' });

    // The coordinator's own initial subject value already publishes `loading`; the upstream
    // `reading` notification republishes the same `loading` — both are legitimate, undeduplicated
    // emissions (this coordinator makes no distinctness promise, matching the file-system
    // coordinator's own no-dedup design).
    expect(states).toEqual([{ status: 'loading' }, { status: 'loading' }]);

    source.emit('/A', { status: 'ready', entries: entries('visible.txt') });

    // Zero canonical readDirectory calls: getRepositoryFacts must be reached only through the
    // already-read entries passed in, never through vfsStub.
    expect(facts.callCount()).toBe(1);
    expect(getRepositoryFactsMock).toHaveBeenCalledWith(vfsStub, '/A', entries('visible.txt'));

    const docId = documentId();
    facts.resolveNext({ documentIds: [docId], isInitialized: true });

    await vi.waitFor(() => {
      expect(states.at(-1)).toEqual({
        status: 'ready',
        snapshot: {
          documentIds: [docId],
          isInitialized: true,
          entries: [{ entry: ['visible.txt', fileStat], classification: 'regular' }],
        },
      });
    });
  });

  it('excludes the repository marker from entries and classifies a plausible storage filename', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const docId = documentId();
    const storageFileName = partialKeyToFileName([docId, 'snapshot', 'hash']);
    if (!storageFileName) throw new Error('Failed to build a storage file fixture name');
    const { states } = collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', {
      status: 'ready',
      entries: entries(storageAdapterMarkerFileName, storageFileName, 'notes.txt'),
    });
    facts.resolveNext({ documentIds: [docId], isInitialized: true });

    await vi.waitFor(() => {
      const last = states.at(-1);
      if (last?.status !== 'ready') throw new Error('not ready yet');
      expect(last.snapshot.entries).toEqual(
        expect.arrayContaining([
          { entry: ['notes.txt', fileStat], classification: 'regular' },
          {
            entry: [storageFileName, fileStat],
            classification: 'automergeStorageCandidate',
          },
        ]),
      );
      expect(last.snapshot.entries).toHaveLength(2);
    });
  });

  it('keeps derivation concurrency at or below 1, retaining only the newest pending accepted ready snapshot', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    expect(facts.callCount()).toBe(1);

    // While the first derivation is in flight, two more ready snapshots arrive; only the newest
    // must survive, and no second derivation may start yet.
    source.emit('/A', { status: 'ready', entries: entries('b.txt') });
    source.emit('/A', { status: 'ready', entries: entries('c.txt') });
    expect(facts.callCount()).toBe(1);
    expect(facts.pendingCount()).toBe(1);

    facts.resolveNext({ documentIds: [], isInitialized: false });

    await vi.waitFor(() => {
      expect(facts.callCount()).toBe(2);
    });
    expect(getRepositoryFactsMock).toHaveBeenLastCalledWith(vfsStub, '/A', entries('c.txt'));
  });

  it('suppresses a stale derivation completion after a directory reading transition, publishing only the fresh result', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });

    const docId = documentId();
    facts.resolveNext({ documentIds: [docId], isInitialized: true });
    await vi.waitFor(() => {
      expect(states.at(-1)?.status).toBe('ready');
    });

    // Directory starts reading again: the previous snapshot must be retained (refreshing, no
    // spinner), and this ready derivation, once superseded, must never publish.
    source.emit('/A', { status: 'reading' });
    expect(states.at(-1)).toEqual({
      status: 'refreshing',
      snapshot: {
        documentIds: [docId],
        isInitialized: true,
        entries: [{ entry: ['a.txt', fileStat], classification: 'regular' }],
      },
    });

    source.emit('/A', { status: 'ready', entries: entries('a.txt', 'b.txt') });
    expect(facts.callCount()).toBe(2);

    facts.resolveNext({ documentIds: [docId], isInitialized: true });

    await vi.waitFor(() => {
      const last = states.at(-1);
      if (last?.status !== 'ready') throw new Error('not ready yet');
      expect(last.snapshot.entries).toHaveLength(2);
    });
  });

  it('makes an in-flight derivation non-publishable and reports a repository error immediately on a directory error', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    expect(facts.callCount()).toBe(1);

    const directoryError = new Error('read failed');
    source.emit('/A', { status: 'error', error: directoryError });

    expect(states.at(-1)).toEqual({ status: 'error', error: directoryError });

    // The now-stale in-flight derivation must not overwrite the error when it eventually settles.
    facts.resolveNext({ documentIds: [], isInitialized: false });
    await Promise.resolve();
    await Promise.resolve();

    expect(states.at(-1)).toEqual({ status: 'error', error: directoryError });
  });

  it('discards a zero-demand derivation completion, releases upstream demand, and never revives it on resubscribe', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const first = collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    expect(facts.callCount()).toBe(1);
    expect(source.subscriberCount('/A')).toBe(true);

    first.unsubscribe();
    expect(source.subscriberCount('/A')).toBe(false); // upstream demand released

    const second = collectStates(repositoryState$({ path: '/A' }));
    // Resubscribe reattaches to directory state without starting a second derivation.
    expect(facts.callCount()).toBe(1);

    facts.resolveNext({ documentIds: [], isInitialized: false });
    await Promise.resolve();
    await Promise.resolve();

    // The old (zero-demand) derivation's result is never revived, even though a subscriber exists
    // again now.
    expect(second.states).toEqual([{ status: 'loading' }]);

    source.emit('/A', { status: 'ready', entries: entries('a.txt', 'b.txt') });
    expect(facts.callCount()).toBe(2);
    facts.resolveNext({ documentIds: [], isInitialized: false });

    await vi.waitFor(() => {
      const last = second.states.at(-1);
      if (last?.status !== 'ready') throw new Error('not ready yet');
      expect(last.snapshot.entries).toHaveLength(2);
    });
  });

  it('publishes an atomic snapshot: documentIds, isInitialized, and entries all land in one emission', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));
    const beforeCount = states.length;
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    const docId = documentId();
    facts.resolveNext({ documentIds: [docId], isInitialized: true });

    await vi.waitFor(() => {
      expect(states.length).toBeGreaterThan(beforeCount);
    });
    // Exactly one new emission carries the complete snapshot; no partial ids-only or
    // entries-only intermediate state was published.
    expect(states.length).toBe(beforeCount + 1);
    expect(states.at(-1)).toMatchObject({
      status: 'ready',
      snapshot: { documentIds: [docId], isInitialized: true },
    });
  });

  it('absorbs an unexpected derivation failure as a diagnostic without inventing a new repository error state', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });

    const unexpected = new Error('unexpected defect');
    facts.rejectNext(unexpected);

    await vi.waitFor(() => {
      expect(captureDiagnosticExceptionMock).toHaveBeenCalledTimes(1);
    });
    expect(states).toEqual([{ status: 'loading' }]);
  });

  it('shares one normalized coordinator/derivation for equivalent path spellings, never keying by the raw input path', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const directoryStateSpy = vi.fn(source.directoryState$);
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, directoryStateSpy);

    const first = collectStates(repositoryState$({ path: '/A' }));
    const second = collectStates(repositoryState$({ path: '/A//' }));

    // Both subscriptions must resolve to the same normalized coordinator: exactly one upstream
    // directory-state subscription, keyed by the normalized path, not by the raw input string.
    expect(directoryStateSpy).toHaveBeenCalledTimes(1);
    expect(directoryStateSpy).toHaveBeenCalledWith({ path: '/A' });

    source.emit('/A', { status: 'ready', entries: entries('shared.txt') });

    // One active derivation for one accepted ready snapshot, shared by both subscribers.
    expect(facts.callCount()).toBe(1);

    const docId = documentId();
    facts.resolveNext({ documentIds: [docId], isInitialized: true });

    await vi.waitFor(() => {
      expect(first.states.at(-1)?.status).toBe('ready');
      expect(second.states.at(-1)?.status).toBe('ready');
    });

    // Both subscribers observe the exact same resulting repository state.
    expect(first.states.at(-1)).toEqual(second.states.at(-1));
    expect(facts.callCount()).toBe(1);
  });

  it('keeps a sticky directory error current through the first replacement derivation until it succeeds', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));

    const directoryError = new Error('read failed');
    source.emit('/A', { status: 'error', error: directoryError });
    expect(states.at(-1)).toEqual({ status: 'error', error: directoryError });

    // Directory recovers with a replacement ready snapshot: a fresh derivation starts, but the
    // sticky error must still be the published repository state while it is pending.
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    expect(facts.callCount()).toBe(1);
    expect(states.at(-1)).toEqual({ status: 'error', error: directoryError });

    // Do not resolve yet: repository state must remain the sticky error, not `loading`,
    // `refreshing`, or cleared.
    expect(states.at(-1)).toEqual({ status: 'error', error: directoryError });

    const docId = documentId();
    facts.resolveNext({ documentIds: [docId], isInitialized: true });

    await vi.waitFor(() => {
      const last = states.at(-1);
      if (last?.status !== 'ready') throw new Error('not ready yet');
      expect(last.snapshot.documentIds).toEqual([docId]);
    });
  });

  it('lets a newer terminal directory error supersede the previous one; a stale replacement completion cannot overwrite it', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));

    const firstError = new Error('read failed');
    source.emit('/A', { status: 'error', error: firstError });
    expect(states.at(-1)).toEqual({ status: 'error', error: firstError });

    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    expect(facts.callCount()).toBe(1);
    expect(states.at(-1)).toEqual({ status: 'error', error: firstError });

    // A new terminal directory error arrives before the replacement derivation settles; it
    // becomes the current repository error.
    const secondError = new Error('second read failed');
    source.emit('/A', { status: 'error', error: secondError });
    expect(states.at(-1)).toEqual({ status: 'error', error: secondError });

    // The now-stale replacement derivation must not overwrite the newer error when it settles.
    facts.resolveNext({ documentIds: [], isInitialized: false });
    await Promise.resolve();
    await Promise.resolve();

    expect(states.at(-1)).toEqual({ status: 'error', error: secondError });
  });

  it('starts a fresh derivation for a newly accepted ready listing that is value-equal to the previously accepted listing', async () => {
    const source = createDirectorySource();
    const facts = createControllableFacts();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfsStub, source.directoryState$);

    const { states } = collectStates(repositoryState$({ path: '/A' }));
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    expect(facts.callCount()).toBe(1);

    const firstDocId = documentId();
    facts.resolveNext({ documentIds: [firstDocId], isInitialized: true });
    await vi.waitFor(() => {
      expect(states.at(-1)?.status).toBe('ready');
    });

    // A second, distinct `ready` event whose entries are structurally value-equal to the
    // previously accepted listing must still start a fresh derivation. Directory invalidation is
    // authoritative; value equality does not mean the repository candidate contents are
    // unchanged, since wrapper bytes may have changed behind the same names/stats.
    source.emit('/A', { status: 'ready', entries: entries('a.txt') });
    expect(facts.callCount()).toBe(2);
    expect(getRepositoryFactsMock).toHaveBeenLastCalledWith(vfsStub, '/A', entries('a.txt'));

    const secondDocId = documentId();
    facts.resolveNext({ documentIds: [secondDocId], isInitialized: true });

    await vi.waitFor(() => {
      const last = states.at(-1);
      if (last?.status !== 'ready') throw new Error('not ready yet');
      expect(last.snapshot.documentIds).toEqual([secondDocId]);
    });
  });
});
