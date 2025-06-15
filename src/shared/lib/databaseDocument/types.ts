import type { PartialDeep } from 'type-fest';
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
  DatabaseState,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
  DatabaseView,
  DatabaseViewId,
  DatabaseViewsMap,
} from './state';
export * from './state';
import { zodDatabaseState } from './state';
import type { DocumentContent } from '../cfrDocument';
import { zodDocumentContent } from '../cfrDocument';
import type { ComputedRef } from 'vue';
import type { RecordEntries } from '../objectEntries';

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
  view: {
    state: ComputedRef<DatabaseViewsMap | undefined>;
    list: ComputedRef<Readonly<RecordEntries<DatabaseViewsMap>> | undefined>;
    get: (id: DatabaseViewId) => DatabaseView | undefined;
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
