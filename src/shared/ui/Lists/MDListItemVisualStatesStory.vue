<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-story-surface">
    <MDListItem mode="single-action" label-text="Single action" supporting-text="Ripple enabled" />
    <MDListItem
      mode="single-action"
      label-text="Disabled single action"
      supporting-text="Disabled state"
      disabled
    />
    <MDListItem
      mode="single-action"
      href="#disabled"
      label-text="Disabled link action"
      supporting-text="No focus or navigation"
      disabled
    />
    <MDListItem
      container-tag="li"
      label-text="Static item"
      supporting-text="Non-interactive baseline"
    />
    <MDListItem
      label-text="Disabled static item"
      supporting-text="Disabled visual treatment"
      disabled
    />
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
