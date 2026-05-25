import { useDirectory } from '@entity/directory';
import { useLocalSettings } from '@entity/localSettings';
import { deriveMioframeSpaceDirectoryViewState } from '@entity/mioframeSpaceDirectory';
import { useRepository } from '@entity/repository';
import { resolveSafeErrorMessage } from '@shared/lib/error';
import { computed, type Ref } from 'vue';

/**
 * Reads repository explorer directory state and derives the split Mioframe documents/files view.
 * @param directoryPath - Absolute path of the opened folder.
 * @returns Safe directory and repository errors plus a derived explorer view state.
 */
export const useRepositoryExplorerDirectoryState = (directoryPath: Ref<string>) => {
  const { settings } = useLocalSettings();

  const hideAutomergeFiles = computed(() => settings.value.showAutomergeFiles !== true);

  const {
    data: directoryEntries,
    error: directoryError,
    isLoading: isDirectoryLoading,
  } = useDirectory(
    directoryPath,
    computed(() => ({ hideAutomergeFiles: hideAutomergeFiles.value })),
  );

  const {
    state: documentIds,
    error: repositoryError,
    errorMessage: repositoryErrorMessage,
    isLoading: isRepositoryLoading,
  } = useRepository(directoryPath);

  const directoryErrorMessage = computed(() =>
    resolveSafeErrorMessage(directoryError.value, 'Could not read this folder'),
  );

  const viewState = computed(() =>
    deriveMioframeSpaceDirectoryViewState({
      directoryEntries: directoryEntries.value,
      directoryErrorMessage: directoryErrorMessage.value,
      documentIds: documentIds.value,
      repositoryErrorMessage: repositoryErrorMessage.value,
      isDirectoryLoading: isDirectoryLoading.value,
      isRepositoryLoading: isRepositoryLoading.value,
      hideAutomergeFiles: hideAutomergeFiles.value,
    }),
  );

  return {
    directoryError,
    hideAutomergeFiles,
    repositoryError,
    viewState,
  };
};
