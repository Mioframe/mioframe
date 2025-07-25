import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue';
import {
  zodRelationProperty,
  type Relation,
  type RelationProperty,
} from './model';
import { zodIs } from '@shared/lib/validateZodScheme';

export const useRelationProperty = (
  rawDocHandle: MaybeRefOrGetter<AMDocHandle | undefined>,
  rawPropertyId: MaybeRefOrGetter<DatabasePropertyId | undefined>,
) => {
  const docHandle = computed(() => toValue(rawDocHandle));
  const propertyId = computed(() => toValue(rawPropertyId));

  const properties = useDatabasePropertiesMap(docHandle);

  const property = computed((): RelationProperty | undefined => {
    const id = toValue(propertyId);

    if (id) {
      const property = properties.get(id);

      if (zodIs(property, zodRelationProperty)) {
        return property;
      }
    }

    return undefined;
  });

  const update = async (relation: Partial<Relation>) => {
    const id = toValue(propertyId);

    if (id) {
      await properties.put<RelationProperty>(id, {
        relation,
      });
    }
  };

  return reactive({
    property,
    update,
  });
};
