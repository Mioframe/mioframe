import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseNestedFilter,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import {
  LOGICAL_FILTER_OPERATOR,
  UNARY_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument';
import { defineMenuButtonList } from '@shared/ui/Menu';
import type { Ref } from 'vue';
import { computed } from 'vue';
import { OPERATOR_LABEL } from './types';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import type { EntryPath } from '@shared/lib/fileSystem';
import { DomainError } from '@shared/lib/error';
import { strictRecordIterableEntries } from '@shared/lib/strictRecord';

export const useConditionMenu = ({
  directoryPath,
  documentId,
  filter,
  propertyId,
  disableProperties,
}: {
  directoryPath: Ref<EntryPath>;
  documentId: Ref<AMDocumentId>;
  filter?: Ref<DatabaseNestedFilter | undefined>;
  propertyId?: Ref<DatabasePropertyId | undefined>;
  disableProperties?: Ref<boolean>;
}) => {
  const { getDatabaseProperties } = useDatabasePropertiesClient();

  const createUnaryConditionMenu = (propertyId: DatabasePropertyId) =>
    defineMenuButtonList(
      Object.values(UNARY_FILTER_OPERATOR).map((operator) => ({
        key: operator,
        propertyId,
        label: OPERATOR_LABEL[operator],
      })),
    );

  const logicalConditionMenu = defineMenuButtonList([
    {
      key: LOGICAL_FILTER_OPERATOR.$and,
      label: OPERATOR_LABEL[LOGICAL_FILTER_OPERATOR.$and],
    },
    {
      key: LOGICAL_FILTER_OPERATOR.$or,
      label: OPERATOR_LABEL[LOGICAL_FILTER_OPERATOR.$or],
    },
  ]);

  const propertiesMenu = computed(() => {
    if (!disableProperties?.value) {
      const properties = getDatabaseProperties(
        directoryPath.value,
        documentId.value,
      );
      if (properties && !(properties instanceof DomainError)) {
        return defineMenuButtonList(
          Array.from(strictRecordIterableEntries(properties)()).map(
            ([id, { name }]) => ({
              key: id,
              label: name,
              submenu: createUnaryConditionMenu(id),
            }),
          ),
        );
      }
    }
    return [];
  });

  const conditionMenu = computed(() => {
    return [
      ...propertiesMenu.value,
      ...(propertyId?.value ? createUnaryConditionMenu(propertyId.value) : []),
      ...(!disableProperties?.value ? logicalConditionMenu : []),
    ].filter(({ key }) => !filter?.value || !(key in filter.value));
  });

  return conditionMenu;
};
