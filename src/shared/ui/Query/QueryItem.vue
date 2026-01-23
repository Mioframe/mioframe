<script setup lang="ts">
import OperatorLabel from './OperatorLabel.vue';
import QueryContainer from './QueryContainer.vue';

defineProps<{
  property: string;
  operator: string;
  value: unknown;
}>();

defineSlots<{
  property: (p: { property: string }) => unknown;
  value: (p: { value: unknown }) => unknown;
}>();
</script>

<template>
  <QueryContainer class="query-item">
    <div class="__property">
      <slot name="property" :property="property">
        {{ property }}
      </slot>
    </div>

    <OperatorLabel :operator="operator" class="__operator" />

    <div class="__value">
      <slot name="value" :value="value">
        {{ value }}
      </slot>
    </div>
  </QueryContainer>
</template>
