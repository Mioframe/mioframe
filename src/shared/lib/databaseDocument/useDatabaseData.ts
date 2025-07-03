import { computed, toRefs, toValue, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import { useDatabaseDocument } from './useDatabaseDocument';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseValue,
} from './migrations/versions';
import { generateItemId, type DatabaseItem } from './migrations/versions';
import { isUndefined } from 'es-toolkit';

export const useDatabaseData = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
) => {
  const docHandle = computed(() => toValue(rawDocHandle));

  const databaseDocument = useDatabaseDocument(docHandle);

  const { state } = toRefs(databaseDocument);

  const data = computed(() => state.value?.data);

  const createItem = async (item: DatabaseItem) => {
    const itemId = generateItemId();

    await databaseDocument.update((doc) => {
      doc.data[itemId] = item;
    });
  };

  const removeItem = async (itemId: DatabaseItemId) => {
    await databaseDocument.update((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- automerge recommended
      delete doc.data[itemId];
    });
  };

  const getItem = (itemId: DatabaseItemId) => data.value?.[itemId];

  const setValue = async (
    itemId: DatabaseItemId,
    propertyId: DatabasePropertyId,
    value: DatabaseValue,
  ) => {
    await databaseDocument.update((doc) => {
      if (!doc.data[itemId]) {
        doc.data[itemId] = {};
      }
      if (isUndefined(value)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- `undefined` is not a valid JSON data type
        delete doc.data[itemId][propertyId];
      } else {
        doc.data[itemId][propertyId] = value;
      }
    });
  };

  const getValue = (itemId: DatabaseItemId, propertyId: DatabasePropertyId) =>
    getItem(itemId)?.[propertyId];

  return {
    createItem,
    removeItem,
    getItem,
    setValue,
    getValue,
    data,
  };
};
