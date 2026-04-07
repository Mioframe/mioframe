import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseStoredValue = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  itemId: Ref<DatabaseItemId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const {
    databaseDocument: {
      data: { postValue, databaseStoredValue },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    databaseStoredValue,
    computed(() => ({
      documentId: documentId.value,
      itemId: itemId.value,
      path: path.value,
      propertyId: propertyId.value,
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

    return 'Error reading stored value';
  });

  return {
    storedValue: data,
    errorMessage,
    isLoading,

    post: (value: unknown) =>
      postValue(
        path.value,
        documentId.value,
        itemId.value,
        propertyId.value,
        value,
      ),
  };
};
