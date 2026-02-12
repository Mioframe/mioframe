import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useQuery } from '@shared/lib/observableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseSortDescription = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const {
    databaseDocument: {
      views: {
        sorting: { toggleDirection, databaseSort },
      },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useQuery(
    databaseSort,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
      propertyId: propertyId.value,
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

    return 'Error reading properties';
  });

  return {
    sortDescription: data,
    errorMessage,
    isLoading,

    toggleDirection: () =>
      toggleDirection(
        path.value,
        documentId.value,
        viewId.value,
        propertyId.value,
      ),
  };
};
