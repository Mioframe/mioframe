import type { AMDocumentId } from '@shared/lib/automerge';
import { useMainServiceClient } from '@shared/service';
import { computed, toValue, type Ref } from 'vue';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { isUndefined } from 'es-toolkit';

export const useDocument = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId | undefined>,
) => {
  const {
    documents: { put, patch, documentDescription },
  } = useMainServiceClient();

  const {
    data: state,
    error,
    isLoading,
  } = useObservableQuery(
    documentDescription,
    computed(() => ({
      documentId: documentId.value,
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

    return 'Error reading document';
  });

  return {
    state,
    errorMessage,
    isLoading,

    put,
    patch,
  };
};
