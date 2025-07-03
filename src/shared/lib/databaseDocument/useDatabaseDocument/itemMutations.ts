import { deepPutJsonObject } from '@shared/lib/changeObject';
import type { PartialDeep } from 'type-fest';
import type { DatabaseData, DatabaseItem, DatabaseItemId } from '../migrations/state';
import { generateItemId } from '../migrations/state';

export const addItemMutation = (
  data: DatabaseData,
  item: DatabaseItem,
): DatabaseItemId => {
  const itemId = generateItemId();

  deepPutJsonObject(data, { [itemId]: item });

  return itemId;
};

export const updateItemMutation = (
  data: DatabaseData,
  itemId: DatabaseItemId,
  partialItem: PartialDeep<DatabaseItem>,
): void => {
  deepPutJsonObject(data, { [itemId]: partialItem });
};

export const removeItemMutation = (
  data: DatabaseData,
  itemId: DatabaseItemId,
): void => {
  deepPutJsonObject(data, { [itemId]: undefined });
};
