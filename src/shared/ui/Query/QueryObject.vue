<script setup lang="ts">
import type { UnknownRecord } from 'type-fest';
import QueryObjectEntry from './QueryObjectEntry.vue';
import OperatorLabel from './OperatorLabel.vue';
import { computed } from 'vue';
import { keys } from '@shared/lib/objectKeys';
import type { LogicalOperator } from './constants';
import { OPERATOR } from './constants';
import QueryContainer from './QueryContainer.vue';

const props = defineProps<{
  query: UnknownRecord;
  parentProperty?: string;
}>();

const slots = defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown; path: PropertyKey[] }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: {
    path: PropertyKey[];
    operator: LogicalOperator;
  }) => unknown;
}>();

const keyList = computed(() => keys(props.query));

const lastKey = computed(() => keyList.value.at(-1));
</script>

<template>
  <QueryContainer class="query-object">
    <template v-for="(value, queryKey) in query" :key="queryKey">
      <QueryObjectEntry
        :query-key="queryKey"
        :parent-property="parentProperty"
        :value="value"
      >
        <template #property="{ property: sProperty }">
          <slot name="property" :property="sProperty" />
        </template>

        <template #value="{ value: sValue, path }">
          <slot name="value" :value="sValue" :path="[queryKey, ...path]" />
        </template>

        <template #objectAppend="{ path }">
          <slot name="objectAppend" :path="[queryKey, ...path]" />
        </template>

        <template #groupAppend="{ path, operator }">
          <slot
            name="groupAppend"
            :path="[queryKey, ...path]"
            :operator="operator"
          />
        </template>
      </QueryObjectEntry>

      <OperatorLabel
        v-if="queryKey !== lastKey || !!slots.objectAppend"
        :operator="OPERATOR.$and"
      />
    </template>

    <slot name="objectAppend" :path="[]" />
  </QueryContainer>
</template>
