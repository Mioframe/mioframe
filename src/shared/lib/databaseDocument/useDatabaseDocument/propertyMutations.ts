import { generatePropertyId } from '../state/v1/property/general';
import { putObject } from '@shared/lib/changeObject';
import type { PartialDeep } from 'type-fest';
import type {
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
  DatabaseUnknownProperty,
} from '../state';

export const addPropertyMutation = (
  properties: DatabaseUnknownPropertiesMap,
  column: DatabaseUnknownProperty,
): DatabasePropertyId => {
  const columnId = generatePropertyId();

  putObject(properties, {
    [columnId]: column,
  });

  return columnId;
};

export const updatePropertyMutation = (
  properties: DatabaseUnknownPropertiesMap,
  columnId: DatabasePropertyId,
  column: PartialDeep<DatabaseUnknownProperty>,
): void => {
  putObject(properties, { [columnId]: column });
};

export const removePropertyMutation = (
  properties: DatabaseUnknownPropertiesMap,
  propertyId: DatabasePropertyId,
): void => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- automerge recommended
  delete properties[propertyId];

  // todo: добавить параметр очистки data от значений
};
