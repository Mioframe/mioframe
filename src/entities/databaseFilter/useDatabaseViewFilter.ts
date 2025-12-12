import { useMainServiceClient } from '@shared/service/useService';
import { computedAsync } from '@vueuse/core';
import type { Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseFilter,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';

export const useDatabaseViewFilter = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      views: {
        filter: { patch, post, get },
      },
    },
  } = useMainServiceClient();

  const filter = computedAsync(
    () => get(path.value, documentId.value, viewId.value),
    undefined,
    { lazy: true },
  );

  return {
    filter,
    patch,
    post: (v: DatabaseFilter) =>
      post(path.value, documentId.value, viewId.value, v),
  };
};
