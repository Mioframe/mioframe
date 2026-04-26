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
  parentProperty?: string | undefined;
}>();

const slots = defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown; path: PropertyKey[]; property: string }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: { path: PropertyKey[]; operator: LogicalOperator }) => unknown;
}>();

const keyList = computed(() => keys(props.query));

const lastKey = computed(() => keyList.value.at(-1));

const emptyPath: PropertyKey[] = [];
const prependQueryKeyToPath = (queryKey: string, path: PropertyKey[]) => [queryKey, ...path];
</script>

<template>
  <QueryContainer class="query-object">
    <template v-for="(value, queryKey) in query" :key="queryKey">
      <QueryObjectEntry :query-key="queryKey" :parent-property="parentProperty" :value="value">
        <template #property="{ property: sProperty }">
          <slot name="property" :property="sProperty" />
        </template>

        <template #value="{ value: sValue, path, property }">
          <slot
            name="value"
            :value="sValue"
            :path="prependQueryKeyToPath(queryKey, path)"
            :property="property"
          />
        </template>

        <template #objectAppend="{ path }">
          <slot name="objectAppend" :path="prependQueryKeyToPath(queryKey, path)" />
        </template>

        <template #groupAppend="{ path, operator }">
          <slot
            name="groupAppend"
            :path="prependQueryKeyToPath(queryKey, path)"
            :operator="operator"
          />
        </template>
      </QueryObjectEntry>

      <OperatorLabel
        v-if="queryKey !== lastKey || !!slots.objectAppend"
        :operator="OPERATOR.$and"
      />
    </template>

    <slot name="objectAppend" :path="emptyPath" />
  </QueryContainer>
</template>
