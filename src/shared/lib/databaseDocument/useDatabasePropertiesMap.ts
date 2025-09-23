import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import { useDatabaseDocument } from './useDatabaseDocument';
import { useWrapStrictRecord } from '../strictRecord';
import {
  generatePropertyId,
  type DatabasePropertyId,
  type DatabaseUnknownProperty,
} from './migrations/versions';
import { toRefs } from '@vueuse/core';
import { deepPatchJsonObject, deepPutJsonObject } from '../changeObject';
import type { PartialDeep } from 'type-fest';

export const useDatabasePropertiesMap = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
) => {
  const docHandle = computed(() => toValue(rawDocHandle));

  const { update: updateDatabaseDocument, state } = toRefs(
    useDatabaseDocument(docHandle),
  );

  const propertiesRef = computed(() => state.value?.properties);

  const propertiesMap = useWrapStrictRecord(propertiesRef);

  const set = async (
    id: DatabasePropertyId,
    property: DatabaseUnknownProperty,
  ) => {
    await updateDatabaseDocument.value((d) => {
      if (d.properties[id]) {
        deepPutJsonObject(d.properties[id], property, { trimString: true });
      } else {
        d.properties[id] = property;
      }

      return d;
    });
  };

  const create = async (property: DatabaseUnknownProperty) => {
    const id = generatePropertyId();

    await set(id, property);

    return id;
  };

  const put = async <
    T extends DatabaseUnknownProperty = DatabaseUnknownProperty,
  >(
    id: DatabasePropertyId,
    partialProperty: PartialDeep<T>,
  ) => {
    await updateDatabaseDocument.value((d) => {
      return deepPatchJsonObject(d, {
        properties: {
          [id]: partialProperty,
        },
      });
    });
  };

  const entries = computed(() => propertiesMap.value?.entries);

  const keys = computed(() => propertiesMap.value?.keys);

  const values = computed(() => propertiesMap.value?.values);

  const has = (id: DatabasePropertyId): boolean | undefined =>
    propertiesMap.value?.has(id);

  const get = (
    propertyId: DatabasePropertyId,
  ): DatabaseUnknownProperty | undefined =>
    propertiesMap.value?.get(propertyId);

  const forEach = (
    callbackfn: (view: DatabaseUnknownProperty, id: DatabasePropertyId) => void,
  ): void => propertiesMap.value?.forEach(callbackfn);

  const size = computed((): number | undefined => propertiesMap.value?.size);

  const remove = async (id: DatabasePropertyId) => {
    await updateDatabaseDocument.value((d) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- it's for automerge
      delete d.properties[id];
    });
  };

  return reactive({
    set,
    remove,
    size,
    forEach,
    get,
    has,
    values,
    keys,
    entries,
    put,
    create,
  });
};
