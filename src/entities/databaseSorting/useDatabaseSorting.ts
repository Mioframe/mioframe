import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useMainService } from '@shared/service';
import { computedAsync } from '@vueuse/core';
import type { PartialDeep } from 'type-fest';
import type { Ref } from 'vue';

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
          getSortingPropertiesIdList,
          patch,
          post,
          remove,
        },
      },
    },
  } = useMainService();

  const sortingIdList = computedAsync(() =>
    getSortingPropertiesIdList(path.value, documentId.value, viewId.value),
  );

  return {
    sortingIdList,

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
