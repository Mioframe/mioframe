import { deepPutJSONObject } from '@shared/lib/changeObject';
import type { PartialDeep } from 'type-fest';
import type { DatabaseData, DatabaseItem, DatabaseItemId } from '../state';
import { generateItemId } from '../state';

export const addItemMutation = (
  data: DatabaseData,
  item: DatabaseItem,
): DatabaseItemId => {
  const itemId = generateItemId();

  deepPutJSONObject(data, { [itemId]: item });

  return itemId;
};

export const updateItemMutation = (
  data: DatabaseData,
  itemId: DatabaseItemId,
  partialItem: PartialDeep<DatabaseItem>,
): void => {
  deepPutJSONObject(data, { [itemId]: partialItem });
};

export const removeItemMutation = (
  data: DatabaseData,
  itemId: DatabaseItemId,
): void => {
  deepPutJSONObject(data, { [itemId]: undefined });
};
