import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useLiveResource } from '@shared/lib/useLiveResource';
import { useMainService } from '@shared/service';
import type { Ref } from 'vue';

export const useDatabaseSortDescription = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const {
    databaseDocument: {
      onChangeDocument,
      views: {
        sorting: { get, toggleDirection },
      },
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: sortDescription,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      viewId: viewId.value,
      propertyId: propertyId.value,
    }),
    {
      fetch: async ({ documentId, path, propertyId, viewId }) =>
        get(path, documentId, viewId, propertyId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading properties',
    },
  );

  return {
    sortDescription,
    errorMessage,
    isLoading,
    isReady,

    toggleDirection: () =>
      toggleDirection(
        path.value,
        documentId.value,
        viewId.value,
        propertyId.value,
      ),
  };
};
