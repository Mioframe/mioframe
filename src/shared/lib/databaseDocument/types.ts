import type { PartialDeep } from 'type-fest';
import type { TypeOf } from 'zod';
import { intersection, literal, object } from 'zod';
import type { UnknownProperty, PropertyId } from './property';
import { zodDataBaseStateLatest } from './versions';
import type { View, ViewId } from './view';
import type { Item, ItemId } from './item';
import { zodDocumentContent } from '../cfrDocument';

export type DataBaseStateLatest = TypeOf<typeof zodDataBaseStateLatest>;

export const DATABASE_DOCUMENT_TYPE = 'database';

export const zodDatabaseType = object({
  type: literal(DATABASE_DOCUMENT_TYPE),
});

export const zodDatabaseExtensionBodyDocument = object({
  body: zodDataBaseStateLatest,
});

export const zodDatabaseTypeDocument = intersection(
  zodDocumentContent,
  zodDatabaseType,
);

export type DatabaseTypeDocument = TypeOf<typeof zodDatabaseTypeDocument>;

export const zodDatabaseDocumentContent = intersection(
  zodDatabaseTypeDocument,
  zodDatabaseExtensionBodyDocument,
);

export type DatabaseDocumentContent = TypeOf<typeof zodDatabaseDocumentContent>;

export interface DatabaseDocument {
  addProperty: (property: UnknownProperty) => PropertyId;
  removeProperty: (propertyId: PropertyId) => void;
  updateProperty: (
    propertyId: PropertyId,
    partialProperty: PartialDeep<UnknownProperty>,
  ) => void;

  addItem: (item: Item) => ItemId;
  removeItem: (itemId: ItemId) => void;
  updateItem: (itemId: ItemId, partialItem: PartialDeep<Item>) => void;

  read: () => Promise<DatabaseDocumentContent>;

  onChange: (fn: (doc: DatabaseDocumentContent) => unknown) => () => void;

  addView: (view: View) => ViewId;
  // removeView(): void;
  // updateView(): void;
}
