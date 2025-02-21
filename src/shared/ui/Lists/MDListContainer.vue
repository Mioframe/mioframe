<script setup lang="ts">
const { tag = 'ul' } = defineProps<{
  tag?: 'ul' | 'div';
}>();

defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <component :is="tag" class="md-list-container">
    <slot />
  </component>
</template>

<style scoped>
.md-list-container {
  list-style-type: none;
  padding: 8px 0;
  margin: 0;
}
</style>
