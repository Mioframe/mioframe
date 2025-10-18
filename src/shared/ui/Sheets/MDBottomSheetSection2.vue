<script setup lang="ts">
defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <section class="md-bottom-sheet-section">
    <slot />
  </section>
</template>

<style lang="css" scoped>
.md-bottom-sheet-section {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
</style>
