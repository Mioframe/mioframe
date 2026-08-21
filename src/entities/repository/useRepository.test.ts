import { afterEach, describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { DomainError } from '@shared/lib/error';
import { FSNodeType, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import type { RepositorySnapshot, RepositoryState } from '@shared/service';
import { effectScope, ref } from 'vue';

const repositoryStateMock = vi.fn();
const createDocumentMock = vi.fn();
const deleteDocumentMock = vi.fn();
const useObservableQueryMock = vi.fn();

const createDocumentId = (): AMDocumentId => {
  const repo = new Repo();
  const handle = repo.create({});

  return handle.documentId;
};

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    repositories: {
      createDocument: createDocumentMock,
      deleteDocument: deleteDocumentMock,
      repositoryState: repositoryStateMock,
    },
  }),
}));

vi.mock('@shared/lib/useObservableQuery', () => ({
  useObservableQuery: (...args: unknown[]) => useObservableQueryMock(...args),
}));

const fileStat: FSNodeStat = {
  type: FSNodeType.File,
  size: 0,
  capabilities: { canDelete: true, canChangePath: true },
};

const mockQueryReturn = (
  data: RepositoryState | undefined,
  { error, isLoading = false }: { error?: unknown; isLoading?: boolean } = {},
) => {
  useObservableQueryMock.mockReturnValueOnce({
    data: ref(data),
    error: ref(error),
    isLoading: ref(isLoading),
    refetch: vi.fn(),
  });
};

const snapshotFixture = (documentIds: AMDocumentId[] = []): RepositorySnapshot => ({
  documentIds,
  isInitialized: true,
  entries: [
    { entry: ['notes.txt', fileStat], classification: 'regular' },
    { entry: ['storage.automerge', fileStat], classification: 'automergeStorageCandidate' },
  ],
});

const mountUseRepository = async (pathValue = '/repo') => {
  const { useRepository } = await import('./useRepository');
  const path = ref(pathValue);
  const scope = effectScope();
  let state!: ReturnType<typeof useRepository>;

  scope.run(() => {
    state = useRepository(path);
  });

  return { path, scope, state };
};

