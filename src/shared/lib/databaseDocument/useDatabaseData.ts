import { computed, toRefs, toValue, type MaybeRefOrGetter } from 'vue';
import type { AMDocHandle } from '../automerge';
import { useDatabaseDocument } from './useDatabaseDocument';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseValue,
} from './state';
import { generateItemId, type DatabaseItem } from './state';

export const useDatabaseData = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
) => {
  const docHandle = computed(() => toValue(rawDocHandle));

  const databaseDocument = useDatabaseDocument(docHandle);

  const { content } = toRefs(databaseDocument);

  const data = computed(() => content.value?.body?.data);

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
      doc.data[itemId][propertyId] = value;
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
