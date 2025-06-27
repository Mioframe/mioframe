<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';

defineProps<{
  value: unknown;
}>();
</script>

<template>
  <span class="string">
    <MDSymbol v-if="!value" name="unknown_med" class="string__empty" />

    <template v-else>
      {{ value }}
    </template>
  </span>
</template>

<style lang="css" scoped>
.string {
  &__empty {
    opacity: 0.5;
  }
}
</style>
