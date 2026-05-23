import { useDirectory } from '@entity/directory/useDirectory';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { isUndefined } from 'es-toolkit';
import { computed, type Ref } from 'vue';
import { useMainServiceClient } from '@shared/service';
import { classifyMioframeSpaceDirectory } from './classifyMioframeSpaceDirectory';

/**
 * Reads the current folder and derives Mioframe-space presentation state for the explorer screen.
 * @param directoryPath - Absolute path of the opened folder.
 * @returns Reactive directory entries, document ids, loading/errors, and split-screen presentation state.
 */
export const useMioframeSpaceDirectory = (directoryPath: Ref<string>) => {
  const {
    repositories: { documentIdList },
  } = useMainServiceClient();

  const {
    data: directoryEntries,
    error: directoryError,
    errorMessage: directoryErrorMessage,
    isLoading: isDirectoryLoading,
  } = useDirectory(directoryPath);

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

  const repositoryErrorMessage = computed(() => {
    const error = repositoryError.value;

    if (isUndefined(error)) {
      return undefined;
    }

    return error instanceof Error ? error.message : 'Error reading repository';
  });

  const presentation = computed(() =>
    classifyMioframeSpaceDirectory({
      directoryEntries: directoryEntries.value ?? [],
      documentIds: documentIds.value ?? [],
    }),
  );

  return {
    directoryEntries,
    documentIds,
    presentation,
    directoryError,
    directoryErrorMessage,
    repositoryError,
    repositoryErrorMessage,
    isDirectoryLoading,
    isRepositoryLoading,
  };
};
