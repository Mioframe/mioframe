<script setup lang="ts">
import {
  type DatabaseLogicalFilterList,
  type LOGICAL_FILTER_OPERATOR,
} from '@shared/lib/databaseDocument/migrations/versions/v2/view/filter';
import { toRefs } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import DatabaseNestedFilterString from './DatabaseNestedFilterString2.vue';
import { OPERATOR_LABEL } from './types';

import { useCurrentElement } from '@vueuse/core';

import type {
  DatabaseNestedFilter,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument';

import { useLastHover } from '@shared/lib/useLastHover';
import type { DomainError } from '@shared/lib/error';

const props = withDefaults(
  defineProps<{
    directoryPath: string;
    documentId: AMDocumentId;
    operator: LOGICAL_FILTER_OPERATOR;
    level?: number;
  }>(),
  { level: 0 },
);

const { directoryPath, operator, documentId } = toRefs(props);

const groupFilterModel = defineModel<DatabaseLogicalFilterList>('groupFilter', {
  required: true,
});

defineSlots<{
  actions: () => unknown;
  valueField(p: {
    property: GeneralProperty | DomainError;
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const onUpdateFilter = (filter: DatabaseNestedFilter, index: number) => {
  groupFilterModel.value = groupFilterModel.value.toSpliced(index, 1, filter);
};

const hovered = useLastHover(useCurrentElement());

const onClickRemoveFilter = (index: number) => {
  groupFilterModel.value = groupFilterModel.value.toSpliced(index, 1);
};
</script>

<template>
  <span
    class="filter-block md"
    :class="[
      `filter-block_${level % 2 === 0 ? 'even' : 'odd'}`,
      {
        'filter-block_hovered': hovered,
      },
    ]"
  >
    <span class="filter-block__actions">
      <span> {{ OPERATOR_LABEL[operator] }} </span>
    </span>

    <span class="filter-block__body">
      <template v-for="(item, index) in groupFilterModel" :key="index">
        <DatabaseNestedFilterString
          :directory-path="directoryPath"
          :document-id="documentId"
          :filter="item"
          :level="level + 1"
          @update:filter="onUpdateFilter($event, index)"
          @click-remove="onClickRemoveFilter(index)"
        >
          <template #valueField="{ property, propertyId, update, value }">
            <slot
              :value="value"
              :update="update"
              name="valueField"
              :property="property"
              :property-id="propertyId"
            />
          </template>
        </DatabaseNestedFilterString>
      </template>
    </span>

    <span class="filter-block__actions">
      <slot name="actions">- actions -</slot>
    </span>
  </span>
</template>

<style lang="css" scoped>
@import './styles.css';
</style>
