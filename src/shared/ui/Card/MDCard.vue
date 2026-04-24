<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'elevated' | 'filled' | 'outlined';
  }>(),
  {
    variant: 'filled',
  },
);

const classVariant = computed(() => `_${props.variant}`);
</script>

<template>
  <div class="md-card md" :class="classVariant">
    <slot />
  </div>
</template>

<style lang="css" scoped>
.md-card {
  display: flex;
  flex-direction: column;
  padding: 16dp;
  gap: 8dp;

  &._elevated {
    --md-container-color: var(--md-sys-color-surface-container-low);
    box-shadow: var(--md-sys-elevation-level1);
    border-radius: var(--md-sys-shape-corner-medium);
  }

  &._filled {
    --md-container-color: var(--md-sys-color-surface-container-highest);
    border-radius: var(--md-sys-shape-corner-medium);
  }

  &._outlined {
    --md-container-color: var(--md-sys-color-surface);
    border-radius: var(--md-sys-shape-corner-medium);
    border: 1dp solid var(--md-sys-color-outline-variant);
  }
}
</style>
