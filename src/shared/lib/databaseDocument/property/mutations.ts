import type { PropertyId } from './general';
import { generatePropertyId } from './general';
import type { UnknownProperty } from './property';
import { is } from '@shared/lib/validateZodScheme';
import type { MutationFn } from '../types';
import { zodDatabaseTypeDocument } from '../types';
import { applyDatabaseDocumentMigration } from '../migrations';
import { putObject } from '@shared/lib/changeObject';
import type { PartialDeep } from 'type-fest';

export const addPropertyMutation = (
  change: (mutation: MutationFn) => unknown,
  column: UnknownProperty,
): Promise<PropertyId> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      const columnId = generatePropertyId();

      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const databaseDocument = applyDatabaseDocumentMigration(doc);
      putObject(databaseDocument, {
        body: {
          properties: {
            [columnId]: column,
          },
        },
      });
      resolve(columnId);
      return;
    });
  });

export const updatePropertyMutation = (
  change: (mutation: MutationFn) => unknown,
  columnId: PropertyId,
  column: PartialDeep<UnknownProperty>,
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
          properties: { [columnId]: column },
        },
      });
      resolve();
    });
  });

export const removePropertyMutation = (
  change: (mutation: MutationFn) => unknown,
  propertyId: PropertyId,
): Promise<void> =>
  new Promise((resolve, reject) => {
    change((doc) => {
      if (!is(doc, zodDatabaseTypeDocument)) {
        reject(new Error('document is not DatabaseTypeDocument'));
        return;
      }

      const databaseDocument = applyDatabaseDocumentMigration(doc);

      delete databaseDocument.body?.properties[propertyId];

      // todo: добавить параметр очистки data от значений
      resolve();
    });
  });
