import {
  generateAutomergeUrl,
  parseAutomergeUrl,
  type RepoConfig,
} from '@automerge/automerge-repo';
import { BehaviorSubject, firstValueFrom, Subscription } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { partialKeyToFileName } from '@shared/lib/automergeAdapter';
import { FSNodeType, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';

type MockRepoInstance = {
  create: ReturnType<typeof vi.fn<(initialValue: CFRDocumentContent) => { documentId: string }>>;
  delete: ReturnType<typeof vi.fn>;
  shutdown: ReturnType<typeof vi.fn<() => Promise<void>>>;
};

const directoryContentByPath = vi.hoisted(
  () => new Map<string, BehaviorSubject<[string, FSNodeStat][] | Error>>(),
);
const repoInstances = vi.hoisted(() => new Map<string, MockRepoInstance[]>());

const createDirectoryContentSubject = (path: string, initialValue: [string, FSNodeStat][] = []) => {
  const subject = new BehaviorSubject<[string, FSNodeStat][] | Error>(initialValue);
  directoryContentByPath.set(path, subject);
  return subject;
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
    vfs: { kind: 'mock-vfs' },
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
    readonly shutdown = vi.fn(async () => undefined);
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

    const documentFileName = partialKeyToFileName([createdDocumentId]);

    expect(documentFileName).toBeDefined();

    directoryContentSubject.next([[documentFileName ?? createdDocumentId, fileStat]]);

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
    const documentFileName = partialKeyToFileName([createdDocumentId]);

    expect(repoInstances.get(path)).toHaveLength(1);

    directoryContentSubject.next([[documentFileName ?? createdDocumentId, fileStat]]);

    await firstValueFrom(service.getRepo$(path));
    await service.deleteDocument(path, createdDocumentId);

    const [repo] = repoInstances.get(path) ?? [];

    expect(repoInstances.get(path)).toHaveLength(1);
    expect(repo?.delete).toHaveBeenCalledWith(createdDocumentId);
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
    const documentFileName = partialKeyToFileName([createdDocumentId]);

    directoryContentSubject.next([[documentFileName ?? createdDocumentId, fileStat]]);

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

    subscription.unsubscribe();
    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS);

    const firstRepo = repoInstances.get(path)?.[0];

    expect(firstRepo?.shutdown).toHaveBeenCalledTimes(1);

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
    const documentFileName = partialKeyToFileName([createdDocumentId]);

    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS - 1);
    directoryContentSubject.next([[documentFileName ?? createdDocumentId, fileStat]]);

    const openedRepo = await firstValueFrom(service.getRepo$(path));

    expect(openedRepo).toBe(createdRepo);
    expect(createdRepo?.shutdown).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(createdRepo?.shutdown).not.toHaveBeenCalled();
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
      [partialKeyToFileName([parseAutomergeUrl(generateAutomergeUrl()).documentId])!, fileStat],
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
    const firstFileName = partialKeyToFileName([firstDocumentId])!;
    const secondDocumentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;

    directoryContentSubject.next(new Error('directory failed'));
    await expect(firstValueFrom(service.getDocumentIdList$({ path }))).resolves.toBeInstanceOf(
      Error,
    );

    directoryContentSubject.next([
      [firstFileName, fileStat],
      [firstFileName, fileStat],
      ['plain.txt', fileStat],
      [partialKeyToFileName([secondDocumentId])!, { ...fileStat, type: FSNodeType.Directory }],
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

    firstSubscription.unsubscribe();
    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS - 1);

    const firstRepo = repoInstances.get(path)?.[0];
    const secondSubscription = service.getRepo$(path, true).subscribe();

    await vi.advanceTimersByTimeAsync(1);

    expect(firstRepo?.shutdown).not.toHaveBeenCalled();
    expect(repoInstances.get(path)).toHaveLength(1);

    secondSubscription.unsubscribe();
    await vi.advanceTimersByTimeAsync(REPO_IDLE_TIMEOUT_MS);

    expect(firstRepo?.shutdown).toHaveBeenCalledTimes(1);
  });
});
