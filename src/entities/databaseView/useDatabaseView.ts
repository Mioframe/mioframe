import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useMainService } from '@shared/service';
import { asyncComputed } from '@vueuse/core';
import type { Ref } from 'vue';

export const useDatabaseView = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      views: { getView, patch },
    },
  } = useMainService();

  const view = asyncComputed(
    () => getView(path.value, documentId.value, viewId.value),
    undefined,
    { lazy: true },
  );

  return {
    view,
    patch: (view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId.value, view),
  };
};