describe('useRepository', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses exactly one repositoryState query for the current path', async () => {
    mockQueryReturn({ status: 'loading' });

    const { scope } = await mountUseRepository('/repo/subfolder');

    expect(useObservableQueryMock).toHaveBeenCalledTimes(1);
    expect(useObservableQueryMock).toHaveBeenCalledWith(repositoryStateMock, expect.any(Object));
    expect(useObservableQueryMock.mock.calls[0]?.[1]?.value).toEqual({ path: '/repo/subfolder' });

    scope.stop();
  });

  it('is in initial loading before the first service state arrives', async () => {
    mockQueryReturn(undefined, { isLoading: true });

    const { scope, state } = await mountUseRepository();

    expect(state.isLoading.value).toBe(true);
    expect(state.documentIds.value).toBeUndefined();
    expect(state.isInitialized.value).toBe(false);
    expect(state.repositoryVisibleEntries.value).toBeUndefined();

    scope.stop();
  });

  it('maps RepositoryState.loading to loading', async () => {
    mockQueryReturn({ status: 'loading' });

    const { scope, state } = await mountUseRepository();

    expect(state.isLoading.value).toBe(true);

    scope.stop();
  });

  it('exposes snapshot content with isLoading=false on ready', async () => {
    const docId = createDocumentId();
    mockQueryReturn({ status: 'ready', snapshot: snapshotFixture([docId]) });

    const { scope, state } = await mountUseRepository();

    expect(state.isLoading.value).toBe(false);
    expect(state.documentIds.value).toEqual([docId]);
    expect(state.isInitialized.value).toBe(true);
    expect(state.repositoryVisibleEntries.value).toEqual([['notes.txt', fileStat]]);

    scope.stop();
  });

  it('exposes retained snapshot content with isLoading=false on refreshing, never flickering to a spinner', async () => {
    const docId = createDocumentId();
    mockQueryReturn({ status: 'refreshing', snapshot: snapshotFixture([docId]) });

    const { scope, state } = await mountUseRepository();

    expect(state.isLoading.value).toBe(false);
    expect(state.documentIds.value).toEqual([docId]);
    expect(state.repositoryVisibleEntries.value).toEqual([['notes.txt', fileStat]]);

    scope.stop();
  });

  it('surfaces the service-state error as the one effective repository error', async () => {
    mockQueryReturn({
      status: 'error',
      error: new DomainError('Repository is unavailable right now', {
        code: 'repositoryUnavailable',
      }),
    });

    const { scope, state } = await mountUseRepository();

    expect(state.isLoading.value).toBe(false);
    expect(state.errorMessage.value).toBe('Repository is unavailable right now');

    scope.stop();
  });

  it('falls back to a safe message for a non-domain service-state error', async () => {
    mockQueryReturn({
      status: 'error',
      error: new Error('/private/user/path/repo.ams is unreadable'),
    });

    const { scope, state } = await mountUseRepository();

    expect(state.errorMessage.value).toBe('Could not load the Mioframe documents in this folder');

    scope.stop();
  });

  it('overrides a cached service-state error with a genuine transport failure', async () => {
    const transportFailure = new Error('worker RPC timed out');
    mockQueryReturn(
      { status: 'error', error: new Error('stale service-state error') },
      { error: transportFailure },
    );

    const { scope, state } = await mountUseRepository();

    expect(state.error.value).toBe(transportFailure);

    scope.stop();
  });

  it('hides automerge storage candidates by default and shows them when hideAutomergeFiles is false', async () => {
    mockQueryReturn({ status: 'ready', snapshot: snapshotFixture() });
    const { useRepository } = await import('./useRepository');
    const path = ref('/repo');
    const scope = effectScope();
    let state!: ReturnType<typeof useRepository>;

    scope.run(() => {
      state = useRepository(path, ref({ hideAutomergeFiles: false }));
    });

    expect(state.repositoryVisibleEntries.value).toEqual([
      ['notes.txt', fileStat],
      ['storage.automerge', fileStat],
    ]);

    scope.stop();
  });

  it('reprojects the same retained snapshot synchronously when hideAutomergeFiles toggles on a mounted options ref, without creating a second repositoryState query', async () => {
    mockQueryReturn({ status: 'ready', snapshot: snapshotFixture() });

    const { useRepository } = await import('./useRepository');
    const path = ref('/repo');
    const options = ref<{ hideAutomergeFiles?: boolean }>({ hideAutomergeFiles: true });
    const scope = effectScope();
    let state!: ReturnType<typeof useRepository>;

    scope.run(() => {
      state = useRepository(path, options);
    });

    expect(state.repositoryVisibleEntries.value).toEqual([['notes.txt', fileStat]]);

    options.value = { hideAutomergeFiles: false };

    expect(state.repositoryVisibleEntries.value).toEqual([
      ['notes.txt', fileStat],
      ['storage.automerge', fileStat],
    ]);

    expect(useObservableQueryMock).toHaveBeenCalledTimes(1);
    expect(useObservableQueryMock.mock.calls[0]?.[1]?.value).toEqual({ path: '/repo' });

    scope.stop();
  });

  it('delegates repository mutations through the current folder path', async () => {
    mockQueryReturn({ status: 'ready', snapshot: snapshotFixture() });
    createDocumentMock.mockResolvedValue(undefined);
    deleteDocumentMock.mockResolvedValue(undefined);

    const { scope, state } = await mountUseRepository('/repo/subfolder');
    const initialValue = {
      body: [],
      name: 'Example document',
      type: 'document',
      version: 1,
    } satisfies CFRDocumentContent;
    const documentId = createDocumentId();

    await state.createDocument(initialValue);
    await state.deleteDocument(documentId);

    expect(createDocumentMock).toHaveBeenCalledWith('/repo/subfolder', initialValue);
    expect(deleteDocumentMock).toHaveBeenCalledWith('/repo/subfolder', documentId);

    scope.stop();
  });

  it('no longer exposes split errors or a manual refetch', async () => {
    mockQueryReturn({ status: 'ready', snapshot: snapshotFixture() });

    const { scope, state } = await mountUseRepository();

    expect('repositoryFactsError' in state).toBe(false);
    expect('repositoryVisibleEntriesError' in state).toBe(false);
    expect('refetch' in state).toBe(false);

    scope.stop();
  });
});
