import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseEffectiveValue = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  itemId: Ref<DatabaseItemId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const {
    databaseDocument: {
      data: { databaseEffectiveValue },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    databaseEffectiveValue,
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

    return 'Error reading effective value';
  });

  return {
    value: data,
    errorMessage,
    isLoading,
  };
};
