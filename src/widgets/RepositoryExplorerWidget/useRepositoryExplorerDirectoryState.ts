import { useLocalSettings } from '@entity/localSettings';
import { useRepository } from '@entity/repository';
import { resolveSafeErrorMessage } from '@shared/lib/error';
import { computed, type Ref } from 'vue';
import { isNotNil } from 'es-toolkit';

/**
 * Reads directory entries and repository facts for Repository Explorer composition.
 * @param directoryPath - Absolute path of the opened folder.
 * @returns Explicit reactive values for repository facts, file visibility, loading, and safe errors.
 */
export const useRepositoryExplorerDirectoryState = (directoryPath: Ref<string>) => {
  const { settings } = useLocalSettings();

  const hideAutomergeFiles = computed(() => settings.value.showAutomergeFiles !== true);

  const {
    documentIds,
    isInitialized: isRepositoryInitialized,
    repositoryVisibleEntries,
    repositoryFactsError: repositoryError,
    repositoryVisibleEntriesError: directoryError,
    errorMessage: repositoryErrorMessage,
    isLoading: isRepositoryLoading,
  } = useRepository(
    directoryPath,
    computed(() => ({
      hideAutomergeFiles: hideAutomergeFiles.value,
    })),
  );

  const directoryErrorMessage = computed(() =>
    resolveSafeErrorMessage(directoryError.value, 'Could not read this folder'),
  );
  const recoveryErrors = computed(() =>
    [directoryError.value, repositoryError.value].filter(isNotNil),
  );

  const errorMessage = computed(() => directoryErrorMessage.value ?? repositoryErrorMessage.value);
  const isLoading = computed(
    () => isRepositoryLoading.value || !repositoryVisibleEntries.value || !documentIds.value,
  );
  const regularFileEntries = computed(() => repositoryVisibleEntries.value ?? []);

  return {
    directoryError: directoryError,
    directoryErrorMessage,
    documentIds,
    errorMessage,
    hideAutomergeFiles,
    isLoading,
    isRepositoryInitialized,
    regularFileEntries,
    recoveryErrors,
    repositoryError,
    repositoryErrorMessage,
  };
};
