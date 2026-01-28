<script setup lang="ts">
import {
  LOGICAL_FILTER_OPERATOR,
  UNARY_FILTER_OPERATOR,
  type DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { MDMenuItemBase } from '@shared/ui/Menu';
import { OPERATOR_LABEL } from '@shared/ui/Query/constants';
import { computed, toRefs } from 'vue';
import UnaryOperatorFilterMenuItem from './UnaryOperatorFilterMenuItem.vue';
import PropertyFilterMenuItem from './PropertyFilterMenuItem.vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useDatabaseProperties } from '@entity/databaseProperty';

const props = defineProps<{
  operator: LOGICAL_FILTER_OPERATOR;
  propertyId?: DatabasePropertyId;
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const { directoryPath: path, documentId } = toRefs(props);

const emit = defineEmits<{
  clickUnary: [
    {
      operator: UNARY_FILTER_OPERATOR;
      parentOperators?: (LOGICAL_FILTER_OPERATOR | DatabasePropertyId)[];
    },
  ];
}>();

const label = computed(() => OPERATOR_LABEL[props.operator]);

const { propertiesIdList } = useDatabaseProperties(path, documentId);

const onClickUnary = (operator: UNARY_FILTER_OPERATOR) => {
  emit('clickUnary', { operator });
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
  emit('clickUnary', {
    operator,
    parentOperators: [property, ...parentOperators],
  });
};
</script>

<template>
  <MDMenuItemBase :label="label">
    <template #submenu>
      <LogicalOperatorFilterMenuItem
        v-for="subOperator in LOGICAL_FILTER_OPERATOR"
        :key="subOperator"
        :operator="subOperator"
        :directory-path="path"
        :document-id="documentId"
        :property-id="propertyId"
        @click-unary="onClickUnaryInLogical($event, subOperator)"
      />

      <template v-if="propertyId">
        <UnaryOperatorFilterMenuItem
          v-for="subOperator in UNARY_FILTER_OPERATOR"
          :key="subOperator"
          :operator="subOperator"
          @click="onClickUnary(subOperator)"
        />
      </template>

      <template v-else>
        <PropertyFilterMenuItem
          v-for="subPropertyId in propertiesIdList"
          :key="subPropertyId"
          :path="path"
          :document-id="documentId"
          :property-id="subPropertyId"
          @click-unary="onClickUnaryInProperty($event, subPropertyId)"
        />
      </template>
    </template>
  </MDMenuItemBase>
</template>
