<script setup lang="ts">
import { useCssVar } from '@vueuse/core';
import { watchEffect } from 'vue';

const { scrollSnapAlign } = defineProps<{
  scrollSnapAlign?: 'none' | 'start' | 'end' | 'center';
}>();

defineSlots<{
  default: () => unknown;
}>();

const scrollSnapAlignCssVar = useCssVar('--md-bottom-sheet-section-scroll-snap-align');

watchEffect(() => {
  scrollSnapAlignCssVar.value = scrollSnapAlign;
});
</script>

<template>
  <section class="md-bottom-sheet-section md">
    <slot />
  </section>
</template>

<style lang="css" scoped>
.md-bottom-sheet-section {
  --md-bottom-sheet-section-scroll-snap-align: unset;

  pointer-events: all;
  --md-container-color: var(--md-bottom-sheet-container-color);
  --md-content-color: var(--md-bottom-sheet-content-color);
  max-width: 640px;
  position: relative;
  display: flex;
  flex-direction: column;
  scroll-snap-align: var(--md-bottom-sheet-section-scroll-snap-align);
  flex-shrink: 0;
  width: 100%;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
    border-radius: inherit;
    box-shadow: var(--md-bottom-sheet-shadow);
  }
}
</style>
