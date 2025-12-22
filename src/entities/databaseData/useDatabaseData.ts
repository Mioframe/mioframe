import { useMainService } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import { type Ref } from 'vue';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { Query } from 'sift';
import { useLiveResource } from '@shared/lib/useLiveResource';

export const useDatabaseData = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId?: Ref<DatabaseViewId | undefined>,
  idQuery?: Ref<Query<DatabaseItemId> | undefined>,
) => {
  const {
    databaseDocument: {
      onChangeDocument,
      data: { removeItem, postItem, getItemIdList },
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: itemIdList,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      viewId: viewId?.value,
      idQuery: idQuery?.value,
    }),
    {
      fetch: async ({ documentId, path, viewId, idQuery }) =>
        getItemIdList(path, documentId, viewId, {
          idQuery,
        }),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading items',
    },
  );

  return {
    itemIdList,
    errorMessage,
    isLoading,
    isReady,

    postItem: (item: DatabaseItem, itemId?: DatabaseItemId) =>
      postItem(path.value, documentId.value, item, itemId),
    removeItem: (itemId: DatabaseItemId) =>
      removeItem(path.value, documentId.value, itemId),
  };
};
