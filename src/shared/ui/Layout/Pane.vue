<script setup lang="ts">
defineProps<{
  type: 'fixed' | 'flexible';
}>();

defineSlots<{
  default(): unknown;
}>();
</script>

<template>
  <div
    class="md-pane"
    :class="{
      'md-pane_fixed': type === 'fixed',
      'md-pane_flexible': type === 'flexible',
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.md-pane {
  &_fixed {
  }
  &_flexible {
  }
}
</style>
