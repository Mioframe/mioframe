import { computed, toValue, type Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseFilter,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useMainServiceClient } from '@shared/service';
import type { PatchSource } from '@shared/lib/changeObject';
import { useQuery } from '@shared/lib/observableQuery';
import { isUndefined } from 'es-toolkit';

export const useDatabaseViewFilter = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      views: {
        filter: { patch, remove, filter },
      },
    },
  } = useMainServiceClient();

  const {
    data: filterQuery,
    error,
    isLoading,
  } = useQuery(
    filter,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
      viewId: viewId.value,
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

    return 'Error reading filter';
  });

  return {
    filterQuery,
    errorMessage,
    isLoading,

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
