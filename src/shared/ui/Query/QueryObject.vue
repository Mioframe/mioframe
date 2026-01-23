<script setup lang="ts">
import type { UnknownRecord } from 'type-fest';
import QueryObjectEntry from './QueryObjectEntry.vue';
import OperatorLabel from './OperatorLabel.vue';
import { computed } from 'vue';
import { keys } from '@shared/lib/objectKeys';
import { OPERATOR } from './constants';
import QueryContainer from './QueryContainer.vue';

const props = defineProps<{
  query: UnknownRecord;
  parentProperty?: string;
}>();

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: { path: PropertyKey[] }) => unknown;
}>();

const keyList = computed(() => keys(props.query));

const firstKey = computed(() => keyList.value.at(0));
</script>

<template>
  <QueryContainer class="query-object">
    <template v-for="(value, queryKey) in query" :key="queryKey">
      <OperatorLabel v-if="queryKey !== firstKey" :operator="OPERATOR.$and" />

      <QueryObjectEntry
        :query-key="queryKey"
        :parent-property="parentProperty"
        :value="value"
      >
        <template #property="{ property: sProperty }">
          <slot name="property" :property="sProperty" />
        </template>

        <template #value="{ value: sValue }">
          <slot name="value" :value="sValue" />
        </template>

        <template #objectAppend="{ path }">
          <slot name="objectAppend" :path="[queryKey, ...path]" />
        </template>

        <template #groupAppend="{ path }">
          <slot name="groupAppend" :path="[queryKey, ...path]" />
        </template>
      </QueryObjectEntry>
    </template>

    <slot name="objectAppend" :path="[]" />
  </QueryContainer>
</template>
