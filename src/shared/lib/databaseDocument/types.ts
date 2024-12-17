import type { PartialDeep } from 'type-fest';
import type { TypeOf } from 'zod';
import { literal, object } from 'zod';
import type { UnknownProperty, PropertyId, PropertiesMap } from './property';
import type { ViewsMap } from './versions';
import { zodDataBaseStateLatest } from './versions';
import type { SortDescription, View, ViewId } from './view';
import type { DatabaseData, Item, ItemId } from './item';
import type { DocumentContent } from '../cfrDocument';
import { zodDocumentContent } from '../cfrDocument';
import type { ComputedRef } from 'vue';

export type DataBaseStateLatest = TypeOf<typeof zodDataBaseStateLatest>;

export const DATABASE_DOCUMENT_TYPE = 'database';

export const zodDatabaseType = object({
  type: literal(DATABASE_DOCUMENT_TYPE),
});

export const zodDatabaseExtensionBodyDocument = object({
  body: zodDataBaseStateLatest, // todo: может сменить body на другое свойство? отдельное свойство для db
});

export const zodDatabaseTypeDocument =
  zodDocumentContent.merge(zodDatabaseType);

export type DatabaseTypeDocument = TypeOf<typeof zodDatabaseTypeDocument>;

export const zodDatabaseDocumentWithContent = zodDatabaseTypeDocument.merge(
  zodDatabaseExtensionBodyDocument.partial(),
);

export type DatabaseDocumentWithContent = TypeOf<
  typeof zodDatabaseDocumentWithContent
>;

export type MutationFn = (doc: DocumentContent) => unknown;

export interface DatabaseDocument {
  /**
   * Всё содержимое документа
   */
  content: ComputedRef<DatabaseDocumentWithContent | undefined>;
  /**
   * Перечень свойств
   */
  properties: ComputedRef<PropertiesMap | undefined>;
  /**
   * Перечень представлений
   */
  views: ComputedRef<ViewsMap | undefined>;
  /**
   * Перечень данных
   */
  data: ComputedRef<DatabaseData | undefined>;

  addProperty: (property: UnknownProperty) => Promise<PropertyId>;
  removeProperty: (propertyId: PropertyId) => Promise<void>;
  updateProperty: (
    propertyId: PropertyId,
    partialProperty: PartialDeep<UnknownProperty>,
  ) => Promise<void>;

  addItem: (item: Item) => Promise<ItemId>;
  removeItem: (itemId: ItemId) => Promise<void>;
  updateItem: (itemId: ItemId, partialItem: PartialDeep<Item>) => Promise<void>;

  addView: (view: View) => Promise<ViewId>;
  removeView: (viewId: ViewId) => Promise<void>;
  renameView: (viewId: ViewId, newName: string) => Promise<void>;

  addSortDescription: (
    viewId: ViewId,
    sortDescription: SortDescription,
  ) => Promise<void>;
  toggleSortDirection: (
    viewId: ViewId,
    propertyId: PropertyId,
  ) => Promise<void>;
}
