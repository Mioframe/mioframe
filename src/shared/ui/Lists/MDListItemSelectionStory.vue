<script setup lang="ts">
import { ref } from 'vue';
import MDList from './MDList.vue';
import MDListOption from './MDListOption.vue';
import type { MDListModelValue } from './listContext';

const rootAttrs = {
  'data-testid': 'visual-md-list-selection',
};

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
  <div v-bind="rootAttrs" class="visual-surface md-list-item-selection-story">
    <section class="md-list-item-selection-story__section">
      <h3 class="md-list-item-selection-story__title">Single-select standard</h3>
      <MDList
        :model-value="singleSelection"
        selection-mode="single"
        @update:model-value="onSingleSelectionChange"
      >
        <MDListOption value="bread" label-text="Bread" />
        <MDListOption
          value="rice"
          label-text="Rice"
          supporting-text="Selected row shows a check indicator."
        />
        <MDListOption value="pita" label-text="Pita" />
      </MDList>
    </section>

    <section class="md-list-item-selection-story__section">
      <h3 class="md-list-item-selection-story__title">Multi-select segmented expressive</h3>
      <MDList
        :model-value="multipleSelection"
        selection-mode="multiple"
        variant="expressive"
        list-style="segmented"
        @update:model-value="onMultipleSelectionChange"
      >
        <MDListOption
          value="alerts"
          label-text="Alerts"
          supporting-text="Multiple rows can be selected without nested actions."
        />
        <MDListOption
          value="docs"
          label-text="Documents"
          supporting-text="Selection remains list-level."
        />
        <MDListOption
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
