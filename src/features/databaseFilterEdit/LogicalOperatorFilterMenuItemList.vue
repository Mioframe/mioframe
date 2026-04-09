<script setup lang="ts">
import type { DatabasePropertyId, UNARY_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import { LOGICAL_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import LogicalOperatorFilterMenuItem from './LogicalOperatorFilterMenuItem.vue';
import type { AMDocumentId } from '@shared/lib/automerge';

defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId?: DatabasePropertyId;
}>();

const emit = defineEmits<{
  clickUnary: [
    {
      operator: UNARY_FILTER_OPERATOR;
      parentOperators?: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
    },
  ];
}>();

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
  <LogicalOperatorFilterMenuItem
    v-for="operator in LOGICAL_FILTER_OPERATOR"
    :key="operator"
    :operator="operator"
    :directory-path="path"
    :document-id="documentId"
    :property-id="propertyId"
    @click-unary="(e) => onClickUnaryInLogical(e, operator)"
  />
</template>
