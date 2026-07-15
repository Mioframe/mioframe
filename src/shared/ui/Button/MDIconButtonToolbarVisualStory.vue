<script setup lang="ts">
import MDIconButton from './MDIconButton.vue';

const rootAttrs = {
  'data-testid': 'visual-md-icon-button-toolbar-layout',
};

const toolbarItems = [
  { label: 'Add row', icon: 'add' },
  { label: 'Filter', icon: 'filter_list' },
  { label: 'Sort', icon: 'sort' },
  { label: 'Search', icon: 'search' },
] as const;
</script>

<template>
  <div v-bind="rootAttrs" class="visual-checker-backdrop md-icon-button-toolbar">
    <div class="md-icon-button-toolbar__row" role="toolbar" aria-label="Database toolbar">
      <div v-for="item in toolbarItems" :key="item.label" class="md-icon-button-toolbar__item">
        <MDIconButton :tooltip="item.label" :md-symbol-name="item.icon" color="standard" />
        <span class="visual-gallery-label">{{ item.label }}</span>
      </div>
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

  &__item {
    display: grid;
    justify-items: center;
    gap: 4dp;
  }
}
</style>
