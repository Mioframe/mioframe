<script setup lang="ts">
import MDIconButton from '../Button/MDIconButton.vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-item-trailing-action',
};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-trailing-action-story">
    <MDListItem headline="Draft database" supporting-text="Trailing action stays compact">
      <template #trailingIcon>
        <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
      </template>
    </MDListItem>
    <MDListItem
      headline="Pinned view"
      supporting-text="Outlined action still matches develop layout"
    >
      <template #trailingIcon>
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
