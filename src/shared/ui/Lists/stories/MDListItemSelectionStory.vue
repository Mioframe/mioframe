<script setup lang="ts">
import { ref } from 'vue';
import MDList from '../MDList.vue';
import MDListSelectionItem from '../MDListSelectionItem.vue';
import type { MDListModelValue } from '../listContext';

const singleSelection = ref<'bread' | 'rice' | 'pita'>('rice');
const multipleSelection = ref<Array<'alerts' | 'docs' | 'notes'>>(['alerts', 'notes']);

const onSingleSelectionChange = (value: MDListModelValue) => {
  if (value === 'bread' || value === 'rice' || value === 'pita') {
    singleSelection.value = value;
  }
};

const onMultipleSelectionChange = (value: MDListModelValue) => {
  if (Array.isArray(value)) {
    multipleSelection.value = value.filter(
      (entry): entry is 'alerts' | 'docs' | 'notes' =>
        entry === 'alerts' || entry === 'docs' || entry === 'notes',
    );
  }
};
</script>

<template>
  <div
    data-testid="visual-md-list-selection"
    class="visual-list-backdrop md-list-item-selection-story"
  >
    <section class="md-list-item-selection-story__section">
      <h3 class="md-list-item-selection-story__title">Single-select standard</h3>
      <MDList
        :model-value="singleSelection"
        selection-mode="single"
        @update:model-value="onSingleSelectionChange"
      >
        <MDListSelectionItem value="bread" label-text="Bread" />
        <MDListSelectionItem
          value="rice"
          label-text="Rice"
          supporting-text="Selected row shows a check indicator."
        />
        <MDListSelectionItem value="pita" label-text="Pita" />
      </MDList>
    </section>

    <section class="md-list-item-selection-story__section">
      <h3 class="md-list-item-selection-story__title">Multi-select segmented</h3>
      <MDList
        :model-value="multipleSelection"
        selection-mode="multiple"
        list-style="segmented"
        @update:model-value="onMultipleSelectionChange"
      >
        <MDListSelectionItem
          value="alerts"
          label-text="Alerts"
          supporting-text="Multiple rows can be selected without nested actions."
        />
        <MDListSelectionItem
          value="docs"
          label-text="Documents"
          supporting-text="Selection remains list-level."
        />
        <MDListSelectionItem
          value="notes"
          label-text="Very long document title that should only truncate once the content column actually runs out of room"
          supporting-text="This supporting text stays inside the content area at narrow widths and should not collapse under the trailing indicator."
          :line-count="3"
        />
      </MDList>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-selection-story {
  display: grid;
  gap: 24dp;
  width: min(360dp, calc(100vw - 32dp));
}

.md-list-item-selection-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-selection-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}
</style>
