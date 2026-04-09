import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import type { Ref } from 'vue';
import { computed } from 'vue';
import { zodRelationProperty, type Relation, type RelationProperty } from './model';
import { zodIs } from '@shared/lib/validateZodScheme';
import { useDatabaseProperty } from '@entity/databaseProperty';
import type { PatchSource } from '@shared/lib/changeObject';

export const useRelationProperty = (
  path: Ref<string>,
  documentId: Ref<AMDocumentId>,
  propertyId: Ref<DatabasePropertyId>,
) => {
  const { property, patch: patchProperty } = useDatabaseProperty(path, documentId, propertyId);

  const relationProperty = computed((): RelationProperty | undefined => {
    if (zodIs(property.value, zodRelationProperty)) {
      return property.value;
    }

    return undefined;
  });

  const patch = async (relation: PatchSource<Relation>) => {
    await patchProperty<RelationProperty>({
      relation,
    });
  };

  return {
    property: relationProperty,
    patch,
  };
};
