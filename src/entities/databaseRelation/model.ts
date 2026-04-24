import { zodDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import {
  createProperty,
  zodDatabaseItemId,
  zodDatabaseViewId,
  zodGeneralProperty,
} from '@shared/lib/databaseDocument';
import type { output } from 'zod/v4-mini';
import { array, extend, literal, object, optional } from 'zod/v4-mini';

export const PROPERTY_TYPE_RELATION = 'relation';

export const zodRelation = object({
  documentId: zodDocumentId,
  viewId: optional(zodDatabaseViewId),
});

export type Relation = output<typeof zodRelation>;

export const zodRelationProperty = extend(zodGeneralProperty(literal(PROPERTY_TYPE_RELATION)), {
  relation: zodRelation,
});

export type RelationProperty = output<typeof zodRelationProperty>;

export type RelationDraftProperty = Omit<DatabaseUnknownProperty, 'type'> & {
  type: typeof PROPERTY_TYPE_RELATION;
  relation?: Relation | undefined;
};

export const isRelationDraftProperty = (
  property: DatabaseUnknownProperty,
): property is RelationDraftProperty => property.type === PROPERTY_TYPE_RELATION;

export const zodRelationValue = array(zodDatabaseItemId);

export type RelationValue = output<typeof zodRelationValue>;

export type ParentRelation = Record<DatabasePropertyId, RelationValue>;

export const createRelationProperty = (name: string) =>
  createProperty(PROPERTY_TYPE_RELATION, name);
