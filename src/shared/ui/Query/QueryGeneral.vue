<script setup lang="ts">
import { isArray } from '@shared/lib/typeGuards';
import QueryGroup from './QueryGroup.vue';
import QueryObject from './QueryObject.vue';
import QueryItem from './QueryItem.vue';
import type { ValueOf } from 'type-fest';
import { isPlainObject } from 'es-toolkit';
import type { LogicalOperator } from './constants';
import { OPERATOR } from './constants';
import OperatorLabel from './OperatorLabel.vue';
import QueryContainer from './QueryContainer.vue';

defineProps<{
  value: unknown;
  operator: string;
  parentOperator: ValueOf<typeof OPERATOR>;
  property?: string;
}>();

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown; path: PropertyKey[]; property: string }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: { path: PropertyKey[]; operator: LogicalOperator }) => unknown;
}>();
</script>

<template>
  <QueryGroup
    v-if="operator === OPERATOR.$or && isArray(value)"
    :operator="operator"
    :array="value"
    :property="property"
    :parent-operator="parentOperator"
  >
    <template #property="{ property: sProperty }">
      <slot name="property" :property="sProperty" />
    </template>

    <template #value="{ value: sValue, path, property: sProperty }">
      <slot name="value" :value="sValue" :path="path" :property="sProperty" />
    </template>

    <template #objectAppend="{ path }">
      <slot name="objectAppend" :path="path" />
    </template>

    <template #groupAppend="{ path }">
      <slot name="groupAppend" :path="path" :operator="operator" />
    </template>
  </QueryGroup>

  <QueryGroup
    v-else-if="operator === OPERATOR.$and && isArray(value)"
    :operator="operator"
    :array="value"
    :property="property"
    :parent-operator="parentOperator"
  >
    <template #property="{ property: sProperty }">
      <slot name="property" :property="sProperty" />
    </template>

    <template #value="{ value: sValue, path, property: sProperty }">
      <slot name="value" :value="sValue" :path="path" :property="sProperty" />
    </template>

    <template #objectAppend="{ path }">
      <slot name="objectAppend" :path="path" />
    </template>

    <template #groupAppend="{ path, operator: sOperator }">
      <slot name="groupAppend" :path="path" :operator="sOperator" />
    </template>
  </QueryGroup>

  <QueryGroup
    v-else-if="operator === OPERATOR.$in && isArray(value)"
    :operator="OPERATOR.$or"
    :array="value"
    :property="property"
    :parent-operator="parentOperator"
  >
    <template #property="{ property: sProperty }">
      <slot name="property" :property="sProperty" />
    </template>

    <template #value="{ value: sValue, path, property: sProperty }">
      <slot name="value" :value="sValue" :path="path" :property="sProperty" />
    </template>

    <template #objectAppend="{ path }">
      <slot name="objectAppend" :path="path" />
    </template>

    <template #groupAppend="{ path, operator: sOperator }">
      <slot name="groupAppend" :path="path" :operator="sOperator" />
    </template>
  </QueryGroup>

  <QueryGroup
    v-else-if="operator === OPERATOR.$nin && isArray(value)"
    :operator="OPERATOR.$and"
    :array="value"
    :property="property"
    :parent-operator="OPERATOR.$ne"
  >
    <template #property="{ property: sProperty }">
      <slot name="property" :property="sProperty" />
    </template>

    <template #value="{ value: sValue, path, property: sProperty }">
      <slot name="value" :value="sValue" :path="path" :property="sProperty" />
    </template>

    <template #objectAppend="{ path }">
      <slot name="objectAppend" :path="path" />
    </template>

    <template #groupAppend="{ path, operator: sOperator }">
      <slot name="groupAppend" :path="path" :operator="sOperator" />
    </template>
  </QueryGroup>

  <QueryContainer v-else-if="operator === OPERATOR.$nor && isArray(value)" class="query-nor">
    <OperatorLabel :operator="OPERATOR.$not" />

    <QueryGroup
      :operator="OPERATOR.$or"
      :array="value"
      :property="property"
      :parent-operator="parentOperator"
    >
      <template #property="{ property: sProperty }">
        <slot name="property" :property="sProperty" />
      </template>

      <template #value="{ value: sValue, path, property: sProperty }">
        <slot name="value" :value="sValue" :path="path" :property="sProperty" />
      </template>

      <template #objectAppend="{ path }">
        <slot name="objectAppend" :path="path" />
      </template>

      <template #groupAppend="{ path, operator: sOperator }">
        <slot name="groupAppend" :path="path" :operator="sOperator" />
      </template>
    </QueryGroup>
  </QueryContainer>

  <template v-else-if="isPlainObject(value)">
    <QueryContainer v-if="operator === OPERATOR.$not" class="query-not">
      <OperatorLabel :operator="OPERATOR.$not" />

      <QueryObject :query="value" :parent-property="property">
        <template #property="{ property: sProperty }">
          <slot name="property" :property="sProperty" />
        </template>

        <template #value="{ value: sValue, path, property: sProperty }">
          <slot name="value" :value="sValue" :path="path" :property="sProperty" />
        </template>

        <template #objectAppend="{ path }">
          <slot name="objectAppend" :path="path" />
        </template>

        <template #groupAppend="{ path, operator: sOperator }">
          <slot name="groupAppend" :path="path" :operator="sOperator" />
        </template>
      </QueryObject>
    </QueryContainer>

    <QueryObject v-else :query="value" :parent-property="property">
      <template #property="{ property: sProperty }">
        <slot name="property" :property="sProperty" />
      </template>

      <template #value="{ value: sValue, path, property: sProperty }">
        <slot name="value" :value="sValue" :path="path" :property="sProperty" />
      </template>

      <template #objectAppend="{ path }">
        <slot name="objectAppend" :path="path" />
      </template>

      <template #groupAppend="{ path, operator: sOperator }">
        <slot name="groupAppend" :path="path" :operator="sOperator" />
      </template>
    </QueryObject>
  </template>

  <QueryItem v-else-if="property" :property="property" :operator="operator" :value="value">
    <template #property>
      <slot name="property" :property="property" />
    </template>

    <template #value>
      <slot name="value" :value="value" :path="[]" :property="property" />
    </template>
  </QueryItem>

  <QueryContainer v-else class="query-unknown"> unknown filter </QueryContainer>
</template>
