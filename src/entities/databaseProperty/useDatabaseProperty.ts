import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import { useLiveResource } from '@shared/lib/useLiveResource';
import { useMainService } from '@shared/service';
import type { Ref } from 'vue';

export const useDatabaseProperty = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  propertyId: Ref<DatabasePropertyId | undefined>,
) => {
  const {
    databaseDocument: {
      onChangeDocument,
      properties: { get, patch },
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: property,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      propertyId: propertyId.value,
    }),
    {
      fetch: async ({ documentId, path, propertyId }) =>
        propertyId ? await get(path, documentId, propertyId) : undefined,
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading property',
    },
  );

  return {
    property,
    errorMessage,
    isLoading,
    isReady,

    patch: <T extends DatabaseUnknownProperty>(property: PatchSource<T>) => {
      if (!propertyId.value) {
        throw new DomainError('propertyId in undefined');
      }
      return patch(path.value, documentId.value, propertyId.value, property);
    },
  };
};
