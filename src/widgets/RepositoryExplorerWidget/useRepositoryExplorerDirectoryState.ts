import { useDirectory } from '@entity/directory';
import { useLocalSettings } from '@entity/localSettings';
import {
  getMioframeSpaceDirectoryState,
  getRegularDirectoryEntries,
  hasMioframeMarkerFile,
} from '@entity/mioframeSpaceDirectory';
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

  const errorMessage = computed(() => directoryErrorMessage.value ?? repositoryErrorMessage.value);
  const isLoading = computed(
    () =>
      isDirectoryLoading.value ||
      isRepositoryLoading.value ||
      !directoryEntries.value ||
      !documentIds.value,
  );
  const mioframeMarkerFile = computed(() =>
    directoryEntries.value ? hasMioframeMarkerFile(directoryEntries.value) : false,
  );
  const regularFileEntries = computed(() =>
    directoryEntries.value
      ? getRegularDirectoryEntries({
          directoryEntries: directoryEntries.value,
          hideAutomergeFiles: hideAutomergeFiles.value,
        })
      : [],
  );
  const mioframeSpaceState = computed(() =>
    getMioframeSpaceDirectoryState({
      hasMarkerFile: mioframeMarkerFile.value,
      documentIds: documentIds.value ?? [],
    }),
  );

  return {
    directoryError,
    directoryErrorMessage,
    documentIds,
    errorMessage,
    hideAutomergeFiles,
    isLoading,
    hasMioframeMarkerFile: mioframeMarkerFile,
    mioframeSpaceState,
    regularFileEntries,
    repositoryError,
    repositoryErrorMessage,
  };
};
