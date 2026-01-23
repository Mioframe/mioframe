<script setup lang="ts">
import { useDatabaseProperties } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDMenuBase } from '@shared/ui/Menu';
import type { MaybeElement } from '@vueuse/core';
import { shallowRef, toRefs, useTemplateRef } from 'vue';
import PropertyFilterMenuItem from './PropertyFilterMenuItem.vue';
import LogicalOperatorFilterMenuItem from './LogicalOperatorFilterMenuItem.vue';
import type {
  DatabasePropertyId,
  UNARY_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument';
import { LOGICAL_FILTER_OPERATOR } from '@shared/lib/databaseDocument';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
}>();

const { path, documentId } = toRefs(props);

const emit = defineEmits<{
  clickUnary: [
    {
      operator: UNARY_FILTER_OPERATOR;
      parentOperators: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
    },
  ];
}>();

const addButton = useTemplateRef<MaybeElement>('addButton');

const showMenu = shallowRef(false);

const onClickAdd = () => {
  showMenu.value = true;
};

const { propertiesIdList } = useDatabaseProperties(path, documentId);

const onClickUnary = ({
  operator,
  parentOperators,
}: {
  operator: UNARY_FILTER_OPERATOR;
  parentOperators: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
}) => {
  emit('clickUnary', {
    operator,
    parentOperators,
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

const onClickUnaryInLogical = (
  {
    operator,
    parentOperators = [],
  }: {
    operator: UNARY_FILTER_OPERATOR;
    parentOperators?: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
  },
  logicalOperator: LOGICAL_FILTER_OPERATOR,
) => {
  onClickUnary({
    operator,
    parentOperators: [logicalOperator, ...parentOperators],
  });
};
</script>

<template>
  <MDButton
    ref="addButton"
    label="add filter"
    size="extra-small"
    @click="onClickAdd"
  >
    <template #icon>
      <MDSymbol name="add" />
    </template>
  </MDButton>

  <MDMenuBase
    v-if="propertiesIdList"
    v-model:show="showMenu"
    :target="addButton"
  >
    <LogicalOperatorFilterMenuItem
      v-for="operator in LOGICAL_FILTER_OPERATOR"
      :key="operator"
      :operator="operator"
      :path="path"
      :document-id="documentId"
      @click-unary="onClickUnaryInLogical($event, operator)"
    />

    <template v-for="propertyId in propertiesIdList" :key="propertyId">
      <PropertyFilterMenuItem
        :path="path"
        :document-id="documentId"
        :property-id="propertyId"
        @click-unary="onClickUnaryInProperty($event, propertyId)"
      />
    </template>
  </MDMenuBase>
</template>
