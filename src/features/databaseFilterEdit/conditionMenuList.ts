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
import { useDatabaseProperties } from '@entity/databaseProperty';

/**
 * @deprecated сделать меню асинхронным на компонентах, не строить список кнопок заранее
 * @param param0
 * @returns
 */
export const useConditionMenu = ({
  directoryPath,
  documentId,
  filter,
  propertyId,
  disableProperties,
}: {
  directoryPath: Ref<string>;
  documentId: Ref<AMDocumentId>;
  filter?: Ref<DatabaseNestedFilter | undefined>;
  propertyId?: Ref<DatabasePropertyId | undefined>;
  disableProperties?: Ref<boolean>;
}) => {
  const { propertiesIdList: properties } = useDatabaseProperties(directoryPath, documentId);

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
      if (properties.value) {
        return defineMenuButtonList(
          properties.value.map(([id, { name }]) => ({
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
