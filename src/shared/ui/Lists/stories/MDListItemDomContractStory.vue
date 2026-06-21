<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import MDList from '../MDList.vue';
import MDListItem from '../MDListItem.vue';

const rootAttrs = {
  'data-testid': 'md-list-dom-contract',
};
const staticListAttrs = { id: 'dom-static-list' };
const staticItemAttrs = { id: 'dom-static-item' };
const singleListAttrs = { id: 'dom-single-list' };
const singleItemAttrs = { id: 'dom-single-item' };
const multiListAttrs = { id: 'dom-multi-list' };
const multiItemAttrs = { id: 'dom-multi-item' };
const segmentedListAttrs = { id: 'dom-segmented-list' };
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-list-backdrop md-list-dom-contract-story">
    <section>
      <h3 class="md-list-dom-contract-story__title">Static list</h3>
      <MDList v-bind="staticListAttrs">
        <MDListItem
          v-bind="staticItemAttrs"
          label-text="Static item"
          supporting-text="No row action"
        />
      </MDList>
    </section>

    <section>
      <h3 class="md-list-dom-contract-story__title">Single-action list</h3>
      <MDList v-bind="singleListAttrs">
        <MDListItem
          v-bind="singleItemAttrs"
          mode="single-action"
          label-text="Single action"
          supporting-text="Primary action lives inside the list item"
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
      </MDList>
    </section>

    <section>
      <h3 class="md-list-dom-contract-story__title">Multi-action list</h3>
      <MDList v-bind="multiListAttrs">
        <MDListItem
          v-bind="multiItemAttrs"
          mode="multi-action"
          label-text="Multi action"
          supporting-text="Primary and secondary actions are siblings"
          @action="onAction"
        >
          <template #trailingAction>
            <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
          </template>
        </MDListItem>
      </MDList>
    </section>

    <section>
      <h3 class="md-list-dom-contract-story__title">Segmented list</h3>
      <MDList v-bind="segmentedListAttrs" list-style="segmented">
        <MDListItem label-text="Segment one" />
        <MDListItem label-text="Segment two" />
        <MDListItem label-text="Segment three" />
      </MDList>
    </section>
  </div>
</template>

<style scoped>
.md-list-dom-contract-story {
  display: grid;
  gap: 24dp;
  width: min(360dp, calc(100vw - 32dp));
}

.md-list-dom-contract-story__title {
  margin: 0 0 8dp;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}
</style>
