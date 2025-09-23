import { generatePropertyId } from '../migrations/versions/v1/property/general';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import type { PartialDeep } from 'type-fest';
import type {
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '../migrations/versions';

export const addPropertyMutation = (
  properties: DatabaseUnknownPropertiesMap,
  column: DatabaseUnknownProperty,
): DatabasePropertyId => {
  const columnId = generatePropertyId();

  deepPatchJsonObject(properties, {
    [columnId]: column,
  });

  return columnId;
};

export const updatePropertyMutation = (
  properties: DatabaseUnknownPropertiesMap,
  columnId: DatabasePropertyId,
  column: PartialDeep<DatabaseUnknownProperty>,
): void => {
  deepPatchJsonObject(properties, { [columnId]: column });
};

export const removePropertyMutation = (
  properties: DatabaseUnknownPropertiesMap,
  propertyId: DatabasePropertyId,
): void => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- automerge recommended
  delete properties[propertyId];

  // todo: добавить параметр очистки data от значений
};
