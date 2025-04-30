<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { isNullish } from 'remeda';

defineProps<{
  value: unknown;
}>();
</script>

<template>
  <span class="number">
    <MDSymbol
      v-if="isNullish(value)"
      name="unknown_med"
      class="number__empty"
    />

    <template v-else>
      {{ value }}
    </template>
  </span>
</template>

<style lang="css" scoped>
.number {
  &__empty {
    opacity: 0.5;
  }
}
</style>
