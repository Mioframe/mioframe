import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import { useObservableQuery } from '@shared/lib/observableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseProperty = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  propertyId: Ref<DatabasePropertyId | undefined>,
) => {
  const {
    databaseDocument: {
      properties: { patch, databaseProperty },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    databaseProperty,
    computed(() => ({
      documentId: documentId.value,
      id: propertyId.value,
      path: path.value,
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

    return 'Error reading property';
  });

  return {
    property: data,
    errorMessage,
    isLoading,

    patch: <T extends DatabaseUnknownProperty>(property: PatchSource<T>) => {
      if (!propertyId.value) {
        throw new DomainError('propertyId in undefined');
      }
      return patch(path.value, documentId.value, propertyId.value, property);
    },
  };
};
