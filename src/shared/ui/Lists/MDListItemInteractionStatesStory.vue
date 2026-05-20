<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-story-surface">
    <MDListItem
      is="button"
      class="md-state_hover"
      type="button"
      headline="Hover"
      supporting-text="Ripple enabled"
    />
    <MDListItem
      is="button"
      class="md-state_focused"
      type="button"
      headline="Focus"
      supporting-text="Focus visible"
    />
    <MDListItem
      is="button"
      class="md-state_pressed"
      type="button"
      headline="Pressed"
      supporting-text="Pressed state"
    />
    <MDListItem
      is="button"
      class="md-state_dragged"
      type="button"
      headline="Dragged"
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
