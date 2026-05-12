import type { Relation } from '@entity/databaseRelation';
import type { DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodDatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { PartialDeep } from 'type-fest';
import { getDatabasePropertyCreateDescriptor } from './databasePropertyCreateDescriptors';

export type PropertyDraft = PartialDeep<Omit<DatabaseUnknownProperty, 'name' | 'type'>> & {
  name?: string | undefined;
  relation?: Relation | undefined;
  type?: DatabaseUnknownProperty['type'] | undefined;
};

export type PropertyDraftFactory = (name: string) => DatabaseUnknownProperty;

/**
 * Recreates the draft for a newly selected type while preserving the current name.
 * @param propertyDraft
 * @param createDraftProperty
 */
export const getTypeSwitchedPropertyDraft = (
  propertyDraft: PropertyDraft,
  createDraftProperty: PropertyDraftFactory,
): PropertyDraft => {
  const previousName = propertyDraft.name ?? '';

  return createDraftProperty(previousName);
};

/**
 * Returns a draft that matches the generic property contract used by the dialog.
 * @param propertyDraft
 */
export const getDraftProperty = (
  propertyDraft: PropertyDraft,
): DatabaseUnknownProperty | undefined =>
  zodIs(propertyDraft, zodDatabaseUnknownProperty) ? propertyDraft : undefined;

/**
 * Returns a property only when the current draft matches a creatable property descriptor schema.
 * @param propertyDraft
 */
export const getCreatableProperty = (
  propertyDraft: PropertyDraft,
): DatabaseUnknownProperty | undefined => {
  const property = getDraftProperty(propertyDraft);

  if (!property) {
    return undefined;
  }

  const descriptor = getDatabasePropertyCreateDescriptor(property.type);

  return descriptor && zodIs(property, descriptor.schema) ? property : undefined;
};
