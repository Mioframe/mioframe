<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-story-surface">
    <MDListItem
      is="button"
      type="button"
      headline="Hover target"
      supporting-text="Ripple enabled"
    />
    <MDListItem is="button" type="button" headline="Focus target" supporting-text="Focus visible" />
    <MDListItem
      is="button"
      type="button"
      headline="Pressed target"
      supporting-text="Pressed state"
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
