<script setup lang="ts">
import { computed } from 'vue';
import QueryGeneral from './QueryGeneral.vue';
import { OPERATOR } from './constants';
import { hasValue } from '@shared/lib/typeGuards';

const props = defineProps<{
  queryKey: string;
  value: unknown;
  parentProperty?: string;
}>();

const defaultOperator = OPERATOR.$eq;

const property = computed(() =>
  hasValue(props.queryKey, OPERATOR) ? props.parentProperty : props.queryKey,
);

const operator = computed(() =>
  hasValue(props.queryKey, OPERATOR) ? props.queryKey : defaultOperator,
);
</script>

<template>
  <QueryGeneral
    :value="value"
    :operator="operator"
    :property="property"
    :parent-operator="OPERATOR.$eq"
  />
</template>
