import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { resolveSafeErrorMessage } from '@shared/lib/error';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { computed, type Ref } from 'vue';

/**
 * Reads repository document ids for a folder and exposes safe repository mutations.
 * @param path - Absolute folder path whose repository data should be observed.
 * @returns Repository document ids, loading and error state, and create/delete actions.
 */
export const useRepository = (path: Ref<string>) => {
  const {
    repositories: { createDocument, deleteDocument, documentIdList },
  } = useMainServiceClient();

  const {
    data: state,
    refetch,
    error,
    isLoading,
  } = useObservableQuery(
    documentIdList,
    computed(() => ({
      path: path.value,
    })),
  );

  const errorMessage = computed(() =>
    resolveSafeErrorMessage(error.value, 'Could not load the Mioframe documents in this folder'),
  );

  return {
    state,
    refetch,
    error,
    errorMessage,
    isLoading,

    createDocument: (initialValue: CFRDocumentContent) => createDocument(path.value, initialValue),
    deleteDocument: (id: AMDocumentId) => deleteDocument(path.value, id),
  };
};
