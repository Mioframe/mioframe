import { useMainServiceClient } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { computed, type Ref } from 'vue';
import { useQuery } from '@shared/lib/observableQuery';
import { toValue } from 'vue';
import { isUndefined } from 'es-toolkit';

export const useDatabaseProperties = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    databaseDocument: {
      properties: { patch, post, remove, databasePropertiesIdList },
    },
  } = useMainServiceClient();

  const {
    data: propertiesIdList,
    error,
    isLoading,
  } = useQuery(
    databasePropertiesIdList,
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

    return 'Error reading properties';
  });

  const size = computed(() => propertiesIdList.value?.length);

  return {
    propertiesIdList,
    size,
    errorMessage,
    isLoading,

    patch: <T extends DatabaseUnknownProperty>(
      path: string,
      documentId: AMDocumentId,
      id: DatabasePropertyId,
      property: PatchSource<T>,
    ) => patch(path, documentId, id, property),
    post: (property: DatabaseUnknownProperty) =>
      post(path.value, documentId.value, property),
    remove: (id: DatabasePropertyId) =>
      remove(path.value, documentId.value, id),
  };
};
