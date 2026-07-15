<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import { MDList, MDListItem } from '@shared/ui/Lists';

const onAction = () => {};

// MDList/MDListItem forward an `id` to their rendered host element via $attrs; this story's
// entire purpose is to prove that forwarding contract end-to-end (see
// `MDList / DOM contract` in md-list.spec.ts), so `id` is a genuine transparent-forwarding
// boundary case, not a convenience shortcut for a literal attribute. `id` is a global HTML
// attribute, not a `data-*` one, so it falls outside the project's `dataAttributes` allowlist
// and must go through `v-bind` to type-check against these strictly-typed components.
const staticListId = { id: 'dom-static-list' };
const staticItemId = { id: 'dom-static-item' };
const singleListId = { id: 'dom-single-list' };
const singleItemId = { id: 'dom-single-item' };
const multiListId = { id: 'dom-multi-list' };
const multiItemId = { id: 'dom-multi-item' };
const segmentedListId = { id: 'dom-segmented-list' };
</script>

<template>
  <div data-testid="md-list-dom-contract" class="visual-list-backdrop md-list-dom-contract-story">
    <section>
      <h3 class="md-list-dom-contract-story__title">Static list</h3>
      <!-- eslint-disable vue/no-restricted-v-bind -- transparent $attrs forwarding boundary under test (see script comment); `id` is not a `data-*` attribute so it cannot be written literally under this project's strict component typing -->
      <MDList v-bind="staticListId">
        <MDListItem
          v-bind="staticItemId"
          label-text="Static item"
          supporting-text="No row action"
        />
      </MDList>
      <!-- eslint-enable vue/no-restricted-v-bind -->
    </section>

    <section>
      <h3 class="md-list-dom-contract-story__title">Single-action list</h3>
      <!-- eslint-disable vue/no-restricted-v-bind -- transparent $attrs forwarding boundary under test (see script comment); `id` is not a `data-*` attribute so it cannot be written literally under this project's strict component typing -->
      <MDList v-bind="singleListId">
        <MDListItem
          v-bind="singleItemId"
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
      <!-- eslint-enable vue/no-restricted-v-bind -->
    </section>

    <section>
      <h3 class="md-list-dom-contract-story__title">Multi-action list</h3>
      <!-- eslint-disable vue/no-restricted-v-bind -- transparent $attrs forwarding boundary under test (see script comment); `id` is not a `data-*` attribute so it cannot be written literally under this project's strict component typing -->
      <MDList v-bind="multiListId">
        <MDListItem
          v-bind="multiItemId"
          mode="multi-action"
          label-text="Multi action"
          supporting-text="Primary and secondary actions are siblings"
          @action="onAction"
        >
          <template #trailingAction>
            <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" color="standard" />
          </template>
        </MDListItem>
      </MDList>
      <!-- eslint-enable vue/no-restricted-v-bind -->
    </section>

    <section>
      <h3 class="md-list-dom-contract-story__title">Segmented list</h3>
      <!-- eslint-disable-next-line vue/no-restricted-v-bind -- transparent $attrs forwarding boundary under test (see script comment); `id` is not a `data-*` attribute so it cannot be written literally under this project's strict component typing -->
      <MDList v-bind="segmentedListId" list-style="segmented">
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
