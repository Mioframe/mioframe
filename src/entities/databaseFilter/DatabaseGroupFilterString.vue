<script setup lang="ts">
import type {
  DatabaseLogicalFilterList,
  LOGICAL_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument/migrations/versions/v2/view/filter';
import { computed, toRefs } from 'vue';
import type { AMDocHandle } from '@shared/lib/automerge';
import DatabaseNestedFilterString from './DatabaseNestedFilterString.vue';
import { keys } from '@shared/lib/objectKeys';
import { OPERATOR_LABEL } from './types';

const props = defineProps<{
  groupFilterValue: DatabaseLogicalFilterList;
  operator: LOGICAL_FILTER_OPERATOR;
  docHandle: AMDocHandle;
}>();

const { groupFilterValue } = toRefs(props);

const lastIndex = computed(() => keys(groupFilterValue.value).length - 1);
</script>

<template>
  <span class="db-group-filter-string">
    <template v-if="lastIndex > 0">( </template>

    <template v-for="(item, index) in groupFilterValue" :key="index">
      <DatabaseNestedFilterString :condition="item" :doc-handle="docHandle" />

      <span v-if="index < lastIndex"> {{ OPERATOR_LABEL[operator] }} </span>
    </template>

    <template v-if="lastIndex > 0"> )</template>
  </span>
</template>
