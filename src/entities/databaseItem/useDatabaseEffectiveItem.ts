import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDatabaseEffectiveItem = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  itemId: Ref<DatabaseItemId | undefined>,
) => {
  const {
    databaseDocument: {
      data: { databaseEffectiveItem },
    },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    databaseEffectiveItem,
    computed(() => ({
      documentId: documentId.value,
      itemId: itemId.value,
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

    return 'Error reading effective item';
  });

  return {
    effectiveItem: data,
    isLoading,
    errorMessage,
  };
};
