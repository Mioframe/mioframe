import {
  generateAutomergeUrl,
  parseAutomergeUrl,
  type RepoConfig,
} from '@automerge/automerge-repo';
import { BehaviorSubject, firstValueFrom, Subscription } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AMDocumentId } from '@shared/lib/automerge';
import { partialKeyToFileName } from '@shared/lib/automergeAdapter';
import { FSNodeType, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';

type MockRepoInstance = {
  create: ReturnType<typeof vi.fn<(initialValue: CFRDocumentContent) => { documentId: string }>>;
  delete: ReturnType<typeof vi.fn>;
};

const directoryContentByPath = vi.hoisted(
  () => new Map<string, BehaviorSubject<[string, FSNodeStat][] | Error>>(),
);
const repoInstances = vi.hoisted(() => new Map<string, MockRepoInstance[]>());
const vfsReadDirectory = vi.hoisted(() =>
  vi.fn((path: string) => {
    const subject = directoryContentByPath.get(path);

    if (!subject) {
      throw new Error(`Missing mocked directory content for "${path}"`);
    }

    const currentValue = subject.getValue();

    if (currentValue instanceof Error) {
      throw currentValue;
    }

    return currentValue;
  }),
);
const vfsDelete = vi.hoisted(() =>
  vi.fn((filePath: string) => {
    const slashIndex = filePath.lastIndexOf('/');
    const directoryPath = slashIndex > 0 ? filePath.slice(0, slashIndex) : '/';
    const fileName = filePath.slice(slashIndex + 1);
    const subject = directoryContentByPath.get(directoryPath);

    if (!subject) {
      throw new Error(`Missing mocked directory content for "${directoryPath}"`);
    }

    const currentValue = subject.getValue();

    if (currentValue instanceof Error) {
      throw currentValue;
    }

    subject.next(currentValue.filter(([name]) => name !== fileName));
  }),
);

const createDirectoryContentSubject = (path: string, initialValue: [string, FSNodeStat][] = []) => {
  const subject = new BehaviorSubject<[string, FSNodeStat][] | Error>(initialValue);
  directoryContentByPath.set(path, subject);
  return subject;
};

const getDocumentFileName = (documentId: AMDocumentId) => {
  const fileName = partialKeyToFileName([documentId]);

  if (!fileName) {
    throw new Error(`Failed to create file name for document "${documentId}"`);
  }

  return fileName;
};

const getDocumentPath = (directoryPath: string, fileName: string) => `${directoryPath}/${fileName}`;
const getStorageFileName = (...key: Parameters<typeof partialKeyToFileName>[0]) => {
  const fileName = partialKeyToFileName(key);

  if (!fileName) {
    throw new Error(`Failed to create storage file name for key "${key.join('/')}"`);
  }

  return fileName;
};

const fileStat = {
  type: FSNodeType.File,
  size: 1,
  capabilities: {
    canDelete: true,
    canChangePath: true,
  },
} satisfies FSNodeStat;

vi.mock('../fileSystem', () => ({
  useFileSystemService: () => ({
    directoryContent$: ({ path }: { path: string }) => {
      const subject = directoryContentByPath.get(path);

      if (!subject) {
        throw new Error(`Missing mocked directory content for "${path}"`);
      }

      return subject.asObservable();
    },
    vfs: {
      kind: 'mock-vfs',
      readDirectory: vfsReadDirectory,
      delete: vfsDelete,
    },
  }),
}));

vi.mock('@shared/lib/automergeAdapter/createVFSAdapter', () => ({
  createVFSAdapter: (vfs: unknown, path: string) => ({ path, vfs }),
}));

vi.mock('@automerge/automerge-repo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@automerge/automerge-repo')>();
  class MockRepo {
    readonly create = vi.fn((initialValue: CFRDocumentContent) => {
      this.lastCreatedValue = initialValue;
      return {
        documentId: parseAutomergeUrl(generateAutomergeUrl()).documentId,
      };
    });

    readonly delete = vi.fn();
    lastCreatedValue?: CFRDocumentContent | undefined;

    constructor(readonly config: RepoConfig & { storage?: { path?: string | undefined } }) {
      const path = config.storage?.path ?? '__unknown__';
      const current = repoInstances.get(path) ?? [];
      current.push(this);
      repoInstances.set(path, current);
    }
  }

  return {
    ...actual,
    Repo: MockRepo,
  };
});

