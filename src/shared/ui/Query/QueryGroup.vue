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

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown }) => unknown;
  groupAppend: (p: { path: PropertyKey[] }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
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
      >
        <template #property="{ property: sProperty }">
          <slot name="property" :property="sProperty" />
        </template>

        <template #value="{ value: sValue }">
          <slot name="value" :value="sValue" />
        </template>

        <template #objectAppend="{ path }">
          <slot name="objectAppend" :path="[index, ...path]" />
        </template>

        <template #groupAppend="{ path }">
          <slot name="groupAppend" :path="[index, ...path]" />
        </template>
      </QueryGeneral>
    </template>

    <slot name="groupAppend" :path="[]" />
  </QueryContainer>
</template>
