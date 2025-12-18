import { useMainService } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { computed, type Ref } from 'vue';
import { useLiveResource } from '@shared/lib/useLiveResource';

export const useDatabaseProperties = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    databaseDocument: {
      properties: { getDatabasePropertiesIdList, patch, post, remove },
      onChangeDocument,
    },
  } = useMainService();

  const {
    errorMessage,
    isLoading,
    isReady,
    state: propertiesIdList,
  } = useLiveResource(
    () => ({ path: path.value, documentId: documentId.value }),
    {
      fetch: ({ documentId, path }) =>
        getDatabasePropertiesIdList(path, documentId),
      subscribe: ({ documentId, path }, cb) =>
        onChangeDocument(path, documentId, cb),
      defaultErrorMessage: 'Error reading properties',
    },
  );

  const size = computed(() => propertiesIdList.value?.length);

  return {
    propertiesIdList,
    size,
    errorMessage,
    isLoading,
    isReady,

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
