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
import { deepPutJsonObject, deepReplaceJsonObject } from '../changeObject';

export const useDatabasePropertiesMap = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle>,
) => {
  const docHandle = computed(() => toValue(rawDocHandle));

  const { content, update: updateDatabaseDocument } = toRefs(
    useDatabaseDocument(docHandle),
  );

  const propertiesRef = computed(() => content.value?.body?.properties);

  const propertiesMap = useWrapStrictRecord(propertiesRef);

  const set = async (
    id: DatabasePropertyId,
    property: DatabaseUnknownProperty,
  ) => {
    await updateDatabaseDocument.value((d) => {
      if (!d.properties) {
        d.properties = {
          [id]: property,
        };
      } else {
        if (d.properties[id]) {
          deepReplaceJsonObject(d.properties[id], property);
        } else {
          d.properties[id] = property;
        }
      }

      return d;
    });
  };

  const create = async (property: DatabaseUnknownProperty) => {
    const id = generatePropertyId();

    await set(id, property);

    return id;
  };

  const update = async (
    id: DatabasePropertyId,
    partialProperty: Partial<DatabaseUnknownProperty>,
  ) => {
    await updateDatabaseDocument.value((d) => {
      return deepPutJsonObject(d, {
        properties: {
          [id]: partialProperty,
        },
      });
    });
  };

  const entries = ():
    | IterableIterator<[DatabasePropertyId, DatabaseUnknownProperty]>
    | undefined => propertiesMap.value?.entries();

  const keys = (): IterableIterator<DatabasePropertyId> | undefined =>
    propertiesMap.value?.keys();

  const values = (): IterableIterator<DatabaseUnknownProperty> | undefined =>
    propertiesMap.value?.values();

  const has = (id: DatabasePropertyId): boolean | undefined =>
    propertiesMap.value?.has(id);

  const get = (
    viewId: DatabasePropertyId,
  ): DatabaseUnknownProperty | undefined => propertiesMap.value?.get(viewId);

  const forEach = (
    callbackfn: (view: DatabaseUnknownProperty, id: DatabasePropertyId) => void,
  ): void => propertiesMap.value?.forEach(callbackfn);

  const size = computed((): number | undefined => propertiesMap.value?.size);

  const remove = async (id: DatabasePropertyId) => {
    await updateDatabaseDocument.value((d) => {
      delete d.properties?.[id];
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
    update,
    create,
  });
};
