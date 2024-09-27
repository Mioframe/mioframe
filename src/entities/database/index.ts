import { computed, ref, watch, type Ref } from 'vue';
import type {
  DatabaseApi,
  DataBaseStateLatest,
  PropertyId,
} from '../../shared/lib/databaseDocument';
import { type AnyProperty } from '../../shared/lib/databaseDocument';
import type { PartialDeep } from 'type-fest';
import { replaceObject } from '../../shared/lib/changeObject';
import { cloneDeep } from 'lodash-es';

export const useDatabaseDocument = (
  databaseApi: Ref<DatabaseApi | undefined>,
) => {
  const databaseState = ref<DataBaseStateLatest>();

  let offChange: (() => void) | undefined;

  watch(
    databaseApi,
    (databaseApi) => {
      offChange?.();
      offChange = databaseApi?.onChange((doc) => {
        if (!databaseState.value) {
          databaseState.value = cloneDeep(doc.body);
        } else {
          replaceObject(databaseState.value, doc.body);
        }
      });
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
