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
</script>

<template>
  <div class="query-general">
    <QueryGroup
      v-if="operator === OPERATOR.$or && isArray(value)"
      :operator="operator"
      :array="value"
      :property="property"
      :parent-operator="parentOperator"
    />

    <QueryGroup
      v-else-if="operator === OPERATOR.$and && isArray(value)"
      :operator="operator"
      :array="value"
      :property="property"
      :parent-operator="parentOperator"
    />

    <QueryGroup
      v-else-if="operator === OPERATOR.$in && isArray(value)"
      :operator="OPERATOR.$or"
      :array="value"
      :property="property"
      :parent-operator="parentOperator"
    />

    <QueryGroup
      v-else-if="operator === OPERATOR.$nin && isArray(value)"
      :operator="OPERATOR.$and"
      :array="value"
      :property="property"
      :parent-operator="OPERATOR.$ne"
    />

    <template v-else-if="operator === OPERATOR.$nor && isArray(value)">
      <OperatorLabel :operator="OPERATOR.$not" />

      <QueryGroup
        :operator="OPERATOR.$or"
        :array="value"
        :property="property"
        :parent-operator="parentOperator"
      />
    </template>

    <template v-else-if="isPlainObject(value)">
      <OperatorLabel
        v-if="operator === OPERATOR.$not"
        :operator="OPERATOR.$not"
      />

      <QueryObject :query="value" :parent-property="property" />
    </template>

    <QueryItem
      v-else
      :property="property ?? 'unknown property'"
      :operator="operator"
      :value="value"
    />
  </div>
</template>

<style lang="css" scoped>
.query-general {
  display: flex;
  gap: 1step;
  align-items: center;
}
</style>
