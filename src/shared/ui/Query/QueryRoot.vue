<script setup lang="ts">
import type { UnknownRecord } from 'type-fest';
import QueryObject from './QueryObject.vue';

defineProps<{
  query: UnknownRecord;
}>();

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: { path: PropertyKey[] }) => unknown;
}>();
</script>

<template>
  <QueryObject :query="query">
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
  </QueryObject>
</template>
