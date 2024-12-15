import { is } from '@shared/lib/validateZodScheme';
import { zodDatabaseTypeDocument, type MutationFn } from '../types';
import type { Item } from './data';
import type { ItemId } from './id';
import { generateItemId } from './id';
import { putObject } from '@shared/lib/changeObject';
import { applyDatabaseDocumentMigration } from '../migrations';
import type { PartialDeep } from 'type-fest';

export const addItemMutation = (
  change: (mutation: MutationFn) => unknown,
  item: Item,
): Promise<ItemId> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const itemId = generateItemId();

      const databaseDocument = applyDatabaseDocumentMigration(doc);

      putObject(databaseDocument, {
        body: {
          data: { [itemId]: item },
        },
      });

      resolve(itemId);
    });
  });

export const updateItemMutation = (
  change: (mutation: MutationFn) => unknown,
  itemId: ItemId,
  partialItem: PartialDeep<Item>,
): Promise<void> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const databaseDocument = applyDatabaseDocumentMigration(doc);

      putObject(databaseDocument, {
        body: {
          data: { [itemId]: partialItem },
        },
      });
      resolve();
    });
  });

export const removeItemMutation = (
  change: (mutation: MutationFn) => unknown,
  itemId: ItemId,
): Promise<void> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const databaseDocument = applyDatabaseDocumentMigration(doc);

      putObject(databaseDocument, {
        body: {
          data: { [itemId]: undefined },
        },
      });
      resolve();
    });
  });
