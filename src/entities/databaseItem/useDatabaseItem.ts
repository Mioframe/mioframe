import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItem,
  DatabaseItemId,
} from '@shared/lib/databaseDocument';
import { useMainService } from '@shared/service';
import { computedAsync } from '@vueuse/core';
import type { Ref } from 'vue';

export const useDatabaseItem = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  itemId: Ref<DatabaseItemId | undefined>,
) => {
  const {
    databaseDocument: {
      data: { getItem, postItem },
    },
  } = useMainService();

  const item = computedAsync(
    async () =>
      itemId.value
        ? await getItem(path.value, documentId.value, itemId.value)
        : undefined,
    undefined,
    {
      lazy: true,
    },
  );

  return {
    item,
    postItem: (item: DatabaseItem) =>
      postItem(path.value, documentId.value, item, itemId.value),
  };
};
