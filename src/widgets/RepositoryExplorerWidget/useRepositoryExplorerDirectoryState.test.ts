import { afterEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import { effectScope, ref } from 'vue';

const useRepositoryMock = vi.fn();
const settingsRef = ref<{ showAutomergeFiles?: boolean | undefined }>({
  showAutomergeFiles: false,
});

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
    useRepositoryMock.mockReturnValue({
      documentIds: ref(['doc-1']),
      isInitialized: ref(true),
      repositoryVisibleEntries: ref([
        ['Document 1.mio', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ['notes.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
      ]),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(useRepositoryMock.mock.calls[0]?.[0]?.value).toBe('/repo');
    expect(state.documentIds.value).toEqual(['doc-1']);
    expect(state.isRepositoryInitialized.value).toBe(true);
    expect(state.regularFileEntries.value.map(([name]) => name)).toEqual([
      'Document 1.mio',
      'notes.txt',
    ]);
    expect(useRepositoryMock.mock.calls[0]?.[1]?.value).toEqual({
      hideAutomergeFiles: true,
    });

    scope.stop();
  });

  it('shows the safe repository fallback message when the repository entity reports an unsafe error', async () => {
    useRepositoryMock.mockReturnValue({
      documentIds: ref(undefined),
      isInitialized: ref(false),
      repositoryVisibleEntries: ref(undefined),
      error: ref(new Error('/private/repository path leaked')),
      errorMessage: ref('Could not load the Mioframe documents in this folder'),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.errorMessage.value).toBe('Could not load the Mioframe documents in this folder');

    scope.stop();
  });

  it('exposes the one effective repository error as the single recovery error candidate', async () => {
    const repositoryError = new DomainError('Repository is unavailable', {
      code: 'repositoryUnavailable',
    });

    useRepositoryMock.mockReturnValue({
      documentIds: ref(undefined),
      isInitialized: ref(false),
      repositoryVisibleEntries: ref(undefined),
      error: ref(repositoryError),
      errorMessage: ref('Repository is unavailable'),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.repositoryError.value).toBe(repositoryError);
    expect(state.errorMessage.value).toBe('Repository is unavailable');
    expect(state.recoveryErrors.value).toEqual([repositoryError]);

    scope.stop();
  });

  it('reflects the repository entity isLoading directly, without inferring loading from missing payloads', async () => {
    useRepositoryMock.mockReturnValue({
      documentIds: ref(undefined),
      isInitialized: ref(false),
      repositoryVisibleEntries: ref(undefined),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(true),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.isLoading.value).toBe(true);

    scope.stop();
  });

  it('is not loading once the repository entity reports ready, even with empty entries/ids', async () => {
    useRepositoryMock.mockReturnValue({
      documentIds: ref([]),
      isInitialized: ref(false),
      repositoryVisibleEntries: ref([]),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.isLoading.value).toBe(false);

    scope.stop();
  });

  it('keeps provider access errors available for higher-level recovery flows', async () => {
    const accessError = new WebFileSystemAccessRequiredError({
      spaceName: 'Work',
      mode: 'readwrite',
    });

    useRepositoryMock.mockReturnValue({
      documentIds: ref(undefined),
      isInitialized: ref(false),
      repositoryVisibleEntries: ref(undefined),
      error: ref(accessError),
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.recoveryErrors.value).toEqual([accessError]);

    scope.stop();
  });

  it('tracks whether Automerge files should stay hidden from local settings', async () => {
    useRepositoryMock.mockReturnValue({
      documentIds: ref([]),
      isInitialized: ref(false),
      repositoryVisibleEntries: ref([]),
      error: ref(undefined),
      errorMessage: ref(undefined),
      isLoading: ref(false),
    });

    settingsRef.value = { showAutomergeFiles: true };
    const { scope, state } = await mountUseRepositoryExplorerDirectoryState();

    expect(state.hideAutomergeFiles.value).toBe(false);
    expect(useRepositoryMock.mock.calls[0]?.[1]?.value).toEqual({
      hideAutomergeFiles: false,
    });

    scope.stop();
  });

  it('uses directory entries already filtered by the service-owned repository visibility rules', async () => {
    useRepositoryMock.mockReturnValue({
      documentIds: ref([]),
      isInitialized: ref(true),
      repositoryVisibleEntries: ref([
        ['notes.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
      ]),
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
