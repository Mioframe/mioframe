import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseView = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  viewId: Ref<DatabaseViewId>,
) => {
  const {
    databaseDocument: {
      views: { patch, databaseView },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    databaseView,
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

    return 'Error reading view';
  });

  return {
    view: data,
    errorMessage,
    isLoading,

    patch: (view: PatchSource<DatabaseView>) =>
      patch(path.value, documentId.value, viewId.value, view),
  };
};
