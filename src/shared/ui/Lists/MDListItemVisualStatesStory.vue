<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-story-surface">
    <MDListItem is="button" type="button" headline="Button host" supporting-text="Ripple enabled" />
    <MDListItem
      is="button"
      type="button"
      headline="Disabled button host"
      supporting-text="Disabled state"
      disabled
    />
    <MDListItem is="li" headline="Static host" supporting-text="Ripple disabled host" />
  </div>
</template>

<script setup lang="ts">
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-item-states',
};
</script>

<style scoped>
.md-list-item-story-surface {
  width: 320px;
}
</style>
