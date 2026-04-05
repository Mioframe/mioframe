import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

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

  const errorMessage = computed(() => {
    const e = toValue(error);

    if (isUndefined(e)) {
      return undefined;
    }

    if (e instanceof Error) {
      return e.message;
    }

    return 'Error reading repository';
  });

  return {
    state,
    refetch,
    error,
    errorMessage,
    isLoading,

    createDocument: (initialValue: CFRDocumentContent) =>
      createDocument(path.value, initialValue),
    deleteDocument: (id: AMDocumentId) => deleteDocument(path.value, id),
  };
};
