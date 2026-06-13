<script setup lang="ts">
import MDIconButton from '../Button/MDIconButton.vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-item-trailing-action',
};

const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-trailing-action-story">
    <MDListItem
      mode="multi-action"
      label-text="Draft database"
      supporting-text="Trailing action stays compact"
      @action="onAction"
    >
      <template #trailingAction>
        <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
      </template>
    </MDListItem>
    <MDListItem
      mode="multi-action"
      label-text="Pinned view"
      supporting-text="Outlined action still matches develop layout"
      @action="onAction"
    >
      <template #trailingAction>
        <MDIconButton tooltip="Edit view" color="outlined" md-symbol-name="edit" />
      </template>
    </MDListItem>
  </div>
</template>

<style scoped>
.md-list-item-trailing-action-story {
  width: 320dp;
}
</style>
