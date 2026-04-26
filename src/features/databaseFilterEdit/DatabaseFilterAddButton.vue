<script setup lang="ts">
import { useDatabaseProperties, useDatabaseProperty } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDButton, MDIconButton } from '@shared/ui/Button';
import { MDMenuBase } from '@shared/ui/Menu';
import type { MaybeElement } from '@vueuse/core';
import { computed, shallowRef, toRefs, useTemplateRef } from 'vue';
import PropertyFilterMenuItem from './PropertyFilterMenuItem.vue';
import type { DatabasePropertyId, UNARY_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import { LOGICAL_FILTER_OPERATOR, zodDatabasePropertyId } from '@shared/lib/databaseDocument';
import type { FilterPath } from './types';
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDSymbol } from '@shared/ui/Icon';
import LogicalOperatorFilterMenuItemList from './LogicalOperatorFilterMenuItemList.vue';
import UnaryOperatorFilterMenuItemList from './UnaryOperatorFilterMenuItemList.vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  filterPath: FilterPath;
}>();

const emit = defineEmits<{
  clickUnary: [
    {
      operator: UNARY_FILTER_OPERATOR;
      parentOperators?: FilterPath;
    },
  ];
}>();

const { directoryPath, documentId, filterPath } = toRefs(props);

const addButtonEl = useTemplateRef<MaybeElement>('addButton');

const showMenu = shallowRef(false);

const onClickAdd = () => {
  showMenu.value = true;
};

const { propertiesIdList } = useDatabaseProperties(directoryPath, documentId);

const onClickUnary = ({
  operator,
  parentOperators = [],
}: {
  operator: UNARY_FILTER_OPERATOR;
  parentOperators?: FilterPath;
}) => {
  emit('clickUnary', {
    operator,
    parentOperators: [...filterPath.value, ...parentOperators],
  });
  showMenu.value = false;
};

const onClickUnaryInProperty = (
  {
    operator,
    parentOperators = [],
  }: {
    operator: UNARY_FILTER_OPERATOR;
    parentOperators?: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
  },
  property: DatabasePropertyId,
) => {
  onClickUnary({
    operator,
    parentOperators: [property, ...parentOperators],
  });
};

const operator = computed(() => filterPath.value.at(-1));

const tooltip = computed(() => {
  // todo: переписать для бОльшей информативности
  if (operator.value === LOGICAL_FILTER_OPERATOR.$or) {
    return 'or';
  }

  return 'and';
});

const parentPropertyId = computed(() =>
  filterPath.value.find((v) => zodIs(v, zodDatabasePropertyId)),
);

const { property: parentProperty } = useDatabaseProperty(
  directoryPath,
  documentId,
  parentPropertyId,
);

const label = computed(() => {
  if (parentProperty.value) {
    return parentProperty.value.name;
  }
  return 'add';
});
</script>

<template>
  <MDButton
    v-if="parentPropertyId"
    ref="addButton"
    :label="label"
    size="extra-small"
    shape="round"
    color="outlined"
    @click="onClickAdd"
  >
    <template #icon>
      <MDSymbol name="add" />
    </template>
  </MDButton>

  <MDIconButton
    v-else
    ref="addButton"
    :tooltip="tooltip"
    size="extra-small"
    shape="round"
    md-symbol-name="add"
    color="outlined"
    @click="onClickAdd"
  />

  <MDMenuBase v-if="propertiesIdList" v-model:show="showMenu" :target="addButtonEl">
    <LogicalOperatorFilterMenuItemList
      :path="directoryPath"
      :document-id="documentId"
      :property-id="parentPropertyId"
      @click-unary="onClickUnary"
    />

    <UnaryOperatorFilterMenuItemList v-if="parentPropertyId" @click-unary="onClickUnary" />

    <template v-if="!parentPropertyId">
      <template v-for="propertyId in propertiesIdList" :key="propertyId">
        <PropertyFilterMenuItem
          :path="directoryPath"
          :document-id="documentId"
          :property-id="propertyId"
          @click-unary="($event) => onClickUnaryInProperty($event, propertyId)"
        />
      </template>
    </template>
  </MDMenuBase>
</template>
