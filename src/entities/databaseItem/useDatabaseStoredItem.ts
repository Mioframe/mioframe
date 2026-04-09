import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItem, DatabaseItemId } from '@shared/lib/databaseDocument';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseStoredItem = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  itemId: Ref<DatabaseItemId | undefined>,
) => {
  const {
    databaseDocument: {
      data: { postItem, databaseItem },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    databaseItem,
    computed(() => ({
      documentId: documentId.value,
      itemId: itemId.value,
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

    return 'Error reading item';
  });

  return {
    item: data,
    isLoading,
    errorMessage,

    postItem: (item: DatabaseItem) => postItem(path.value, documentId.value, item, itemId.value),
  };
};
