import type { AMDocumentId } from '@shared/lib/automerge';
import { useMainService } from '@shared/service';
import { type Ref } from 'vue';
import { useLiveResource } from '@shared/lib/useLiveResource';

export const useDocument = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    documents: { put, patch, getDocumentDescription, onChangeDocument },
  } = useMainService();

  const { errorMessage, isLoading, isReady, state } = useLiveResource(
    () => ({ path: path.value, documentId: documentId.value }),
    {
      fetch: ({ documentId, path }) => getDocumentDescription(path, documentId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading document',
    },
  );

  return {
    state,
    errorMessage,
    isLoading,
    isReady,

    put,
    patch,
  };
};
