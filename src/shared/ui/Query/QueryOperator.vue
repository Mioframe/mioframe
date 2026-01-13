<script setup lang="ts">
import OperatorLabel from './OperatorLabel.vue';
import QueryValue from './QueryValue.vue';

/**
 * Оператор сравнения: Отвечает за конкретную проверку ($gt, $in, $regex)
 */

defineProps<{
  operator: string;
  value: unknown;
}>();
</script>

<template>
  <div class="query-operator">
    <OperatorLabel :operator="operator" />

    <QueryValue :value="value" />

    <!-- todo: если $in, то value разделяется как массив OR -->
    <!-- todo: если $nin, то value разделяется как массив AND -->
  </div>
</template>

<style lang="css" scoped>
.query-operator {
  display: inline-flex;
  gap: 2px;
}
</style>
