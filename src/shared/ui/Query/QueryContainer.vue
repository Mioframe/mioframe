<script setup lang="ts">
import { useRotationBackground } from './useRotationBackground';

defineSlots<{
  default: () => unknown;
}>();

const spin = useRotationBackground();
</script>

<template>
  <div
    class="query-container md"
    :class="{
      _second: spin,
    }"
  >
    <slot />
  </div>
</template>

<style lang="css" scoped>
.query-container {
  display: inline-flex;
  flex-wrap: wrap;
  padding: 1step 2step;
  border-radius: var(--md-sys-shape-corner-medium);
  gap: 2step;
  align-items: center;
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);

  &._second {
    --md-container-color: var(--md-sys-color-surface-variant);
    --md-content-color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
