import type { AMDocumentId, CFRDocumentContent } from '@shared/lib/cfrDocument';
import { useQuery } from '@shared/lib/observableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useRepository = (path: Ref<string>) => {
  const {
    repositories: { createDocument, deleteDocument, documentIdList },
  } = useMainServiceClient();

  const {
    data: state,
    error,
    isLoading,
  } = useQuery(
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
    errorMessage,
    isLoading,

    createDocument: (initialValue: CFRDocumentContent) =>
      createDocument(path.value, initialValue),
    deleteDocument: (id: AMDocumentId) => deleteDocument(path.value, id),
  };
};
