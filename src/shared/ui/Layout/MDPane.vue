<script setup lang="ts">
import { toRefs, useTemplateRef } from 'vue';
import { definePaneScrollContainer } from './paneScrollContainer';
import { defineAllowedBottomNavigation } from './allowedBottomNavigation';

const props = defineProps<{
  allowBottomNavigation?: boolean;
}>();

const slots = defineSlots<{
  default: () => unknown;
  /** Pane-local non-scrolling top bar region, e.g. a pane-scoped `MDAppBar`. */
  topBar?: () => unknown;
}>();

const { allowBottomNavigation } = toRefs(props);

const paneContentEl = useTemplateRef('paneContentEl');

definePaneScrollContainer(paneContentEl);

defineAllowedBottomNavigation(allowBottomNavigation);
</script>

<template>
  <div class="md-pane">
    <div class="md md-pane__surface">
      <div v-if="slots.topBar" class="md-pane__top-bar">
        <slot name="topBar" />
      </div>

      <div ref="paneContentEl" class="md-pane__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-pane {
  display: flex;
  flex: 1 1 auto;
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);
  padding: 2step;
  position: relative;
  min-width: 320px;
  min-height: 0;
  transition-property: none;

  &:last-of-type {
    max-width: unset;
    width: unset;
  }

  .md-pane__surface {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--md-pane-container-shape, 16px);
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }

  .md-pane__top-bar {
    flex: 0 0 auto;
    min-width: 0;
  }

  .md-pane__content {
    display: flex;
    overflow: auto;
    flex-direction: column;
    justify-content: flex-start;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    padding: var(--md-pane-padding-y, 0) var(--md-pane-padding-x, 0);
    gap: var(--md-pane-content-gap, 0);
  }
}
</style>
