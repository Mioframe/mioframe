import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useLiveResource } from '@shared/lib/useLiveResource';
import { useMainService } from '@shared/service';
import type { Ref } from 'vue';

export const useDatabaseView = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      onChangeDocument,
      views: { getView, patch },
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: view,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      viewId: viewId.value,
    }),
    {
      fetch: ({ documentId, path, viewId }) =>
        getView(path, documentId, viewId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading view',
    },
  );

  return {
    view,
    errorMessage,
    isLoading,
    isReady,

    patch: (view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId.value, view),
  };
};
