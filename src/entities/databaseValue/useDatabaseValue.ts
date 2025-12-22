import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { useLiveResource } from '@shared/lib/useLiveResource';
import { useMainService } from '@shared/service';
import type { Ref } from 'vue';

export const useDatabaseValue = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  itemId: Ref<DatabaseItemId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const {
    databaseDocument: {
      onChangeDocument,
      data: { getValue, postValue },
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: value,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      itemId: itemId.value,
      propertyId: propertyId.value,
    }),
    {
      fetch: async ({ documentId, itemId, path, propertyId }) =>
        getValue(path, documentId, itemId, propertyId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading value',
    },
  );

  return {
    value,
    errorMessage,
    isLoading,
    isReady,

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
