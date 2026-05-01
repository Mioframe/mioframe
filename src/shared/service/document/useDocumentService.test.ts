import { generateAutomergeUrl, parseAutomergeUrl } from '@automerge/automerge-repo';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { BehaviorSubject, firstValueFrom, skip, take } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockDocHandle = {
  addListener: ReturnType<typeof vi.fn>;
  change: ReturnType<typeof vi.fn>;
  doc: ReturnType<typeof vi.fn>;
  emitChange: (doc: object) => void;
  emitDelete: () => void;
  removeListener: ReturnType<typeof vi.fn>;
};

type MockRepo = {
  find: (...args: unknown[]) => Promise<unknown>;
};

const documentIdListByPath = vi.hoisted(() => new Map<string, BehaviorSubject<Error | string[]>>());
const repoByPath = vi.hoisted(() => new Map<string, BehaviorSubject<any>>());

const createMockDocHandle = (initialDoc: CFRDocumentContent): MockDocHandle => {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();

  return {
    doc: vi.fn(() => initialDoc),
    addListener: vi.fn((event: string, listener: (payload?: unknown) => void) => {
      const current = listeners.get(event) ?? new Set();
      current.add(listener);
      listeners.set(event, current);
    }),
    removeListener: vi.fn((event: string, listener: (payload?: unknown) => void) => {
      listeners.get(event)?.delete(listener);
    }),
    change: vi.fn((callback: (doc: CFRDocumentContent) => void) => {
      try {
        callback(initialDoc);
      } catch {
        // The service under test rejects the outer promise and intentionally rethrows.
        // The mock swallows that rethrow so the test can assert on the promise result.
      }
    }),
    emitChange: (doc: object) => {
      listeners.get('change')?.forEach((listener) => {
        listener({ doc });
      });
    },
    emitDelete: () => {
      listeners.get('delete')?.forEach((listener) => {
        listener();
      });
    },
  };
};

const createDocument = (): CFRDocumentContent => ({
  body: [],
  name: 'Catalog',
  type: 'document',
  version: 1,
});

vi.mock('../repositories', () => ({
  useRepositoriesService: () => ({
    getDocumentIdList$: ({ path }: { path: string }) => {
      const subject = documentIdListByPath.get(path);

      if (!subject) {
        throw new Error(`Missing mocked documentIdList$ for "${path}"`);
      }

      return subject.asObservable();
    },
    getRepo$: (path: string) => {
      const subject = repoByPath.get(path);

      if (!subject) {
        throw new Error(`Missing mocked repo for "${path}"`);
      }

      return subject.asObservable();
    },
  }),
}));

