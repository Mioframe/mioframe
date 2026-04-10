<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { isNil } from 'es-toolkit';

defineProps<{
  value: unknown;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <span class="number" @click="emit('click')">
    <MDSymbol v-if="isNil(value)" name="unknown_med" class="number__empty" />

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
