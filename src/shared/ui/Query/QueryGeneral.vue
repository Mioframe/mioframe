<script setup lang="ts">
import { isArray } from '@shared/lib/typeGuards';
import QueryGroup from './QueryGroup.vue';
import QueryObject from './QueryObject.vue';
import QueryItem from './QueryItem.vue';
import type { ValueOf } from 'type-fest';
import { isPlainObject } from 'es-toolkit';
import { OPERATOR } from './constants';
import OperatorLabel from './OperatorLabel.vue';

defineProps<{
  value: unknown;
  operator: string;
  parentOperator: ValueOf<typeof OPERATOR>;
  property?: string;
}>();

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown }) => unknown;
  objectAppend: (p: { path: PropertyKey[] }) => unknown;
  groupAppend: (p: { path: PropertyKey[] }) => unknown;
}>();
</script>

<template>
  <div class="query-general">
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

      <template #value="{ value: sValue }">
        <slot name="value" :value="sValue" />
      </template>

      <template #objectAppend="{ path }">
        <slot name="objectAppend" :path="path" />
      </template>

      <template #groupAppend="{ path }">
        <slot name="groupAppend" :path="path" />
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

      <template #value="{ value: sValue }">
        <slot name="value" :value="sValue" />
      </template>

      <template #objectAppend="{ path }">
        <slot name="objectAppend" :path="path" />
      </template>

      <template #groupAppend="{ path }">
        <slot name="groupAppend" :path="path" />
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

      <template #value="{ value: sValue }">
        <slot name="value" :value="sValue" />
      </template>

      <template #objectAppend="{ path }">
        <slot name="objectAppend" :path="path" />
      </template>

      <template #groupAppend="{ path }">
        <slot name="groupAppend" :path="path" />
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

      <template #value="{ value: sValue }">
        <slot name="value" :value="sValue" />
      </template>

      <template #objectAppend="{ path }">
        <slot name="objectAppend" :path="path" />
      </template>

      <template #groupAppend="{ path }">
        <slot name="groupAppend" :path="path" />
      </template>
    </QueryGroup>

    <template v-else-if="operator === OPERATOR.$nor && isArray(value)">
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

        <template #value="{ value: sValue }">
          <slot name="value" :value="sValue" />
        </template>

        <template #objectAppend="{ path }">
          <slot name="objectAppend" :path="path" />
        </template>

        <template #groupAppend="{ path }">
          <slot name="groupAppend" :path="path" />
        </template>
      </QueryGroup>
    </template>

    <template v-else-if="isPlainObject(value)">
      <OperatorLabel
        v-if="operator === OPERATOR.$not"
        :operator="OPERATOR.$not"
      />

      <QueryObject :query="value" :parent-property="property">
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

    <QueryItem
      v-else-if="property"
      :property="property"
      :operator="operator"
      :value="value"
    >
      <template #property>
        <slot name="property" :property="property" />
      </template>

      <template #value>
        <slot name="value" :value="value" />
      </template>
    </QueryItem>
  </div>
</template>

<style lang="css" scoped>
.query-general {
  display: flex;
  gap: 1step;
  align-items: center;
}
</style>
