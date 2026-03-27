import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useObservableQuery } from '@shared/lib/observableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import type { PartialDeep } from 'type-fest';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseSorting = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      views: {
        sorting: {
          changePriority,
          sortingPropertiesIdList,
          patch,
          post,
          remove,
        },
      },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    sortingPropertiesIdList,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
      viewId: viewId.value,
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

    return 'Error reading sorting list';
  });

  return {
    sortingIdList: data,
    errorMessage,
    isLoading,

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
