<script setup lang="ts">
import { toRefs, useTemplateRef } from 'vue';
import { definePaneContainer } from './useMDContainer';
import { defineAllowedBottomNavigation } from './allowedBottomNavigation';

const props = defineProps<{
  allowBottomNavigation?: boolean;
}>();

const { allowBottomNavigation } = toRefs(props);

defineSlots<{
  default: () => unknown;
}>();

const paneContentEl = useTemplateRef('paneContentEl');

definePaneContainer(paneContentEl);

defineAllowedBottomNavigation(allowBottomNavigation);
</script>

<template>
  <div class="md-pane">
    <div ref="paneContentEl" class="md __content">
      <slot />
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-pane {
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);
  padding: 2step;
  position: relative;
  min-width: 320px;
  transition-property: none;

  &:last-of-type {
    max-width: unset;
    width: unset;
  }

  .__content {
    display: flex;
    overflow: auto;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: var(--md-pane-container-shape, 16px);
    height: 100%;
    flex-grow: 1;
    flex-shrink: 1;
    padding: var(--md-pane-padding-y, 0) var(--md-pane-padding-x, 0);
  }
}
</style>
