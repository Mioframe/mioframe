<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-interaction-states-story">
    <MDListItem
      mode="single-action"
      label-text="Default"
      supporting-text="No interaction state — baseline reference"
    />
    <MDListItem
      mode="single-action"
      class="md-state_hover"
      label-text="Hover"
      supporting-text="State-layer opacity: 8%"
    />
    <MDListItem
      mode="single-action"
      class="md-state_focused"
      label-text="Focus"
      supporting-text="State-layer opacity: 10%"
    />
    <MDListItem
      mode="single-action"
      class="md-state_pressed"
      label-text="Pressed"
      supporting-text="State-layer opacity: 10%"
    />
    <MDListItem
      mode="single-action"
      class="md-state_dragged"
      label-text="Dragged"
      supporting-text="State-layer opacity: 16%"
      draggable
    />
  </div>
</template>

<script setup lang="ts">
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-item-interaction-states',
};
</script>

<style scoped>
.md-list-item-interaction-states-story {
  width: 320px;
  /*
   * Use primary as the state-layer color so state-layer overlays are clearly
   * visible at Material spec opacities (8%, 10%, 16%) in a screenshot.
   * In production, --md-content-color inherits from the global on-surface
   * token; on a near-white surface the difference is too subtle for visual
   * review without a reference color.
   */
  --md-content-color: var(--md-sys-color-primary);
}
</style>
