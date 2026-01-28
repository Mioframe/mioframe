import type { Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseFilter,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useMainService } from '@shared/service';
import { useLiveResource } from '@shared/lib/useLiveResource';
import type { PatchSource } from '@shared/lib/changeObject';

export const useDatabaseViewFilter = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      views: {
        filter: { get, patch, remove },
      },
      onChangeDocument,
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: filterQuery,
  } = useLiveResource(
    () => ({
      path: path.value,
      documentId: documentId.value,
      viewId: viewId.value,
    }),
    {
      fetch: ({
        documentId,
        path,
        viewId,
      }): Promise<DatabaseFilter | undefined> => get(path, documentId, viewId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading filter',
    },
  );

  return {
    filterQuery,
    errorMessage,
    isLoading,
    isReady,
    patch: async (source: PatchSource<DatabaseFilter>) => {
      await patch(path.value, documentId.value, viewId.value, source);
    },

    remove: async (sourcePath: PropertyKey[]) => {
      if (sourcePath.length) {
        await remove(path.value, documentId.value, viewId.value, sourcePath);
      }
    },
  };
};
