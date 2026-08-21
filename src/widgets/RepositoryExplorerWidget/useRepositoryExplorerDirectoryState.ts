import { useLocalSettings } from '@entity/localSettings';
import { useRepository } from '@entity/repository';
import { computed, type Ref } from 'vue';
import { isNotNil } from 'es-toolkit';

/**
 * Reads directory entries and repository facts for Repository Explorer composition.
 *
 * Uses the repository entity's one effective lifecycle/error: `isLoading` and `errorMessage`
 * already account for `loading`/`ready`/`refreshing`/`error`, so this composable adds no further
 * loading inference from missing payloads.
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
    error: repositoryError,
    errorMessage,
    isLoading,
  } = useRepository(
    directoryPath,
    computed(() => ({
      hideAutomergeFiles: hideAutomergeFiles.value,
    })),
  );

  const recoveryErrors = computed(() => [repositoryError.value].filter(isNotNil));
  const regularFileEntries = computed(() => repositoryVisibleEntries.value ?? []);

  return {
    documentIds,
    errorMessage,
    hideAutomergeFiles,
    isLoading,
    isRepositoryInitialized,
    regularFileEntries,
    recoveryErrors,
    repositoryError,
  };
};
