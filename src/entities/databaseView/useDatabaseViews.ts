import { useMainServiceClient } from '@shared/service';
import { computed, toValue, type Ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { PatchSource } from '@shared/lib/changeObject';
import { useObservableQuery } from '@shared/lib/observableQuery';
import { isUndefined } from 'es-toolkit';

export const useDatabaseViews = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    databaseDocument: {
      views: { changeOrder, create, patch, remove, viewList },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    viewList,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
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

    return 'Error reading views';
  });

  return {
    views: data,
    errorMessage,
    isLoading,

    create: (view: DatabaseView) => create(path.value, documentId.value, view),
    remove: (viewId: DatabaseViewId) =>
      remove(path.value, documentId.value, viewId),
    changeOrder: (from: number, to: number) =>
      changeOrder(path.value, documentId.value, from, to),
    patch: (viewId: DatabaseViewId, view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId, view),
  };
};
