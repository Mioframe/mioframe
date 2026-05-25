import { afterEach, describe, expect, it, vi } from 'vitest';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { DomainError } from '@shared/lib/error';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { effectScope, ref } from 'vue';

const useDirectoryMock = vi.fn();
const useRepositoryMock = vi.fn();
const settingsRef = ref<{ showAutomergeFiles?: boolean | undefined }>({
  showAutomergeFiles: false,
});

vi.mock('@entity/directory', () => ({
  useDirectory: (...args: unknown[]) => useDirectoryMock(...args),
}));

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings: settingsRef,
  }),
}));

vi.mock('@entity/repository', () => ({
  useRepository: (...args: unknown[]) => useRepositoryMock(...args),
}));

const mountUseRepositoryExplorerDirectoryState = async (directoryPath = '/repo') => {
  const { useRepositoryExplorerDirectoryState } =
    await import('./useRepositoryExplorerDirectoryState');
  const path = ref(directoryPath);
  const scope = effectScope();
  let state!: ReturnType<typeof useRepositoryExplorerDirectoryState>;

  scope.run(() => {
    state = useRepositoryExplorerDirectoryState(path);
  });

  return { path, scope, state };
};

describe('useRepositoryExplorerDirectoryState', () => {
  afterEach(() => {
    vi.clearAllMocks();
    settingsRef.value = { showAutomergeFiles: false };
  });

  it('derives ready state from repository document ids exposed by the repository entity', async () => {
    useDirectoryMock.mockReturnValue({
      data: ref([
        ['Document 1.mio', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ['notes.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
      ]),
      error: ref(undefined),
      isLoading: ref(false),
    });
    useRepositoryMock.mockReturnValue({
      state: ref(['doc-1']),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(useRepositoryMock).toHaveBeenCalledWith(expect.objectContaining({ value: '/repo' }));
    expect(state.documentIds.value).toEqual(['doc-1']);
    expect(state.hasMioframeMarkerFile.value).toBe(false);
    expect(state.mioframeSpaceState.value).toBe('mioframeSpaceWithDocuments');
    expect(state.regularFileEntries.value.map(([name]) => name)).toEqual([
      'Document 1.mio',
      'notes.txt',
    ]);
    expect(useDirectoryMock.mock.calls[0]?.[1]?.value).toEqual({ hideAutomergeFiles: true });

    scope.stop();
  });

  it('shows the safe repository fallback message when the repository entity reports an unsafe error', async () => {
    useDirectoryMock.mockReturnValue({
      data: ref([]),
      error: ref(undefined),
      isLoading: ref(false),
    });
    useRepositoryMock.mockReturnValue({
      state: ref(undefined),
      error: ref(new Error('/private/repository path leaked')),
      errorMessage: ref('Could not load the Mioframe documents in this folder'),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.repositoryErrorMessage.value).toBe(
      'Could not load the Mioframe documents in this folder',
    );
    expect(state.errorMessage.value).toBe('Could not load the Mioframe documents in this folder');

    scope.stop();
  });

  it('keeps directory errors ahead of repository errors', async () => {
    useDirectoryMock.mockReturnValue({
      data: ref(undefined),
      error: ref(new DomainError('Could not read this folder', { code: 'folderReadFailed' })),
      isLoading: ref(false),
    });
    useRepositoryMock.mockReturnValue({
      state: ref(undefined),
      error: ref(new DomainError('Repository is unavailable', { code: 'repositoryUnavailable' })),
      errorMessage: ref('Repository is unavailable'),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.directoryErrorMessage.value).toBe('Could not read this folder');
    expect(state.errorMessage.value).toBe('Could not read this folder');

    scope.stop();
  });

  it('stays loading until both directory and repository reads are ready', async () => {
    useDirectoryMock.mockReturnValue({
      data: ref([['notes.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }]]),
      error: ref(undefined),
      isLoading: ref(false),
    });
    useRepositoryMock.mockReturnValue({
      state: ref(undefined),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(true),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.isLoading.value).toBe(true);

    scope.stop();
  });

  it('tracks whether Automerge files should stay hidden from local settings', async () => {
    useDirectoryMock.mockReturnValue({
      data: ref([]),
      error: ref(undefined),
      isLoading: ref(false),
    });
    useRepositoryMock.mockReturnValue({
      state: ref([]),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    settingsRef.value = { showAutomergeFiles: true };
    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.hideAutomergeFiles.value).toBe(false);
    expect(useDirectoryMock.mock.calls[0]?.[1]?.value).toEqual({ hideAutomergeFiles: false });

    scope.stop();
  });

  it('filters regular file entries according to the current Automerge visibility setting', async () => {
    useDirectoryMock.mockReturnValue({
      data: ref([
        [
          storageAdapterMarkerFileName,
          { type: FSNodeType.File, capabilities: {}, description: 'marker' },
        ],
        [
          'test-doc-id.snapshot.automerge',
          { type: FSNodeType.File, capabilities: {}, description: 'doc' },
        ],
        ['notes.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
      ]),
      error: ref(undefined),
      isLoading: ref(false),
    });
    useRepositoryMock.mockReturnValue({
      state: ref([]),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    settingsRef.value = { showAutomergeFiles: false };
    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.regularFileEntries.value.map(([name]) => name)).toEqual(['notes.txt']);

    scope.stop();
  });
});
