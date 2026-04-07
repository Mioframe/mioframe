<script setup lang="ts">
const { is = 'div', type = 'list' } = defineProps<{
  is?: 'ul' | 'div';
  type?: 'list' | 'grid';
  transition?: boolean;
}>();

defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <component
    :is="is"
    class="md md-list-container"
    :class="{
      'md-list-container_grid': type === 'grid',
    }"
    role="list"
  >
    <TransitionGroup v-if="transition" name="transition">
      <slot />
    </TransitionGroup>

    <slot v-else />
  </component>
</template>

<style scoped>
.md-list-container {
  --md-list-container-border-radius: 16px;

  list-style-type: none;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--md-list-container-border-radius, 0px);

  &_grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    grid-auto-rows: min-content;

    --md-list-container-border-radius: 8px;
    --md-list-item-border-radius: 8px;
  }

  :deep() {
    .transition {
      &-move,
      &-enter-active,
      &-leave-active {
        /* transition: all 0.2s linear; */
        transition-duration: var(--md-sys-motion-duration-short4);
        transition-property: all;
      }

      &-enter-from,
      &-leave-to {
        opacity: 0;
      }

      &-leave-active {
        position: absolute;
        pointer-events: none;
      }
    }
  }
}
</style>
