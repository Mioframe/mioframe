import type { AMDocumentId } from '@shared/lib/automerge';
import { useMainService } from '@shared/service';
import { type Ref } from 'vue';
import { useLiveResource } from '@shared/lib/useLiveResource';

export const useDocument = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId | undefined>,
) => {
  const {
    documents: { put, patch, getDocumentDescription, onChangeDocument },
  } = useMainService();

  const { errorMessage, isLoading, isReady, state } = useLiveResource(
    () => ({ path: path.value, documentId: documentId.value }),
    {
      fetch: async ({ documentId, path }) =>
        documentId ? await getDocumentDescription(path, documentId) : undefined,
      subscribe: ({ documentId, path }, cb) => {
        if (documentId) {
          return onChangeDocument(path, documentId, cb);
        }

        return undefined;
      },
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
