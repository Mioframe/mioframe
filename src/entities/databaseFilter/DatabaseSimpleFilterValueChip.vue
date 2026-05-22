<script setup lang="ts">
import { MDInputChip } from '@shared/ui/Chips';
import { computed, toRefs } from 'vue';
import { OPERATOR_LABEL } from './types';
import type { UNARY_FILTER_OPERATOR } from '@shared/lib/databaseDocument/migrations/versions/v2/view/filter';
import type { DatabaseValue } from '@shared/lib/databaseDocument';
import { toString } from 'es-toolkit/compat';

const props = defineProps<{
  propertyName: string;
  operator: UNARY_FILTER_OPERATOR;
  value: DatabaseValue;
}>();

const { propertyName, operator, value } = toRefs(props);

const valueString = computed(() => toString(value.value));

const label = computed(
  () => `${propertyName.value} ${OPERATOR_LABEL[operator.value]} ${valueString.value}`,
);
</script>

<template>
  <MDInputChip class="db-simple-filter-value" :label="label" />
</template>
