<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-story-surface">
    <MDListItem
      mode="single-action"
      class="md-state_hover"
      label-text="Hover"
      supporting-text="Ripple enabled"
    />
    <MDListItem
      mode="single-action"
      class="md-state_focused"
      label-text="Focus"
      supporting-text="Focus visible"
    />
    <MDListItem
      mode="single-action"
      class="md-state_pressed"
      label-text="Pressed"
      supporting-text="Pressed state"
    />
    <MDListItem
      mode="single-action"
      class="md-state_dragged"
      label-text="Dragged"
      supporting-text="Dragged state"
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
.md-list-item-story-surface {
  width: 320px;
}
</style>
