<script setup lang="ts">
const { tag = 'ul', type = 'list' } = defineProps<{
  tag?: 'ul' | 'div';
  type?: 'list' | 'grid';
}>();

defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <component
    :is="tag"
    class="md-list-container"
    :class="{
      'md-list-container_grid': type === 'grid',
    }"
  >
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

  &_grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    grid-auto-rows: min-content;

    --md-list-container-border-radius: 8px;
    --md-list-item-border-radius: 8px;
  }
}
</style>
