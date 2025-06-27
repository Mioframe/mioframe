<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { isNil } from 'es-toolkit';

const {} = defineProps<{
  value: unknown;
}>();
</script>

<template>
  <span class="relation-value">
    <MDSymbol
      v-if="isNil(value)"
      name="unknown_med"
      class="relation-value__empty"
    />

    <template v-else>
      {{ value }}
    </template>
  </span>
</template>

<style lang="css" scoped>
.relation-value {
  &__empty {
    opacity: 0.5;
  }
}
</style>
