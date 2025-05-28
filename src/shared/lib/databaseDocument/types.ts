import type { Entries, PartialDeep } from 'type-fest';
import {
  extend,
  literal,
  object,
  partial,
  type core,
  type output,
} from 'zod/v4-mini';
import type {
  DatabaseData,
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseSortMap,
  DatabaseState,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
  DatabaseView,
  DatabaseViewId,
  DatabaseViewsMap,
} from './state';
import { zodDatabaseState } from './state';
import type { DocumentContent } from '../cfrDocument';
import { zodDocumentContent } from '../cfrDocument';
import type { ComputedRef } from 'vue';
import type { ReadonlyDeep } from 'type-fest';

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
  zodDatabaseType.shape,
);

export type DatabaseTypeDocument = output<typeof zodDatabaseTypeDocument>;

export const zodDatabaseDocumentWithContent = extend(
  zodDatabaseTypeDocument,
  partial(zodDatabaseExtensionBodyDocument).shape,
);

export type DatabaseDocumentWithContent = output<
  typeof zodDatabaseDocumentWithContent
>;

export type MutationFn = (doc: DocumentContent) => unknown;

export type UseDatabaseDocument = {
  /**
   * Всё содержимое документа
   */
  content: ComputedRef<ReadonlyDeep<DatabaseDocumentWithContent> | undefined>;

  /**
   * Перечень свойств
   */
  properties: ComputedRef<
    ReadonlyDeep<DatabaseUnknownPropertiesMap> | undefined
  >;
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
  data: ComputedRef<ReadonlyDeep<DatabaseData> | undefined>;
  addItem: (item: DatabaseItem) => Promise<DatabaseItemId>;
  removeItem: (itemId: DatabaseItemId) => Promise<void>;
  updateItem: (
    itemId: DatabaseItemId,
    partialItem: PartialDeep<DatabaseItem>,
  ) => Promise<void>;

  /**
   * Перечень представлений
   */
  view: {
    state: ComputedRef<ReadonlyDeep<DatabaseViewsMap> | undefined>;
    list: ComputedRef<ReadonlyDeep<Entries<DatabaseViewsMap> | undefined>>;
    get: (id: DatabaseViewId) => ReadonlyDeep<DatabaseView> | undefined;
    add: (view: DatabaseView) => Promise<DatabaseViewId>;
    remove: (viewId: DatabaseViewId) => Promise<void>;
    rename: (viewId: DatabaseViewId, newName: string) => Promise<void>;
    update: (
      viewId: DatabaseViewId,
      view: PartialDeep<DatabaseView>,
    ) => Promise<void>;
  };

  /**
   * Ошибки чтения документа
   */
  documentError: ComputedRef<
    core.$ZodError<DatabaseDocumentWithContent> | undefined
  >;

  /**
   * Принудительное применение миграций
   */
  forceApplyMigration: () => Promise<void>;
};
