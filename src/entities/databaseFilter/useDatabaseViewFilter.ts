import type { Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { useMainService } from '@shared/service';
import { useLiveResource } from '@shared/lib/useLiveResource';

export const useDatabaseViewFilter = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      views: {
        filter: { get },
      },
      onChangeDocument,
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: filterQuery,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      viewId: viewId.value,
    }),
    {
      fetch: ({ documentId, path, viewId }) => get(path, documentId, viewId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading filter',
    },
  );

  return {
    filterQuery,
    errorMessage,
    isLoading,
    isReady,
  };
};
