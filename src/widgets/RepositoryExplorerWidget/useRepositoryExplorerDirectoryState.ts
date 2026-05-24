import { useDirectory } from '@entity/directory/useDirectory';
import { useLocalSettings } from '@entity/localSettings/useLocalSettings';
import { deriveMioframeSpaceDirectoryViewState } from '@entity/mioframeSpaceDirectory/deriveMioframeSpaceDirectoryViewState';
import { resolveSafeErrorMessage } from '@shared/lib/error';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { computed, type Ref } from 'vue';

/**
 * Reads repository explorer directory state and derives the split Mioframe documents/files view.
 * @param directoryPath - Absolute path of the opened folder.
 * @returns Safe directory and repository errors plus a derived explorer view state.
 */
export const useRepositoryExplorerDirectoryState = (directoryPath: Ref<string>) => {
  const { settings } = useLocalSettings();
  const {
    repositories: { documentIdList },
  } = useMainServiceClient();

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
    data: documentIds,
    error: repositoryError,
    isLoading: isRepositoryLoading,
  } = useObservableQuery(
    documentIdList,
    computed(() => ({
      path: directoryPath.value,
    })),
  );

  const directoryErrorMessage = computed(() =>
    resolveSafeErrorMessage(directoryError.value, 'Could not read this folder'),
  );
  const repositoryErrorMessage = computed(() =>
    resolveSafeErrorMessage(
      repositoryError.value,
      'Could not load the Mioframe documents in this folder',
    ),
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
    repositoryError,
    viewState,
  };
};
