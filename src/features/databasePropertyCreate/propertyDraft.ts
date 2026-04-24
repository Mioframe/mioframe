import { zodBooleanProperty } from '@entity/databaseBoolean';
import { zodDateProperty } from '@entity/databaseDate';
import { zodNumberProperty } from '@entity/databaseNumber';
import { zodRelationProperty, type Relation } from '@entity/databaseRelation';
import { zodStringProperty } from '@entity/databaseString';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodDatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { PartialDeep } from 'type-fest';

export type PropertyDraft = PartialDeep<Omit<DatabaseUnknownProperty, 'name' | 'type'>> & {
  name?: string | undefined;
  relation?: Relation | undefined;
  type?: DatabaseUnknownProperty['type'] | undefined;
};

export const getDraftProperty = (
  propertyDraft: PropertyDraft,
): DatabaseUnknownProperty | undefined =>
  zodIs(propertyDraft, zodDatabaseUnknownProperty) ? propertyDraft : undefined;

export const getCreatableProperty = (
  propertyDraft: PropertyDraft,
): DatabaseUnknownProperty | undefined => {
  const property = getDraftProperty(propertyDraft);

  if (
    zodIs(property, zodStringProperty) ||
    zodIs(property, zodNumberProperty) ||
    zodIs(property, zodBooleanProperty) ||
    zodIs(property, zodDateProperty) ||
    zodIs(property, zodRelationProperty)
  ) {
    return property;
  }

  return undefined;
};
