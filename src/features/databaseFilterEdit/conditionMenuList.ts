import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabaseNestedFilter,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import {
  LOGICAL_FILTER_OPERATOR,
  UNARY_FILTER_OPERATOR,
  useDatabasePropertiesMap,
} from '@shared/lib/databaseDocument';
import { defineMenuButtonList } from '@shared/ui/Menu';
import type { Ref } from 'vue';
import { computed } from 'vue';
import { OPERATOR_LABEL } from './types';

export const useConditionMenu = ({
  docHandle,
  filter,
  propertyId,
  disableProperties,
}: {
  docHandle: Ref<AMDocHandle>;
  filter?: Ref<DatabaseNestedFilter | undefined>;
  propertyId?: Ref<DatabasePropertyId | undefined>;
  disableProperties?: Ref<boolean>;
}) => {
  const properties = useDatabasePropertiesMap(docHandle);

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
      const entries = properties.entries;
      if (entries) {
        return defineMenuButtonList(
          entries.map(([id, { name }]) => ({
            key: id,
            label: name,
            submenu: createUnaryConditionMenu(id),
          })),
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
