import {
  zodDatabaseItemId,
  zodDatabaseViewId,
  zodGeneralProperty,
} from '@shared/lib/databaseDocument';
import { zodDocumentId } from '@shared/lib/fsStorageAdapter';
import type { output } from 'zod/v4-mini';
import { object, extend, literal, array } from 'zod/v4-mini';

const zodRelation = object({
  documentId: zodDocumentId,
  viewId: zodDatabaseViewId,
});

export type Relation = output<typeof zodRelation>;

const zodRelationProperty = extend(zodGeneralProperty(literal('relation')), {
  relation: zodRelation,
});

export type RelationProperty = output<typeof zodRelationProperty>;

const zodRelationValue = array(zodDatabaseItemId);
