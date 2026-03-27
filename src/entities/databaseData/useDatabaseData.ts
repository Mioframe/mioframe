import { useMainServiceClient } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import { computed, toValue, type Ref } from 'vue';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { Query } from 'sift';
import { useObservableQuery } from '@shared/lib/observableQuery';
import { isUndefined } from 'es-toolkit';

export const useDatabaseData = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId?: Ref<DatabaseViewId | undefined>,
  idQuery?: Ref<Query<DatabaseItemId> | undefined>,
) => {
  const {
    databaseDocument: {
      data: { removeItem, postItem, filteredIdList },
    },
  } = useMainServiceClient();

  const {
    data: itemIdList,
    error,
    isLoading,
  } = useObservableQuery(
    filteredIdList,
    computed(() => ({
      documentId: documentId.value,
      options: {
        idQuery: idQuery?.value,
      },
      path: path.value,
      viewId: viewId?.value,
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

    return 'Error reading database items';
  });

  return {
    itemIdList,
    errorMessage,
    isLoading,

    postItem: (item: DatabaseItem, itemId?: DatabaseItemId) =>
      postItem(path.value, documentId.value, item, itemId),
    removeItem: (itemId: DatabaseItemId) =>
      removeItem(path.value, documentId.value, itemId),
  };
};
