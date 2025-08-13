import { zodStrictDocumentId } from '@shared/lib/automerge';
import {
  zodDatabaseItemId,
  zodDatabaseViewId,
  zodGeneralProperty,
} from '@shared/lib/databaseDocument';
import type { output } from 'zod/v4-mini';
import { array, extend, literal, object, optional } from 'zod/v4-mini';

export const PROPERTY_TYPE_RELATION = 'relation';

export const zodRelation = object({
  documentId: zodStrictDocumentId,
  viewId: optional(zodDatabaseViewId),
});

export type Relation = output<typeof zodRelation>;

export const zodRelationProperty = extend(
  zodGeneralProperty(literal(PROPERTY_TYPE_RELATION)),
  {
    relation: zodRelation,
  },
);

export type RelationProperty = output<typeof zodRelationProperty>;

export const zodRelationValue = array(zodDatabaseItemId);

export type RelationValue = output<typeof zodRelationValue>;
