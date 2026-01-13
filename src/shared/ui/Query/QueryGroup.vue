<script setup lang="ts">
import type { ValueOf } from 'type-fest';
import QueryContainer from './QueryContainer.vue';
import OperatorLabel from './OperatorLabel.vue';
import QueryGeneral from './QueryGeneral.vue';
import type { OPERATOR } from './constants';

defineProps<{
  operator: typeof OPERATOR.$and | typeof OPERATOR.$or;
  parentOperator: ValueOf<typeof OPERATOR>;
  array: unknown[];
  property?: string;
}>();
</script>

<template>
  <QueryContainer>
    <template v-for="(value, index) in array" :key="index">
      <OperatorLabel v-if="index !== 0" :operator="operator" />

      <QueryGeneral
        :property="property"
        :value="value"
        :operator="parentOperator"
        :parent-operator="parentOperator"
      />
    </template>
  </QueryContainer>
</template>
