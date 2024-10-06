import { cloneDeep } from 'lodash-es';
import type { PartialDeep } from 'type-fest';
import { type Ref, ref, watch, computed } from 'vue';
import { replaceObject } from '../../shared/lib/changeObject';
import type {
  DatabaseDocument,
  DataBaseStateLatest,
  AnyProperty,
  PropertyId,
  DatabaseDocumentContent,
} from '../../shared/lib/databaseDocument';

export const useDatabaseDocument = (
  databaseDocumentRef: Ref<DatabaseDocument | undefined>,
) => {
  const databaseState = ref<DataBaseStateLatest>();

  let offChange: (() => void) | undefined;

  const changeDatabaseState = (doc?: DatabaseDocumentContent) => {
    if (!databaseState.value) {
      databaseState.value = cloneDeep(doc?.body);
    } else {
      replaceObject(databaseState.value, doc?.body ?? {});
    }
  };

  watch(
    databaseDocumentRef,
    async (databaseDocument) => {
      offChange?.();
      offChange = undefined;
      if (databaseDocument) {
        offChange = databaseDocument.onChange(changeDatabaseState);
        const doc = await databaseDocument.read();
        changeDatabaseState(doc);
      }
    },
    { immediate: true },
  );

  const addProperty = (property: AnyProperty) =>
    databaseDocumentRef.value?.addProperty(property);

  const removeProperty = (propertyId: PropertyId) => {
    databaseDocumentRef.value?.removeProperty(propertyId);
  };

  const updateProperty = (
    propertyId: PropertyId,
    partialProperty: PartialDeep<AnyProperty>,
  ) => databaseDocumentRef.value?.updateProperty(propertyId, partialProperty);

  const properties = computed(() => databaseState.value?.properties);

  return {
    addProperty,
    properties,
    updateProperty,
    removeProperty,
  };
};
