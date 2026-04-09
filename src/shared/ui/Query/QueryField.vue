<script setup lang="ts">
import { isPlainObject } from 'es-toolkit';
import { isArray } from 'es-toolkit/compat';
import { computed } from 'vue';
import QueryOperator from './QueryOperator.vue';
import QueryValue from './QueryValue.vue';

/**
 * Контекст поля: Отвечает за связку "Поле -> Условие" (например, age: { ... })
 */

const props = defineProps<{
  field: string;
  value: unknown;
}>();

const isOperatorObject = computed(() => {
  if (!isPlainObject(props.value) || isArray(props.value)) {
    return false;
  }
  // Check if keys start with $
  return Object.keys(props.value).some((k) => k.startsWith('$'));
});
</script>

<template>
  <div class="query-field">
    {{ field }}

    <template v-if="isOperatorObject">
      <QueryOperator v-for="(val, op) in value" :key="op" :operator="op" :value="val" />
    </template>

    <template v-else>
      <QueryValue :value="value" />
    </template>
  </div>
</template>

<style lang="css" scoped>
.query-field {
  display: inline-flex;
}
</style>
