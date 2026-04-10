import { deepPatchJsonObject } from '@shared/lib/changeObject';
import type { PartialDeep } from 'type-fest';
import type { DatabaseData, DatabaseItem, DatabaseItemId } from '../migrations/versions';
import { generateItemId } from '../migrations/versions';

export const addItemMutation = (data: DatabaseData, item: DatabaseItem): DatabaseItemId => {
  const itemId = generateItemId();

  deepPatchJsonObject(data, { [itemId]: item });

  return itemId;
};

export const updateItemMutation = (
  data: DatabaseData,
  itemId: DatabaseItemId,
  partialItem: PartialDeep<DatabaseItem>,
): void => {
  deepPatchJsonObject(data, { [itemId]: partialItem });
};

export const removeItemMutation = (data: DatabaseData, itemId: DatabaseItemId): void => {
  deepPatchJsonObject(data, { [itemId]: undefined });
};