describe('useRepositoriesService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    directoryContentByPath.clear();
    repoInstances.clear();
    vfsReadDirectory.mockClear();
    vfsDelete.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reuses one repo instance for createDocument and later getRepo$ in same directory', async () => {
    const path = '/repo';
    const initialValue = {
      body: [],
      name: 'First document',
      type: 'document',
      version: 1,
    } satisfies CFRDocumentContent;
    const directoryContentSubject = createDirectoryContentSubject(path);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    const createdDocumentId = await service.createDocument(path, initialValue);
    const createdRepo = repoInstances.get(path)?.[0];

    expect(createdRepo).toBeDefined();
    expect(repoInstances.get(path)).toHaveLength(1);
    expect(createdRepo?.create).toHaveBeenCalledWith(initialValue);

    const documentFileName = getDocumentFileName(createdDocumentId);

    directoryContentSubject.next([[documentFileName, fileStat]]);

    const openedRepo = await firstValueFrom(service.getRepo$(path));

    expect(openedRepo).toBe(createdRepo);
    expect(repoInstances.get(path)).toHaveLength(1);
  });

  it('does not create separate repo instances when first document is created in empty directory', async () => {
    const path = '/empty-repo';
    const initialValue = {
      body: [],
      name: 'Seed document',
      type: 'database',
      version: 1,
    } satisfies CFRDocumentContent;
    const directoryContentSubject = createDirectoryContentSubject(path);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    const createdDocumentId = await service.createDocument(path, initialValue);
    const documentFileName = getDocumentFileName(createdDocumentId);

    expect(repoInstances.get(path)).toHaveLength(1);

    directoryContentSubject.next([[documentFileName, fileStat]]);

    await firstValueFrom(service.getRepo$(path));
    const deletePromise = service.deleteDocument(path, createdDocumentId);
    await vi.runAllTimersAsync();
    await deletePromise;

    const [repo] = repoInstances.get(path) ?? [];

    expect(repoInstances.get(path)).toHaveLength(1);
    expect(repo?.delete).toHaveBeenCalledWith(createdDocumentId);
  });

  it('deleteDocument removes all automerge files for target document id', async () => {
    const path = '/repo';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const otherDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    createDirectoryContentSubject(path, [
      [getStorageFileName(targetDocumentId), fileStat],
      [getStorageFileName(targetDocumentId, 'snapshot', 'hash-a'), fileStat],
      [getStorageFileName(targetDocumentId, 'incremental', 'hash-b'), fileStat],
      [getStorageFileName(otherDocumentId, 'snapshot', 'hash-c'), fileStat],
      ['notes.txt', fileStat],
    ]);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    const deletePromise = service.deleteDocument(path, targetDocumentId);

    await vi.runAllTimersAsync();
    await deletePromise;

    expect(vfsDelete).toHaveBeenCalledTimes(3);
    expect(vfsDelete).toHaveBeenCalledWith(
      getDocumentPath(path, getStorageFileName(targetDocumentId)),
    );
    expect(vfsDelete).toHaveBeenCalledWith(
      getDocumentPath(path, getStorageFileName(targetDocumentId, 'snapshot', 'hash-a')),
    );
    expect(vfsDelete).toHaveBeenCalledWith(
      getDocumentPath(path, getStorageFileName(targetDocumentId, 'incremental', 'hash-b')),
    );
    expect(directoryContentByPath.get(path)?.getValue()).toEqual([
      [getStorageFileName(otherDocumentId, 'snapshot', 'hash-c'), fileStat],
      ['notes.txt', fileStat],
    ]);
  });

  it('deleteDocument does not remove files for other document ids', async () => {
    const path = '/repo';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const otherDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    createDirectoryContentSubject(path, [
      [getStorageFileName(targetDocumentId, 'snapshot', 'hash-a'), fileStat],
      [getStorageFileName(otherDocumentId), fileStat],
      [getStorageFileName(otherDocumentId, 'snapshot', 'hash-b'), fileStat],
    ]);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    const deletePromise = service.deleteDocument(path, targetDocumentId);

    await vi.runAllTimersAsync();
    await deletePromise;

    expect(directoryContentByPath.get(path)?.getValue()).toEqual([
      [getStorageFileName(otherDocumentId), fileStat],
      [getStorageFileName(otherDocumentId, 'snapshot', 'hash-b'), fileStat],
    ]);
  });

  it('deleteDocument does not remove plain file that starts with document id but is not an automerge file', async () => {
    const path = '/repo';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const lookalikeFileName = `${targetDocumentId}_notes.txt`;
    createDirectoryContentSubject(path, [
      [getStorageFileName(targetDocumentId, 'snapshot', 'hash-a'), fileStat],
      [lookalikeFileName, fileStat],
    ]);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    const deletePromise = service.deleteDocument(path, targetDocumentId);

    await vi.runAllTimersAsync();
    await deletePromise;

    expect(vfsDelete).toHaveBeenCalledTimes(1);
    expect(vfsDelete).toHaveBeenCalledWith(
      getDocumentPath(path, getStorageFileName(targetDocumentId, 'snapshot', 'hash-a')),
    );
    expect(vfsDelete).not.toHaveBeenCalledWith(getDocumentPath(path, lookalikeFileName));
    expect(directoryContentByPath.get(path)?.getValue()).toEqual([[lookalikeFileName, fileStat]]);
  });

  it('deleteDocument removes snapshot recreated right after repo.delete', async () => {
    const path = '/repo';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const initialSnapshotFile = getStorageFileName(targetDocumentId, 'snapshot', 'hash-a');
    const recreatedSnapshotFile = getStorageFileName(targetDocumentId, 'snapshot', 'hash-b');
    const directoryContentSubject = createDirectoryContentSubject(path, [
      [initialSnapshotFile, fileStat],
    ]);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    await firstValueFrom(service.getRepo$(path));
    const [repo] = repoInstances.get(path) ?? [];

    expect(repo).toBeDefined();

    repo?.delete.mockImplementation(() => {
      setTimeout(() => {
        const currentValue = directoryContentSubject.getValue();

        if (currentValue instanceof Error) {
          throw currentValue;
        }

        directoryContentSubject.next([...currentValue, [recreatedSnapshotFile, fileStat]]);
      }, 0);
    });

    const deletePromise = service.deleteDocument(path, targetDocumentId);

    await vi.runAllTimersAsync();
    await deletePromise;

    expect(vfsDelete).toHaveBeenCalledWith(getDocumentPath(path, initialSnapshotFile));
    expect(vfsDelete).toHaveBeenCalledWith(getDocumentPath(path, recreatedSnapshotFile));
    expect(directoryContentByPath.get(path)?.getValue()).toEqual([]);
  });

  it('deleteDocument removes storage file recreated after cleanup retry delay', async () => {
    const path = '/repo';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const delayedSnapshotFile = getStorageFileName(targetDocumentId, 'snapshot', 'hash-late');
    const directoryContentSubject = createDirectoryContentSubject(path, [
      [getStorageFileName(targetDocumentId, 'snapshot', 'hash-a'), fileStat],
    ]);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    await firstValueFrom(service.getRepo$(path));
    const [repo] = repoInstances.get(path) ?? [];

    repo?.delete.mockImplementation(() => {
      setTimeout(() => {
        const currentValue = directoryContentSubject.getValue();

        if (currentValue instanceof Error) {
          throw currentValue;
        }

        directoryContentSubject.next([...currentValue, [delayedSnapshotFile, fileStat]]);
      }, 60);
    });

    const deletePromise = service.deleteDocument(path, targetDocumentId);

    await vi.runAllTimersAsync();
    await deletePromise;

    expect(vfsDelete).toHaveBeenCalledWith(
      getDocumentPath(path, getStorageFileName(targetDocumentId, 'snapshot', 'hash-a')),
    );
    expect(vfsDelete).toHaveBeenCalledWith(getDocumentPath(path, delayedSnapshotFile));
    expect(directoryContentByPath.get(path)?.getValue()).toEqual([]);
  });

  it('deleteDocument resolves in empty directory without creating repo', async () => {
    const path = '/empty-dir';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    createDirectoryContentSubject(path, []);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    const deletePromise = service.deleteDocument(path, targetDocumentId);

    await vi.runAllTimersAsync();
    await expect(deletePromise).resolves.toBeUndefined();
    expect(repoInstances.get(path)).toBeUndefined();
    expect(vfsDelete).not.toHaveBeenCalled();
  });

  it('deleteDocument propagates filesystem errors without hanging', async () => {
    const path = '/fs-error';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    createDirectoryContentSubject(path, []);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const error = new Error('filesystem failed');

    directoryContentByPath.get(path)?.next(error);

    await vi.runAllTimersAsync();
    await expect(service.deleteDocument(path, targetDocumentId)).rejects.toThrow(
      'filesystem failed',
    );
    expect(repoInstances.get(path)).toBeUndefined();
  });

  it('getRepo$ keeps subscription alive after filesystem error and emits repo when documents appear', async () => {
    const path = '/repo-fs-error';
    const directoryContentSubject = createDirectoryContentSubject(path, []);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const error = new Error('directory content failed');
    const next = vi.fn();
    const complete = vi.fn();
    const errorHandler = vi.fn();

    const subscription = service.getRepo$(path).subscribe({
      next,
      complete,
      error: errorHandler,
    });

    directoryContentSubject.next(error);

    await vi.runAllTimersAsync();
    expect(repoInstances.get(path)).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(errorHandler).not.toHaveBeenCalled();

    directoryContentSubject.next([
      [getDocumentFileName(parseAutomergeUrl(generateAutomergeUrl()).documentId), fileStat],
    ]);

    await vi.runAllTimersAsync();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBe(repoInstances.get(path)?.[0]);
    expect(complete).not.toHaveBeenCalled();
    expect(errorHandler).not.toHaveBeenCalled();
    expect(repoInstances.get(path)).toHaveLength(1);

    subscription.unsubscribe();
  });

  it('deleteDocument does not remove storage files when target document is absent', async () => {
    const path = '/missing-doc';
    const otherDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const missingDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    createDirectoryContentSubject(path, [
      [getStorageFileName(otherDocumentId, 'snapshot', 'hash-a'), fileStat],
    ]);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    const deletePromise = service.deleteDocument(path, missingDocumentId);

    await vi.runAllTimersAsync();
    await expect(deletePromise).resolves.toBeUndefined();
    expect(repoInstances.get(path)).toBeUndefined();
    expect(vfsDelete).not.toHaveBeenCalled();
    expect(directoryContentByPath.get(path)?.getValue()).toEqual([
      [getStorageFileName(otherDocumentId, 'snapshot', 'hash-a'), fileStat],
    ]);
  });

  it('deleteDocument rejects when deleted document storage files remain after cleanup attempts', async () => {
    const path = '/cleanup-failure';
    const targetDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const targetSnapshotFile = getStorageFileName(targetDocumentId, 'snapshot', 'hash-a');
    const directoryContentSubject = createDirectoryContentSubject(path, [
      [targetSnapshotFile, fileStat],
    ]);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();

    await firstValueFrom(service.getRepo$(path));
    const [repo] = repoInstances.get(path) ?? [];

    vfsDelete.mockImplementation((filePath: string) => {
      const slashIndex = filePath.lastIndexOf('/');
      const directoryPath = slashIndex > 0 ? filePath.slice(0, slashIndex) : '/';
      const fileName = filePath.slice(slashIndex + 1);
      const subject = directoryContentByPath.get(directoryPath);

      if (!subject) {
        throw new Error(`Missing mocked directory content for "${directoryPath}"`);
      }

      const currentValue = subject.getValue();

      if (currentValue instanceof Error) {
        throw currentValue;
      }

      subject.next(currentValue.filter(([name]) => name !== fileName));
      subject.next([[targetSnapshotFile, fileStat]]);
    });

    const deletePromiseExpectation = expect(
      service.deleteDocument(path, targetDocumentId),
    ).rejects.toThrow('Failed to cleanup deleted document storage files');
    await vi.runAllTimersAsync();
    await deletePromiseExpectation;
    expect(repo?.delete).toHaveBeenCalledTimes(1);
    expect(repo?.delete).toHaveBeenCalledWith(targetDocumentId);
    expect(directoryContentSubject.getValue()).toEqual([[targetSnapshotFile, fileStat]]);
  });

  it('reuses same repo for initial=true and initial=false requests in same directory', async () => {
    const path = '/shared-repo';
    const directoryContentSubject = createDirectoryContentSubject(path);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const initialValue = {
      body: [],
      name: 'Shared repo',
      type: 'document',
      version: 1,
    } satisfies CFRDocumentContent;

    const createdDocumentId = await service.createDocument(path, initialValue);
    const createdRepo = repoInstances.get(path)?.[0];
    const documentFileName = getDocumentFileName(createdDocumentId);

    directoryContentSubject.next([[documentFileName, fileStat]]);

    const openedRepo = await firstValueFrom(service.getRepo$(path, false));

    expect(openedRepo).toBe(createdRepo);
    expect(repoInstances.get(path)).toHaveLength(1);
  });

  it('creates different repo instances for different directories', async () => {
    const firstPath = '/repo-a';
    const secondPath = '/repo-b';
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const initialValue = {
      body: [],
      name: 'Doc',
      type: 'document',
      version: 1,
    } satisfies CFRDocumentContent;

    createDirectoryContentSubject(firstPath);
    createDirectoryContentSubject(secondPath);

    await service.createDocument(firstPath, initialValue);
    await service.createDocument(secondPath, initialValue);

    expect(repoInstances.get(firstPath)).toHaveLength(1);
    expect(repoInstances.get(secondPath)).toHaveLength(1);
    expect(repoInstances.get(firstPath)?.[0]).not.toBe(repoInstances.get(secondPath)?.[0]);
  });

  it('removes repo from cache after last subscriber cleanup timeout and recreates it on next use', async () => {
    const path = '/cleanup-repo';
    createDirectoryContentSubject(path);
    const { REPO_IDLE_TIMEOUT_MS, useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const subscription: Subscription = service.getRepo$(path, true).subscribe();

    expect(repoInstances.get(path)).toHaveLength(1);
    const firstRepo = repoInstances.get(path)?.[0];

    subscription.unsubscribe();
    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS);

    const recreatedRepo = await firstValueFrom(service.getRepo$(path, true));

    expect(repoInstances.get(path)).toHaveLength(2);
    expect(recreatedRepo).not.toBe(firstRepo);
  });

  it('keeps repo alive across short gap after createDocument so first document flow still works', async () => {
    const path = '/first-doc-gap';
    const directoryContentSubject = createDirectoryContentSubject(path);
    const { REPO_IDLE_TIMEOUT_MS, useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const initialValue = {
      body: [],
      name: 'First document',
      type: 'document',
      version: 1,
    } satisfies CFRDocumentContent;

    const createdDocumentId = await service.createDocument(path, initialValue);
    const createdRepo = repoInstances.get(path)?.[0];
    const documentFileName = getDocumentFileName(createdDocumentId);

    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS - 1);
    directoryContentSubject.next([[documentFileName, fileStat]]);

    const openedRepo = await firstValueFrom(service.getRepo$(path));

    expect(openedRepo).toBe(createdRepo);
    expect(repoInstances.get(path)).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(repoInstances.get(path)).toHaveLength(1);
  });

  it('waits for first document when initial flag is false', async () => {
    const path = '/wait-for-doc';
    const directoryContentSubject = createDirectoryContentSubject(path);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const pendingRepoPromise = firstValueFrom(service.getRepo$(path));

    await Promise.resolve();

    expect(repoInstances.get(path)).toBeUndefined();

    directoryContentSubject.next([
      ['notes.txt', fileStat],
      [getDocumentFileName(parseAutomergeUrl(generateAutomergeUrl()).documentId), fileStat],
    ]);

    await expect(pendingRepoPromise).resolves.toBeDefined();
    expect(repoInstances.get(path)).toHaveLength(1);
  });

  it('returns errors from documentIdList and keeps only unique automerge ids', async () => {
    const path = '/document-id-list';
    const directoryContentSubject = createDirectoryContentSubject(path);
    const { useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const firstDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const firstFileName = getDocumentFileName(firstDocumentId);
    const secondDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;

    directoryContentSubject.next(new Error('directory failed'));
    await expect(firstValueFrom(service.getDocumentIdList$({ path }))).resolves.toBeInstanceOf(
      Error,
    );

    directoryContentSubject.next([
      [firstFileName, fileStat],
      [firstFileName, fileStat],
      ['plain.txt', fileStat],
      [getDocumentFileName(secondDocumentId), { ...fileStat, type: FSNodeType.Directory }],
    ]);

    await expect(firstValueFrom(service.getDocumentIdList$({ path }))).resolves.toEqual([
      firstDocumentId,
    ]);
  });

  it('cancels pending cleanup when same repo gets new subscriber before timeout', async () => {
    const path = '/cancel-cleanup';
    createDirectoryContentSubject(path);
    const { REPO_IDLE_TIMEOUT_MS, useRepositoriesService } = await import('./repositoriesService');
    const service = useRepositoriesService();
    const firstSubscription = service.getRepo$(path, true).subscribe();
    const firstRepo = repoInstances.get(path)?.[0];

    firstSubscription.unsubscribe();
    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS - 1);

    const secondSubscription = service.getRepo$(path, true).subscribe();

    await vi.advanceTimersByTimeAsync(1);

    expect(repoInstances.get(path)).toHaveLength(1);
    expect(repoInstances.get(path)?.[0]).toBe(firstRepo);

    secondSubscription.unsubscribe();
    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS);

    const recreatedRepo = await firstValueFrom(service.getRepo$(path, true));

    expect(repoInstances.get(path)).toHaveLength(2);
    expect(recreatedRepo).not.toBe(firstRepo);
  });
});