describe('useDocumentService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    documentIdListByPath.clear();
    repoByPath.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps documentDescription subscription alive across error-as-value emissions', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const documentIdList$ = new BehaviorSubject<Error | string[]>(new Error('directory failed'));
    const handle = createMockDocHandle(createDocument());
    const repo = {
      find: vi.fn().mockResolvedValue(handle),
    } satisfies MockRepo;

    documentIdListByPath.set(path, documentIdList$);
    repoByPath.set(path, new BehaviorSubject(repo));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();
    const next = vi.fn();
    const error = vi.fn();
    const complete = vi.fn();

    const subscription = service.documentDescription.subscribe({
      query: { documentId, path },
      next,
      error,
      complete,
    });

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledTimes(1);
    });
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect((next.mock.calls[0]?.[0] as Error).message).toBe('directory failed');
    expect(error).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();

    documentIdList$.next([documentId]);
    await vi.advanceTimersByTimeAsync(100);
    await vi.waitFor(() => {
      expect(repo.find).toHaveBeenCalledWith(documentId);
    });

    expect(next).toHaveBeenLastCalledWith({
      name: 'Catalog',
      type: 'document',
      version: 1,
    });
    expect(error).not.toHaveBeenCalled();

    (await subscription)();
  });

  it('emits undefined when requested document id is missing from repository list', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const repo = {
      find: vi.fn(),
    } satisfies MockRepo;

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([]));
    repoByPath.set(path, new BehaviorSubject(repo));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();

    await expect(service.documentDescription.fetch({ documentId, path })).resolves.toBeUndefined();
    expect(repo.find).not.toHaveBeenCalled();
  });

  it('emits undefined for missing documentId so callers can leave loading state', async () => {
    const path = '/repo';
    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([]));
    repoByPath.set(path, new BehaviorSubject({ find: vi.fn() }));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();

    await expect(
      firstValueFrom(
        service.cfrDocumentState$({ documentId: undefined, path }).pipe(skip(0), take(1)),
      ),
    ).resolves.toBeUndefined();
  });

  it('emits undefined when repo.find rejects for an existing document id', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const repo = {
      find: vi.fn().mockRejectedValue(new Error('missing handle')),
    } satisfies MockRepo;

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([documentId]));
    repoByPath.set(path, new BehaviorSubject(repo));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();

    const fetchPromise = service.cfrDocumentState.fetch({ documentId, path });
    await vi.advanceTimersByTimeAsync(100);

    await expect(fetchPromise).resolves.toBeUndefined();
  });

  it('streams handle changes, emits delete as undefined, and unsubscribes listeners', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const handle = createMockDocHandle(createDocument());
    const repo = {
      find: vi.fn().mockResolvedValue(handle),
    } satisfies MockRepo;

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([documentId]));
    repoByPath.set(path, new BehaviorSubject(repo));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();
    const next = vi.fn();

    const unsubscribe = await service.cfrDocumentState.subscribe({
      query: { documentId, path },
      next,
    });

    await vi.advanceTimersByTimeAsync(100);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(createDocument());
    });

    const changedDocument = {
      ...createDocument(),
      name: 'Updated catalog',
    };

    handle.emitChange(changedDocument);
    await vi.waitFor(() => {
      expect(next).toHaveBeenLastCalledWith(changedDocument);
    });

    handle.emitDelete();
    await vi.waitFor(() => {
      expect(next).toHaveBeenLastCalledWith(undefined);
    });

    unsubscribe();

    expect(handle.addListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(handle.addListener).toHaveBeenCalledWith('delete', expect.any(Function));
    expect(handle.removeListener).toHaveBeenCalledWith(
      'change',
      handle.addListener.mock.calls.find(([event]) => event === 'change')?.[1],
    );
    expect(handle.removeListener).toHaveBeenCalledWith(
      'delete',
      handle.addListener.mock.calls.find(([event]) => event === 'delete')?.[1],
    );
  });

  it('put updates the migrated document through deepPutJsonObject', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const document = createDocument();
    const handle = createMockDocHandle(document);
    const repo = {
      find: vi.fn().mockResolvedValue(handle),
    } satisfies MockRepo;

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([documentId]));
    repoByPath.set(path, new BehaviorSubject(repo));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();
    const nextContent = {
      body: [],
      name: 'Renamed',
      type: 'document',
      version: 1,
    } satisfies CFRDocumentContent;

    const putPromise = service.put(path, documentId, nextContent);
    await vi.advanceTimersByTimeAsync(100);
    await putPromise;

    expect(handle.change).toHaveBeenCalledTimes(1);
    expect(document.name).toBe('Renamed');
  });

  it('patch trims string fields through deepPatchJsonObject', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const document = createDocument();
    const handle = createMockDocHandle(document);
    const repo = {
      find: vi.fn().mockResolvedValue(handle),
    } satisfies MockRepo;

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([documentId]));
    repoByPath.set(path, new BehaviorSubject(repo));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();

    const patchPromise = service.patch(path, documentId, { name: '  Trimmed  ' });
    await vi.advanceTimersByTimeAsync(100);
    await patchPromise;

    expect(handle.change).toHaveBeenCalledTimes(1);
    expect(document.name).toBe('Trimmed');
  });

  it('change applies callback and resolves once mutation succeeds', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const document = createDocument();
    const handle = createMockDocHandle(document);
    const repo = {
      find: vi.fn().mockResolvedValue(handle),
    } satisfies MockRepo;

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([documentId]));
    repoByPath.set(path, new BehaviorSubject(repo));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();
    const callback = vi.fn((doc: CFRDocumentContent) => {
      doc.name = 'Changed';
    });

    const changePromise = service.change(path, documentId, callback);
    await vi.advanceTimersByTimeAsync(100);
    await expect(changePromise).resolves.toBeUndefined();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(document.name).toBe('Changed');
  });

  it('put, patch, and change rethrow Error values from the handle stream', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;
    const repoError = new Error('repo failed');

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>(repoError));
    repoByPath.set(path, new BehaviorSubject({ find: vi.fn() }));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();

    await expect(service.put(path, documentId, createDocument())).rejects.toThrow('repo failed');
    await expect(service.patch(path, documentId, { name: 'Next' })).rejects.toThrow('repo failed');
    await expect(service.change(path, documentId, vi.fn())).rejects.toThrow('repo failed');
  });

  it('put, patch, and change throw DomainError when the document does not exist', async () => {
    const path = '/repo';
    const documentId = parseAutomergeUrl(generateAutomergeUrl()).documentId;

    documentIdListByPath.set(path, new BehaviorSubject<Error | string[]>([]));
    repoByPath.set(path, new BehaviorSubject({ find: vi.fn() }));

    const { useDocumentService } = await import('./useDocumentService');
    const service = useDocumentService();

    await expect(service.put(path, documentId, createDocument())).rejects.toMatchObject({
      __isDomainError: true,
    });
    await expect(service.patch(path, documentId, { name: 'Next' })).rejects.toMatchObject({
      __isDomainError: true,
    });
    await expect(service.change(path, documentId, vi.fn())).rejects.toMatchObject({
      __isDomainError: true,
    });
  });
});
