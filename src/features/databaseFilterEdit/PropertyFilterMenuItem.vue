<script setup lang="ts">
import { DatabasePropertyMenuItem } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  LOGICAL_FILTER_OPERATOR,
  UNARY_FILTER_OPERATOR,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import UnaryOperatorFilterMenuItem from './UnaryOperatorFilterMenuItem.vue';
import LogicalOperatorFilterMenuItem from './LogicalOperatorFilterMenuItem.vue';

defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const emit = defineEmits<{
  clickUnary: [
    {
      operator: UNARY_FILTER_OPERATOR;
      parentOperators?: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
    },
  ];
}>();

const onClickUnaryOperator = (operator: UNARY_FILTER_OPERATOR) => {
  emit('clickUnary', {
    operator,
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
  emit('clickUnary', {
    operator,
    parentOperators: [logicalOperator, ...parentOperators],
  });
};
</script>

<template>
  <DatabasePropertyMenuItem
    :path="path"
    :document-id="documentId"
    :property-id="propertyId"
  >
    <template #submenu>
      <UnaryOperatorFilterMenuItem
        v-for="operator in UNARY_FILTER_OPERATOR"
        :key="operator"
        :operator="operator"
        @click="onClickUnaryOperator(operator)"
      />

      <LogicalOperatorFilterMenuItem
        v-for="operator in LOGICAL_FILTER_OPERATOR"
        :key="operator"
        :operator="operator"
        :path="path"
        :document-id="documentId"
        :property-id="propertyId"
        @click-unary="onClickUnaryInLogical($event, operator)"
      />
    </template>
  </DatabasePropertyMenuItem>
</template>
