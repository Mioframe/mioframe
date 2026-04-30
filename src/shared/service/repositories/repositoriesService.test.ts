import {
  generateAutomergeUrl,
  parseAutomergeUrl,
  type RepoConfig,
} from '@automerge/automerge-repo';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.resetModules();
    directoryContentByPath.clear();
    repoInstances.clear();
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
});
