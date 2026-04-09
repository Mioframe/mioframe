import { useMainServiceClient } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { strictRecordIterableKeys } from '@shared/lib/strictRecord';
import { computed, type Ref } from 'vue';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { toValue } from 'vue';
import { isUndefined } from 'es-toolkit';

export const useDatabaseProperties = (path: Ref<string>, documentId: Ref<AMDocumentId>) => {
  const {
    databaseDocument: {
      properties: { patch, post, remove, databaseProperties },
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

  const propertiesIdList = computed(() => {
    const currentProperties: DatabaseUnknownPropertiesMap | undefined = properties.value;

    if (!currentProperties) {
      return undefined;
    }

    return Array.from(strictRecordIterableKeys(currentProperties)());
  });

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
    properties,
    propertiesIdList,
    size,
    errorMessage,
    isLoading,

    patch: <T extends DatabaseUnknownProperty>(
      targetPath: string,
      targetDocumentId: AMDocumentId,
      id: DatabasePropertyId,
      property: PatchSource<T>,
    ) => patch(targetPath, targetDocumentId, id, property),
    post: (property: DatabaseUnknownProperty) => post(path.value, documentId.value, property),
    remove: (id: DatabasePropertyId) => remove(path.value, documentId.value, id),
  };
};
