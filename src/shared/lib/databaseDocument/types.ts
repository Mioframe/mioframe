import type { PartialDeep } from 'type-fest';
import type { AnyProperty, PropertyId } from './property';
import { zodItemId, type ItemId } from './item';
import type { TypeOf } from 'zod';
import { intersection, literal, object, record, unknown } from 'zod';
import { zodPropertiesMap } from './property/property';
import { zodPropertyId } from './property/general';
import { zodDocument } from '../documentApi';

const zodValue = unknown();

const zodItem = record(zodPropertyId, zodValue);

export type Item = TypeOf<typeof zodItem>;

const zodData = record(zodItemId, zodItem);

const zodDatabaseStateV1 = object({
  version: literal(1),
  data: zodData,
  properties: zodPropertiesMap,
});

export type DataBaseStateV1 = TypeOf<typeof zodDatabaseStateV1>;

export const zodDataBaseStateLatest = zodDatabaseStateV1;

export type DataBaseStateLatest = TypeOf<typeof zodDataBaseStateLatest>;

export const DATABASE_DOCUMENT_TYPE = 'database';

export const zodDatabaseExtentionDocument = object({
  type: literal(DATABASE_DOCUMENT_TYPE),
});

export const zodDatabaseExtentionBodyDocument = object({
  body: zodDataBaseStateLatest,
});

export const zodDatabaseDocument = intersection(
  zodDocument,
  zodDatabaseExtentionDocument,
).and(zodDatabaseExtentionBodyDocument);

export type DatabaseDocument = TypeOf<typeof zodDatabaseDocument>;

export interface DatabaseApi {
  addProperty: (property: AnyProperty) => PropertyId;
  removeProperty: (propertyId: PropertyId) => void;
  updateProperty: (
    propertyId: PropertyId,
    partialProperty: PartialDeep<AnyProperty>,
  ) => void;

  addItem: (item: Item) => ItemId;
  removeItem: (itemId: ItemId) => void;
  updateItem: (itemId: ItemId, partialItem: PartialDeep<Item>) => void;

  read: () => Promise<DatabaseDocument>;

  onChange: (fn: (doc: DatabaseDocument) => unknown) => () => void;

  // addView(): void;
  // removeView(): void;
  // updateView(): void;
}
