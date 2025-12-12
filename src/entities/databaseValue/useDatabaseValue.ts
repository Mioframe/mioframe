import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { useMainService } from '@shared/service';
import { computedAsync } from '@vueuse/core';
import type { Ref } from 'vue';

export const useDatabaseValue = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  itemId: Ref<DatabaseItemId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const {
    databaseDocument: {
      data: { getValue, postValue },
    },
  } = useMainService();

  const value = computedAsync(() =>
    getValue(path.value, documentId.value, itemId.value, propertyId.value),
  );

  return {
    value,
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
