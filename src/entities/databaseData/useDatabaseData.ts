import { useMainService } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import { type Ref } from 'vue';
import { asyncComputed } from '@vueuse/core';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { Query } from 'sift';

export const useDatabaseData = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId?: Ref<DatabaseViewId | undefined>,
  idQuery?: Ref<Query<DatabaseItemId> | undefined>,
) => {
  const {
    databaseDocument: {
      data: { removeItem, postItem, getItemIdList },
    },
  } = useMainService();

  const itemIdList = asyncComputed(() =>
    getItemIdList(path.value, documentId.value, viewId?.value, {
      idQuery: idQuery?.value,
    }),
  );

  return {
    postItem: (item: DatabaseItem, itemId?: DatabaseItemId) =>
      postItem(path.value, documentId.value, item, itemId),
    removeItem: (itemId: DatabaseItemId) =>
      removeItem(path.value, documentId.value, itemId),

    itemIdList,
  };
};
