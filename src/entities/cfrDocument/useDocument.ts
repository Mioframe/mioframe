import type { AMDocumentId } from '@shared/lib/automerge';
import { useMainService } from '@shared/service';
import { computed, toValue, type Ref } from 'vue';
import { useQuery } from '@shared/lib/observableQuery';
import { isUndefined } from 'es-toolkit';

export const useDocument = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId | undefined>,
) => {
  const {
    documents: { put, patch, documentDescription },
  } = useMainService();

  const {
    data: state,
    error,
    isLoading,
  } = useQuery(
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
