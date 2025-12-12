import { useMainService } from '@shared/service';
import type { Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { asyncComputed } from '@vueuse/core';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { PatchSource } from '@shared/lib/changeObject';

export const useDatabaseViews = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    databaseDocument: {
      views: { getViewList, changeOrder, create, patch, remove },
    },
  } = useMainService();

  const views = asyncComputed(
    () => getViewList(path.value, documentId.value),
    undefined,
    { lazy: true },
  );

  return {
    views,

    create: (view: DatabaseView) => create(path.value, documentId.value, view),
    remove: (viewId: DatabaseViewId) =>
      remove(path.value, documentId.value, viewId),
    changeOrder: (from: number, to: number) =>
      changeOrder(path.value, documentId.value, from, to),
    patch: (viewId: DatabaseViewId, view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId, view),
  };
};
