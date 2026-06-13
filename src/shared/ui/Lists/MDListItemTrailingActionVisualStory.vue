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
      label-text="Trailing action"
      supporting-text="Secondary action is independent of the primary action."
      @action="onAction"
    >
      <template #trailingAction>
        <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
      </template>
    </MDListItem>
    <MDListItem
      mode="multi-action"
      label-text="Outlined trailing action"
      supporting-text="Outlined secondary action variant."
      @action="onAction"
    >
      <template #trailingAction>
        <MDIconButton tooltip="Edit" color="outlined" md-symbol-name="edit" />
      </template>
    </MDListItem>
    <MDListItem
      mode="multi-action"
      label-text="Multi-action item"
      supporting-text="Primary and secondary actions have separate targets."
      @action="onAction"
    >
      <template #trailingAction>
        <MDIconButton tooltip="More options" md-symbol-name="more_vert" />
      </template>
    </MDListItem>
  </div>
</template>

<style scoped>
.md-list-item-trailing-action-story {
  width: 320dp;
}
</style>
