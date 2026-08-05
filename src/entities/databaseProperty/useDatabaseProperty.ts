import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service';
import { isUndefined } from 'es-toolkit';
import { computed, readonly, shallowRef, toValue, watch, type Ref } from 'vue';

/**
 * Reads and patches one database property by id.
 *
 * The underlying property query can re-emit a transient `undefined` for a
 * property that is still present (e.g. an upstream document-state
 * re-emission racing the property map), which would otherwise flash
 * consumers into their "no property" fallback while the property is being
 * actively edited. `property` holds the last-resolved value for the current
 * `(path, documentId, propertyId)` identity and only clears when that
 * identity itself changes.
 * @param path Directory path containing the document.
 * @param documentId Document id the property belongs to.
 * @param propertyId Property id to read; `undefined` cancels the query.
 * @returns Reactive property state and a patch helper.
 */
export const useDatabaseProperty = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  propertyId: Ref<DatabasePropertyId | undefined>,
) => {
  const {
    databaseDocument: {
      properties: { patch, databaseProperty },
    },
  } = useMainServiceClient();

  const query = computed(() => ({
    documentId: documentId.value,
    id: propertyId.value,
    path: path.value,
  }));

  const { data, error, isLoading } = useObservableQuery(databaseProperty, query);

  const resolvedProperty = shallowRef<DatabaseUnknownProperty | undefined>();
  let resolvedQueryKey: string | undefined;

  watch(
    [query, data],
    ([{ documentId: nextDocumentId, id: nextId, path: nextPath }, nextData]) => {
      const nextQueryKey = `${nextPath}:${nextDocumentId}:${nextId}`;

      if (nextQueryKey !== resolvedQueryKey) {
        resolvedQueryKey = nextQueryKey;
        resolvedProperty.value = nextData;
        return;
      }

      if (nextData !== undefined) {
        resolvedProperty.value = nextData;
      }
    },
    { immediate: true },
  );

  const errorMessage = computed(() => {
    const e = toValue(error);

    if (isUndefined(e)) {
      return undefined;
    }

    if (e instanceof Error) {
      return e.message;
    }

    return 'Error reading property';
  });

  return {
    property: readonly(resolvedProperty),
    errorMessage,
    isLoading,

    patch: <T extends DatabaseUnknownProperty>(property: PatchSource<T>) => {
      if (!propertyId.value) {
        throw new DomainError('propertyId in undefined');
      }
      return patch(path.value, documentId.value, propertyId.value, property);
    },
  };
};
