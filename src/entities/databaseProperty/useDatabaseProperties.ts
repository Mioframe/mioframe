import { useMainService } from '@shared/service';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { computedAsync } from '@vueuse/core';
import { computed, type Ref } from 'vue';

export const useDatabaseProperties = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
) => {
  const {
    databaseDocument: {
      properties: { getDatabasePropertiesIdList, patch, post, remove },
    },
  } = useMainService();

  const propertiesIdList = computedAsync(
    () => getDatabasePropertiesIdList(path.value, documentId.value),
    undefined,
    { lazy: true },
  );

  const size = computed(() => propertiesIdList.value?.length);

  return {
    propertiesIdList,
    size,

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
