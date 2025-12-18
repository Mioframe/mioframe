import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useLiveResource } from '@shared/lib/useLiveResource';
import { useMainService } from '@shared/service';
import type { PartialDeep } from 'type-fest';
import type { Ref } from 'vue';

export const useDatabaseSorting = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      onChangeDocument,
      views: {
        sorting: {
          changePriority,
          getSortingPropertiesIdList,
          patch,
          post,
          remove,
        },
      },
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: sortingIdList,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      viewId: viewId.value,
    }),
    {
      fetch: async ({ documentId, path, viewId }) =>
        getSortingPropertiesIdList(path, documentId, viewId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading sorting list',
    },
  );

  return {
    sortingIdList,
    errorMessage,
    isLoading,
    isReady,

    changePriority: (from: number, to: number) =>
      changePriority(path.value, documentId.value, viewId.value, from, to),

    post: (
      propertyId: DatabasePropertyId,
      sortDescription?: PartialDeep<DatabaseSortDescription>,
    ) =>
      post(
        path.value,
        documentId.value,
        viewId.value,
        propertyId,
        sortDescription,
      ),

    patch: (
      propertyId: DatabasePropertyId,
      sortDescription: PartialDeep<DatabaseSortDescription>,
    ) =>
      patch(
        path.value,
        documentId.value,
        viewId.value,
        propertyId,
        sortDescription,
      ),

    remove: (propertyId: DatabasePropertyId) =>
      remove(path.value, documentId.value, viewId.value, propertyId),
  };
};
