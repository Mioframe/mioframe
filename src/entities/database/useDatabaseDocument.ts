import { cloneDeep } from 'lodash-es';
import type { PartialDeep } from 'type-fest';
import { type Ref, ref, watch, computed } from 'vue';
import { replaceObject } from '../../shared/lib/changeObject';
import type {
  DatabaseApi,
  DataBaseStateLatest,
  AnyProperty,
  PropertyId,
  DatabaseDocument,
} from '../../shared/lib/databaseDocument';

export const useDatabaseDocument = (
  databaseApi: Ref<DatabaseApi | undefined>,
) => {
  const databaseState = ref<DataBaseStateLatest>();

  let offChange: (() => void) | undefined;

  const changeDatabaseState = (doc: DatabaseDocument) => {
    if (!databaseState.value) {
      databaseState.value = cloneDeep(doc.body);
    } else {
      replaceObject(databaseState.value, doc.body);
    }
  };

  watch(
    databaseApi,
    async (databaseApi) => {
      offChange?.();
      offChange = undefined;
      if (databaseApi) {
        offChange = databaseApi.onChange(changeDatabaseState);
        const doc = await databaseApi.read();
        changeDatabaseState(doc);
      }
    },
    { immediate: true },
  );

  const addProperty = (property: AnyProperty) =>
    databaseApi.value?.addProperty(property);

  const removeProperty = (propertyId: PropertyId) => {
    databaseApi.value?.removeProperty(propertyId);
  };

  const updateProperty = (
    propertyId: PropertyId,
    partialProperty: PartialDeep<AnyProperty>,
  ) => databaseApi.value?.updateProperty(propertyId, partialProperty);

  const properties = computed(() => databaseState.value?.properties);

  return {
    addProperty,
    properties,
    updateProperty,
    removeProperty,
  };
};
