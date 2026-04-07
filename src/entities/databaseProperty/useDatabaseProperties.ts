import { useMainServiceClient } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { computed, type Ref } from 'vue';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { toValue } from 'vue';
import { isUndefined } from 'es-toolkit';

export const useDatabaseProperties = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    databaseDocument: {
      properties: {
        patch,
        post,
        remove,
        databaseProperties,
        databasePropertiesIdList,
      },
    },
  } = useMainServiceClient();

  const {
    data: properties,
    error,
    isLoading,
  } = useObservableQuery(
    databaseProperties,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
    })),
  );

  const { data: propertiesIdList } = useObservableQuery(
    databasePropertiesIdList,
    computed(() => ({
      documentId: documentId.value,
      path: path.value,
    })),
  );

  const propertiesMap = computed(
    (): DatabaseUnknownPropertiesMap | undefined => properties.value,
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
    properties: propertiesMap,
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
