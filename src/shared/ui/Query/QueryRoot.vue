<script setup lang="ts">
import type { UnknownRecord } from 'type-fest';
import QueryObject from './QueryObject.vue';
import type { LogicalOperator } from './constants';

defineProps<{
  query: UnknownRecord;
}>();

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: {
    value: unknown;
    path: PropertyKey[];
    property: string;
  }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: {
    path: PropertyKey[];
    operator: LogicalOperator;
  }) => unknown;
}>();
</script>

<template>
  <QueryObject :query="query">
    <template #property="{ property: sProperty }">
      <slot name="property" :property="sProperty" />
    </template>

    <template #value="{ value: sValue, path, property }">
      <slot name="value" :value="sValue" :path="path" :property="property" />
    </template>

    <template #objectAppend="{ path }">
      <slot name="objectAppend" :path="path" />
    </template>

    <template #groupAppend="{ path, operator }">
      <slot name="groupAppend" :path="path" :operator="operator" />
    </template>
  </QueryObject>
</template>
