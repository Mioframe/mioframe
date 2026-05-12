import {
  PROPERTY_TYPE_BOOLEAN,
  createBooleanProperty,
  zodBooleanProperty,
} from '@entity/databaseBoolean';
import { PROPERTY_TYPE_DATE, createDateProperty, zodDateProperty } from '@entity/databaseDate';
import {
  PROPERTY_TYPE_NUMBER,
  createNumberProperty,
  zodNumberProperty,
} from '@entity/databaseNumber';
import {
  PROPERTY_TYPE_RELATION,
  createRelationProperty,
  zodRelationProperty,
} from '@entity/databaseRelation';
import {
  PROPERTY_TYPE_STRING,
  createStringProperty,
  zodStringProperty,
} from '@entity/databaseString';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import type { ZodMiniType } from 'zod/v4-mini';

/**
 * Feature-local create-flow config for database property creation.
 */
export interface DatabasePropertyCreateDescriptor {
  type: DatabaseUnknownProperty['type'];
  label: string;
  schema: ZodMiniType<DatabaseUnknownProperty>;
  createDraftProperty: (name: string) => DatabaseUnknownProperty;
}

/**
 * Creatable property kinds available in the property creation dialog.
 */
export const databasePropertyCreateDescriptors: DatabasePropertyCreateDescriptor[] = [
  {
    createDraftProperty: createStringProperty,
    label: 'string',
    schema: zodStringProperty,
    type: PROPERTY_TYPE_STRING,
  },
  {
    createDraftProperty: createNumberProperty,
    label: 'number',
    schema: zodNumberProperty,
    type: PROPERTY_TYPE_NUMBER,
  },
  {
    createDraftProperty: createBooleanProperty,
    label: 'boolean',
    schema: zodBooleanProperty,
    type: PROPERTY_TYPE_BOOLEAN,
  },
  {
    createDraftProperty: createDateProperty,
    label: 'date',
    schema: zodDateProperty,
    type: PROPERTY_TYPE_DATE,
  },
  {
    createDraftProperty: createRelationProperty,
    label: 'relation',
    schema: zodRelationProperty,
    type: PROPERTY_TYPE_RELATION,
  },
];

/**
 * Finds the create-flow descriptor for a property type.
 * @param type
 */
export const getDatabasePropertyCreateDescriptor = (
  type: DatabaseUnknownProperty['type'] | undefined,
): DatabasePropertyCreateDescriptor | undefined =>
  databasePropertyCreateDescriptors.find((descriptor) => descriptor.type === type);

/**
 * Returns the default create-flow descriptor used to initialize the dialog state.
 */
export const getDefaultDatabasePropertyCreateDescriptor = (): DatabasePropertyCreateDescriptor => {
  const descriptor = databasePropertyCreateDescriptors[0];

  if (!descriptor) {
    throw new Error('databasePropertyCreateDescriptors must define at least one property type');
  }

  return descriptor;
};
