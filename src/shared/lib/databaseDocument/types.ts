import type { PartialDeep } from 'type-fest';
import type { output } from '@zod/mini';
import { extend, partial } from '@zod/mini';
import { literal, object } from '@zod/mini';
import type {
  DatabaseData,
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseState,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
  DatabaseView,
  DatabaseViewId,
} from './state';
import { zodDatabaseState } from './state';
import type { DocumentContent } from '../cfrDocument';
import { zodDocumentContent } from '../cfrDocument';
import type { ComputedRef } from 'vue';
import type { ReadonlyMapDeep } from 'type-fest/source/readonly-deep';

export type DataBaseStateLatest = DatabaseState;

export const DATABASE_DOCUMENT_TYPE = 'database';

export const zodDatabaseType = object({
  type: literal(DATABASE_DOCUMENT_TYPE),
});

export const zodDatabaseExtensionBodyDocument = object({
  body: zodDatabaseState, // todo: может сменить body на другое свойство? отдельное свойство для db
});

export const zodDatabaseTypeDocument = extend(
  zodDocumentContent,
  zodDatabaseType,
);

export type DatabaseTypeDocument = output<typeof zodDatabaseTypeDocument>;

export const zodDatabaseDocumentWithContent = extend(
  zodDatabaseTypeDocument,
  partial(zodDatabaseExtensionBodyDocument),
);

export type DatabaseDocumentWithContent = output<
  typeof zodDatabaseDocumentWithContent
>;

export type MutationFn = (doc: DocumentContent) => unknown;

export type UseDatabaseDocument = {
  /**
   * Всё содержимое документа
   */
  content: ComputedRef<DatabaseDocumentWithContent | undefined>;

  /**
   * Перечень свойств
   */
  properties: ComputedRef<DatabaseUnknownPropertiesMap | undefined>;
  addProperty: (
    property: DatabaseUnknownProperty,
  ) => Promise<DatabasePropertyId>;
  removeProperty: (propertyId: DatabasePropertyId) => Promise<void>;
  updateProperty: (
    propertyId: DatabasePropertyId,
    partialProperty: PartialDeep<DatabaseUnknownProperty>,
  ) => Promise<void>;

  /**
   * Перечень данных
   */
  data: ComputedRef<DatabaseData | undefined>;
  addItem: (item: DatabaseItem) => Promise<DatabaseItemId>;
  removeItem: (itemId: DatabaseItemId) => Promise<void>;
  updateItem: (
    itemId: DatabaseItemId,
    partialItem: PartialDeep<DatabaseItem>,
  ) => Promise<void>;

  /**
   * Перечень представлений
   */
  views: ComputedRef<ReadonlyMapDeep<DatabaseViewId, DatabaseView>>;
  addView: (view: DatabaseView) => Promise<DatabaseViewId>;
  removeView: (viewId: DatabaseViewId) => Promise<void>;
  renameView: (viewId: DatabaseViewId, newName: string) => Promise<void>;
  updateView: (
    viewId: DatabaseViewId,
    view: PartialDeep<DatabaseView>,
  ) => Promise<void>;

  addSortDescription: (
    viewId: DatabaseViewId,
    sortDescription: DatabaseSortDescription,
  ) => Promise<void>;
  toggleSortDirection: (
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
  ) => Promise<void>;
};
