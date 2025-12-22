import { useMainService } from '@shared/service';
import type { Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { PatchSource } from '@shared/lib/changeObject';
import { useLiveResource } from '@shared/lib/useLiveResource';

export const useDatabaseViews = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    databaseDocument: {
      onChangeDocument,
      views: { getViewList, changeOrder, create, patch, remove },
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: views,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
    }),
    {
      fetch: ({ documentId, path }) => getViewList(path, documentId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading views',
    },
  );

  return {
    views,
    errorMessage,
    isLoading,
    isReady,

    create: (view: DatabaseView) => create(path.value, documentId.value, view),
    remove: (viewId: DatabaseViewId) =>
      remove(path.value, documentId.value, viewId),
    changeOrder: (from: number, to: number) =>
      changeOrder(path.value, documentId.value, from, to),
    patch: (viewId: DatabaseViewId, view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId, view),
  };
};
