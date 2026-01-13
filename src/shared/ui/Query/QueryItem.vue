<script setup lang="ts">
import OperatorLabel from './OperatorLabel.vue';
import QueryContainer from './QueryContainer.vue';

defineProps<{
  property: string;
  operator: string;
  value: unknown;
}>();
</script>

<template>
  <QueryContainer class="query-item">
    <div class="__property">
      {{ property }}
    </div>

    <OperatorLabel :operator="operator" class="__operator" />

    <div class="__value">
      {{ value }}
    </div>
  </QueryContainer>
</template>
