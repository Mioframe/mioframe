import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import { useMainService } from '@shared/service';
import { computedAsync } from '@vueuse/core';
import type { Ref } from 'vue';

export const useDatabaseProperty = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  propertyId: Ref<DatabasePropertyId | undefined>,
) => {
  const {
    databaseDocument: {
      properties: { get, patch },
    },
  } = useMainService();

  const property = computedAsync(
    async () =>
      propertyId.value
        ? await get(path.value, documentId.value, propertyId.value)
        : undefined,
    undefined,
    { lazy: true },
  );

  return {
    property,
    patch: <T extends DatabaseUnknownProperty>(property: PatchSource<T>) => {
      if (!propertyId.value) {
        throw new DomainError('propertyId in undefined');
      }
      return patch(path.value, documentId.value, propertyId.value, property);
    },
  };
};
