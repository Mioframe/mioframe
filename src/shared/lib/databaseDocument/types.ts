import type { PartialDeep } from 'type-fest';
import type { TypeOf } from 'zod';
import { literal, object } from 'zod';
import type { UnknownProperty, PropertyId, PropertiesMap } from './property';
import type { ViewsMap } from './versions';
import { zodDataBaseStateLatest } from './versions';
import type { View, ViewId } from './view';
import type { DatabaseData, Item, ItemId } from './item';
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

  addProperty: (property: UnknownProperty) => PropertyId;
  removeProperty: (propertyId: PropertyId) => void;
  updateProperty: (
    propertyId: PropertyId,
    partialProperty: PartialDeep<UnknownProperty>,
  ) => void;

  addItem: (item: Item) => ItemId;
  removeItem: (itemId: ItemId) => void;
  updateItem: (itemId: ItemId, partialItem: PartialDeep<Item>) => void;

  addView: (view: View) => ViewId;
  removeView: (viewId: ViewId) => void;
  // updateView(): void;
}
