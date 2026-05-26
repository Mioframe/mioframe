import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { resolveSafeErrorMessage } from '@shared/lib/error';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import type { RepositoryDirectoryEntry } from '@shared/service/repositories';
import { computed, type Ref } from 'vue';

/** Repository-owned visibility options for folder reads that should respect repository storage rules. */
export type UseRepositoryOptions = {
  /** Whether Automerge storage files should stay hidden from repository-aware visible entries. */
  hideAutomergeFiles?: boolean | undefined;
};

/**
 * Reads repository facts for a folder and exposes safe repository mutations.
 * @param path - Absolute folder path whose repository data should be observed.
 * @param options - Repository-owned directory visibility options for repository explorer style reads.
 * @returns Repository facts, loading and error state, and create/delete actions.
 */
export const useRepository = (
  path: Ref<string>,
  options?: Ref<UseRepositoryOptions | undefined>,
) => {
  const {
    repositories: { createDocument, deleteDocument, repositoryFacts, repositoryVisibleEntries },
  } = useMainServiceClient();

  const {
    data: facts,
    refetch,
    error,
    isLoading,
  } = useObservableQuery(
    repositoryFacts,
    computed(() => ({
      path: path.value,
    })),
  );
  const {
    data: visibleEntries,
    error: visibleEntriesError,
    isLoading: isVisibleEntriesLoading,
  } = useObservableQuery(
    repositoryVisibleEntries,
    computed(() => ({
      hideAutomergeFiles: options?.value?.hideAutomergeFiles,
      path: path.value,
    })),
  );

  const documentIds = computed(() => facts.value?.documentIds);
  const isInitialized = computed(() => facts.value?.isInitialized ?? false);
  const repositoryVisibleEntriesValue = computed<readonly RepositoryDirectoryEntry[] | undefined>(
    () => visibleEntries.value,
  );
  const combinedError = computed(() => error.value ?? visibleEntriesError.value ?? undefined);

  const errorMessage = computed(() =>
    resolveSafeErrorMessage(
      combinedError.value,
      'Could not load the Mioframe documents in this folder',
    ),
  );

  return {
    documentIds,
    isInitialized,
    repositoryVisibleEntries: repositoryVisibleEntriesValue,
    repositoryFactsError: error,
    repositoryVisibleEntriesError: visibleEntriesError,
    refetch,
    error: combinedError,
    errorMessage,
    isLoading: computed(() => isLoading.value || isVisibleEntriesLoading.value),

    createDocument: (initialValue: CFRDocumentContent) => createDocument(path.value, initialValue),
    deleteDocument: (id: AMDocumentId) => deleteDocument(path.value, id),
  };
};
