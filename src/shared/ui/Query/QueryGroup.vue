<script setup lang="ts">
import type { ValueOf } from 'type-fest';
import QueryContainer from './QueryContainer.vue';
import OperatorLabel from './OperatorLabel.vue';
import QueryGeneral from './QueryGeneral.vue';
import type { LogicalOperator, OPERATOR } from './constants';

defineProps<{
  operator: typeof OPERATOR.$and | typeof OPERATOR.$or;
  parentOperator: ValueOf<typeof OPERATOR>;
  array: unknown[];
  property?: string | undefined;
}>();

const slots = defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown; path: PropertyKey[]; property: string }) => unknown;
  groupAppend: (p: { path: PropertyKey[]; operator: LogicalOperator }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
}>();

const emptyPath: PropertyKey[] = [];
const prependIndexToPath = (index: number, path: PropertyKey[]) => [index, ...path];
</script>

<template>
  <QueryContainer class="query-group">
    <template v-for="(value, index) in array" :key="index">
      <QueryGeneral
        :property="property"
        :value="value"
        :operator="parentOperator"
        :parent-operator="parentOperator"
      >
        <template #property="{ property: sProperty }">
          <slot name="property" :property="sProperty" />
        </template>

        <template #value="{ value: sValue, path, property: sProperty }">
          <slot
            name="value"
            :value="sValue"
            :path="prependIndexToPath(index, path)"
            :property="sProperty"
          />
        </template>

        <template #objectAppend="{ path }">
          <slot name="objectAppend" :path="prependIndexToPath(index, path)" />
        </template>

        <template #groupAppend="{ path, operator: sOperator }">
          <slot name="groupAppend" :path="prependIndexToPath(index, path)" :operator="sOperator" />
        </template>
      </QueryGeneral>

      <OperatorLabel
        v-if="index !== array.length - 1 || !!slots.groupAppend"
        :operator="operator"
      />
    </template>

    <slot name="groupAppend" :path="emptyPath" :operator="operator" />
  </QueryContainer>
</template>
