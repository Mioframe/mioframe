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
  --md-list-container-border-radius: 0px;

  list-style-type: none;
  padding: 8px 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--md-list-container-border-radius);
}
</style>
