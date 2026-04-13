<script setup lang="ts">
import { DatabasePropertyMenuItem } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { UNARY_FILTER_OPERATOR, LOGICAL_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument';
import UnaryOperatorFilterMenuItemList from './UnaryOperatorFilterMenuItemList.vue';
import LogicalOperatorFilterMenuItemList from './LogicalOperatorFilterMenuItemList.vue';

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

const onClickUnary = (e: {
  operator: UNARY_FILTER_OPERATOR;
  parentOperators?: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
}) => {
  emit('clickUnary', e);
};
</script>

<template>
  <DatabasePropertyMenuItem
    :path="path"
    :document-id="documentId"
    :property-id="propertyId"
    role="menuitem"
  >
    <template #submenu>
      <UnaryOperatorFilterMenuItemList @click-unary="onClickUnary" />

      <LogicalOperatorFilterMenuItemList
        :path="path"
        :document-id="documentId"
        :property-id="propertyId"
        @click-unary="onClickUnary"
      />
    </template>
  </DatabasePropertyMenuItem>
</template>
