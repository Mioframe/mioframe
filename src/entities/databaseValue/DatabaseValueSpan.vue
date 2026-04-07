<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { isUndefined } from 'es-toolkit';

defineProps<{
  value: unknown;
}>();
</script>

<template>
  <span class="database-value-span">
    <template v-if="!isUndefined(value)">
      {{ value }}
    </template>

    <MDSymbol v-else name="unknown_med" class="database-value-span__empty" />
  </span>
</template>

<style lang="css" scoped>
.database-value-span {
  &__empty {
    --md-content-color: var(--md-sys-color-secondary);
    opacity: 0.5;
  }
}
</style>
