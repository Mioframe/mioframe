import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItemId, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { useMainServiceClient } from '@shared/service';
import type { Ref } from 'vue';

/**
 * Exposes the narrow database-value write operation needed when an inline editor no longer owns a
 * mounted value ref.
 * @param path - Directory path containing the Database document.
 * @param documentId - Database document identity.
 * @returns A value writer addressed by item and property identity.
 */
export const useDatabaseValueWrite = (path: Ref<string>, documentId: Ref<AMDocumentId>) => {
  const {
    databaseDocument: {
      data: { postValue },
    },
  } = useMainServiceClient();

  return {
    postValue: (itemId: DatabaseItemId, propertyId: DatabasePropertyId, value: unknown) =>
      postValue(path.value, documentId.value, itemId, propertyId, value),
  };
};
