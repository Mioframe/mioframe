import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  zodRelationProperty,
  type Relation,
  type RelationProperty,
} from './model';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { EntryPath } from '@shared/lib/fileSystem';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import type { PartialDeep } from 'type-fest';

export const useRelationProperty = (
  rawDirectoryPath: MaybeRefOrGetter<EntryPath | undefined>,
  rawDocumentId: MaybeRefOrGetter<AMDocumentId | undefined>,
  rawPropertyId: MaybeRefOrGetter<DatabasePropertyId | undefined>,
) => {
  const directoryPath = computed(() => toValue(rawDirectoryPath));
  const documentId = computed(() => toValue(rawDocumentId));
  const propertyId = computed(() => toValue(rawPropertyId));

  const {
    getProperty: { get: getProperty },
    patch: patchProperty,
  } = useDatabasePropertiesClient();

  const relationProperty = computed((): RelationProperty | undefined => {
    if (directoryPath.value && documentId.value && propertyId.value) {
      const property = getProperty(
        directoryPath.value,
        documentId.value,
        propertyId.value,
      );

      if (zodIs(property, zodRelationProperty)) {
        return property;
      }
    }

    return undefined;
  });

  const patch = async (relation: PartialDeep<Relation>) => {
    if (directoryPath.value && documentId.value && propertyId.value) {
      await patchProperty<RelationProperty>(
        directoryPath.value,
        documentId.value,
        propertyId.value,
        {
          relation,
        },
      );
    }
  };

  return {
    property: relationProperty,
    patch,
  };
};
