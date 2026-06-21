<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import MDList from '../MDList.vue';
import MDListItem from '../MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-states',
};
const enabledAttrs = { 'data-state': 'enabled' };
const hoverAttrs = { 'data-state': 'hover' };
const focusAttrs = { 'data-state': 'focus' };
const pressedAttrs = { 'data-state': 'pressed' };
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-visual-states-story">
    <section class="md-list-item-visual-states-story__section">
      <h3 class="md-list-item-visual-states-story__title">Standard</h3>
      <MDList class="md-list-item-visual-states-story__list">
        <MDListItem
          v-bind="enabledAttrs"
          mode="single-action"
          label-text="Enabled"
          supporting-text="Single-action row"
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
        <MDListItem
          v-bind="hoverAttrs"
          class="md-state_hover"
          mode="single-action"
          label-text="Hover"
          supporting-text="State layer covers the full row action surface"
          @action="onAction"
        />
        <MDListItem
          v-bind="focusAttrs"
          class="md-state_focused"
          mode="single-action"
          label-text="Focus"
          supporting-text="Focus stays on the row action surface"
          @action="onAction"
        />
        <MDListItem
          v-bind="pressedAttrs"
          class="md-state_pressed"
          mode="single-action"
          label-text="Pressed"
          supporting-text="Pressed state stays inside the action shape"
          @action="onAction"
        />
        <MDListItem
          mode="single-action"
          class="md-state_dragged"
          draggable
          label-text="Dragged"
          supporting-text="Dragged state changes the whole row container"
          @action="onAction"
        />
        <MDListItem
          mode="single-action"
          disabled
          label-text="Disabled"
          supporting-text="Disabled row keeps its structure and target"
          @action="onAction"
        />
      </MDList>
    </section>

    <section class="md-list-item-visual-states-story__section">
      <h3 class="md-list-item-visual-states-story__title">Segmented</h3>
      <MDList list-style="segmented" class="md-list-item-visual-states-story__list">
        <MDListItem
          mode="multi-action"
          label-text="Enabled"
          supporting-text="Primary action plus independent trailing action"
          @action="onAction"
        >
          <template #trailingAction>
            <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
          </template>
        </MDListItem>
        <MDListItem
          v-bind="hoverAttrs"
          class="md-state_hover"
          mode="multi-action"
          label-text="Hover"
          supporting-text="Row-level state layer covers the full item container"
          @action="onAction"
        >
          <template #trailingAction>
            <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
          </template>
        </MDListItem>
        <MDListItem
          mode="multi-action"
          disabled
          label-text="Disabled"
          supporting-text="Trailing action remains visible but row action is disabled"
          @action="onAction"
        >
          <template #trailingAction>
            <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" disabled />
          </template>
        </MDListItem>
      </MDList>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-visual-states-story {
  display: grid;
  gap: 24dp;
  width: min(360dp, calc(100vw - 32dp));
}

.md-list-item-visual-states-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-visual-states-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-visual-states-story__list {
  width: 100%;
}
</style>
