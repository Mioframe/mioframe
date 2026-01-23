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

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: { path: PropertyKey[] }) => unknown;
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
  >
    <template #property="{ property: sProperty }">
      <slot name="property" :property="sProperty" />
    </template>

    <template #value="{ value: sValue }">
      <slot name="value" :value="sValue" />
    </template>

    <template #objectAppend="{ path }">
      <slot name="objectAppend" :path="path" />
    </template>

    <template #groupAppend="{ path }">
      <slot name="groupAppend" :path="path" />
    </template>
  </QueryGeneral>
</template>
