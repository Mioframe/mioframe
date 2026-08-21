import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { resolveSafeErrorMessage } from '@shared/lib/error';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import type { DirectoryEntry } from '@shared/service';
import { computed, type Ref } from 'vue';
import { isUndefined } from 'es-toolkit';

/** Repository-owned visibility options for folder reads that should respect repository storage rules. */
export type UseRepositoryOptions = {
  /** Whether Automerge storage files should stay hidden from repository-aware visible entries. */
  hideAutomergeFiles?: boolean | undefined;
};

/**
 * Reads repository facts for a folder and exposes safe repository mutations.
 *
 * Uses exactly one `repositoryState` query: `ready`/`refreshing` both expose the retained snapshot
 * with `isLoading = false` (a refresh never flickers to a spinner), `loading` is loading, and
 * `error` is the one effective repository error. Visibility filtering is synchronous and
 * performs zero I/O.
 * @param path - Absolute folder path whose repository data should be observed.
 * @param options - Repository-owned directory visibility options for repository explorer style reads.
 * @returns Repository facts, loading and error state, and create/delete actions.
 */
export const useRepository = (
  path: Ref<string>,
  options?: Ref<UseRepositoryOptions | undefined>,
) => {
  const {
    repositories: { createDocument, deleteDocument, repositoryState },
  } = useMainServiceClient();

  const {
    data: state,
    error: transportError,
    isLoading: isTransportLoading,
  } = useObservableQuery(
    repositoryState,
    computed(() => ({
      path: path.value,
    })),
  );

  const snapshot = computed(() => {
    const value = state.value;

    return value?.status === 'ready' || value?.status === 'refreshing' ? value.snapshot : undefined;
  });

  const documentIds = computed(() => snapshot.value?.documentIds);
  const isInitialized = computed(() => snapshot.value?.isInitialized ?? false);

  const hideAutomergeFiles = computed(() => options?.value?.hideAutomergeFiles ?? true);
  const repositoryVisibleEntries = computed<readonly DirectoryEntry[] | undefined>(() =>
    snapshot.value?.entries
      .filter(({ classification }) => !hideAutomergeFiles.value || classification === 'regular')
      .map(({ entry }) => entry),
  );

  // A genuine transport failure overrides a cached repository-state error: it means the current
  // connection itself is broken, so any earlier service-state error is no longer reliable.
  const combinedError = computed<unknown>(() => {
    if (!isUndefined(transportError.value)) {
      return transportError.value;
    }

    return state.value?.status === 'error' ? state.value.error : undefined;
  });

  const errorMessage = computed(() =>
    resolveSafeErrorMessage(
      combinedError.value,
      'Could not load the Mioframe documents in this folder',
    ),
  );

  const isLoading = computed(
    () => isTransportLoading.value || state.value === undefined || state.value.status === 'loading',
  );

  return {
    documentIds,
    isInitialized,
    repositoryVisibleEntries,
    error: combinedError,
    errorMessage,
    isLoading,

    createDocument: (initialValue: CFRDocumentContent) => createDocument(path.value, initialValue),
    deleteDocument: (id: AMDocumentId) => deleteDocument(path.value, id),
  };
};
