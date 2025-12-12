import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useMainService } from '@shared/service';
import { computedAsync } from '@vueuse/core';
import type { Ref } from 'vue';

export const useDatabaseSortDescription = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const {
    databaseDocument: {
      views: {
        sorting: { get, toggleDirection },
      },
    },
  } = useMainService();

  const sortDescription = computedAsync(
    () => get(path.value, documentId.value, viewId.value, propertyId.value),
    undefined,
    { lazy: true },
  );

  return {
    sortDescription,
    toggleDirection: () =>
      toggleDirection(
        path.value,
        documentId.value,
        viewId.value,
        propertyId.value,
      ),
  };
};
