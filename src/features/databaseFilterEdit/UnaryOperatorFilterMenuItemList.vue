<script setup lang="ts">
import { UNARY_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import UnaryOperatorFilterMenuItem from './UnaryOperatorFilterMenuItem.vue';

const emit = defineEmits<{
  clickUnary: [
    {
      operator: UNARY_FILTER_OPERATOR;
    },
  ];
}>();

const onClickUnaryOperator = (operator: UNARY_FILTER_OPERATOR) => {
  emit('clickUnary', { operator });
};
</script>

<template>
  <UnaryOperatorFilterMenuItem
    v-for="operator in UNARY_FILTER_OPERATOR"
    :key="operator"
    :operator="operator"
    @click="() => onClickUnaryOperator(operator)"
  />
</template>
