<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDList from '../MDList.vue';
import MDListItem from '../MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-trailing-action',
};
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-trailing-action-story">
    <MDList list-style="segmented">
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
        label-text="Disabled trailing action"
        supporting-text="Disabled rows preserve the trailing target geometry."
        disabled
        @action="onAction"
      >
        <template #trailingAction>
          <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" disabled />
        </template>
      </MDListItem>
    </MDList>
  </div>
</template>

<style scoped>
.md-list-item-trailing-action-story {
  width: min(360dp, calc(100vw - 32dp));
}
</style>
