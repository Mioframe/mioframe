<script setup lang="ts">
import MDIconButton from './MDIconButton.vue';

const rootAttrs = {
  'data-testid': 'visual-md-icon-button-toolbar-layout',
};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-checker-backdrop md-icon-button-toolbar">
    <div class="md-icon-button-toolbar__row" role="toolbar" aria-label="Database toolbar">
      <MDIconButton tooltip="Add row" md-symbol-name="add" />
      <MDIconButton tooltip="Filter" md-symbol-name="filter_list" />
      <MDIconButton tooltip="Sort" md-symbol-name="sort" />
      <MDIconButton tooltip="Search" md-symbol-name="search" />
    </div>
  </div>
</template>

<style scoped>
.md-icon-button-toolbar {
  padding: 12dp;

  &__row {
    display: inline-flex;
    align-items: center;
    gap: 4dp;
    padding: 4dp;
    border-radius: 12dp;
    background: var(--md-sys-color-surface-container-low);
  }
}
</style>
