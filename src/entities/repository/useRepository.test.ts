import { afterEach, describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { DomainError } from '@shared/lib/error';
import { effectScope, ref } from 'vue';

const documentIdListMock = vi.fn();
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
      documentIdList: documentIdListMock,
    },
  }),
}));

vi.mock('@shared/lib/useObservableQuery', () => ({
  useObservableQuery: (...args: unknown[]) => useObservableQueryMock(...args),
}));

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

  it('exposes a safe fallback message for non-domain repository errors', async () => {
    useObservableQueryMock.mockReturnValue({
      data: ref(undefined),
      error: ref(new Error('/private/user/path/repo.ams is unreadable')),
      isLoading: ref(false),
      refetch: vi.fn(),
    });

    const { scope, state } = await mountUseRepository();

    expect(state.errorMessage.value).toBe('Could not load the Mioframe documents in this folder');

    scope.stop();
  });

  it('preserves the domain error message for user-facing repository failures', async () => {
    useObservableQueryMock.mockReturnValue({
      data: ref(undefined),
      error: ref(
        new DomainError('Repository is unavailable right now', {
          code: 'repositoryUnavailable',
        }),
      ),
      isLoading: ref(false),
      refetch: vi.fn(),
    });

    const { scope, state } = await mountUseRepository();

    expect(state.errorMessage.value).toBe('Repository is unavailable right now');

    scope.stop();
  });

  it('queries repository document ids for the current path', async () => {
    useObservableQueryMock.mockReturnValue({
      data: ref(['doc-1']),
      error: ref(undefined),
      isLoading: ref(false),
      refetch: vi.fn(),
    });

    const { scope, state } = await mountUseRepository('/repo/subfolder');
    expect(useObservableQueryMock).toHaveBeenCalledWith(documentIdListMock, expect.any(Object));
    expect(useObservableQueryMock.mock.calls[0]?.[1]?.value).toEqual({ path: '/repo/subfolder' });
    expect(state.state.value).toEqual(['doc-1']);

    scope.stop();
  });

  it('delegates repository mutations through the current folder path', async () => {
    useObservableQueryMock.mockReturnValue({
      data: ref(['doc-1']),
      error: ref(undefined),
      isLoading: ref(false),
      refetch: vi.fn(),
    });
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
});
