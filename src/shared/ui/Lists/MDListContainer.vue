<script setup lang="ts">
const { is = 'div', layout } = defineProps<{
  is?: 'ul' | 'div' | undefined;
  /** Project-specific layout override. Not a Material list style. */
  layout?: 'column' | 'grid' | undefined;
  transition?: boolean | undefined;
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
      'md-list-container_grid': layout === 'grid',
    }"
    :role="is !== 'ul' ? 'list' : undefined"
  >
    <TransitionGroup v-if="transition" name="transition">
      <slot />
    </TransitionGroup>

    <slot v-else />
  </component>
</template>

<style scoped>
.md-list-container {
  --md-comp-list-container-shape: 16dp;

  list-style-type: none;
  display: flex;
  flex-direction: column;
  border-radius: var(--md-comp-list-container-shape, 0px);

  &_grid {
    display: grid;
    gap: 8dp;
    grid-template-columns: repeat(auto-fit, minmax(190dp, 1fr));
    grid-auto-rows: min-content;

    --md-comp-list-container-shape: 8dp;
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
