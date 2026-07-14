<script setup lang="ts">
import { ref } from 'vue';
import MDButton from '../../Button/MDButton.vue';
import { MDStateLayerForcedStateProvider } from '../../State/testing';
import { MDList, MDListItem } from '@shared/ui/Lists';

interface Row {
  id: string;
  label: string;
}

const rows = ref<Row[]>([
  { id: 'alpha', label: 'Alpha' },
  { id: 'bravo', label: 'Bravo' },
  { id: 'charlie', label: 'Charlie' },
  { id: 'delta', label: 'Delta' },
]);

// Deterministic public control: rotates the last row to the front on every click, so the
// resulting order is reproducible for browser assertions instead of relying on drag input.
const onRotate = () => {
  const next = [...rows.value];
  const last = next.pop();
  if (last) {
    next.unshift(last);
  }
  rows.value = next;
};

const onAction = () => {};
</script>

<template>
  <div class="md-list-animate-moves-story">
    <section class="md-list-animate-moves-story__section">
      <h3 class="md-list-animate-moves-story__title">animateMoves</h3>
      <MDButton
        data-testid="animate-moves-rotate"
        label="Move last row to front"
        color="tonal"
        @click="onRotate"
      />
      <MDList
        data-testid="animate-moves-list"
        list-style="segmented"
        animate-moves
        class="md-list-animate-moves-story__list"
      >
        <MDListItem
          v-for="row in rows"
          :key="row.id"
          :data-testid="`animate-moves-row-${row.id}`"
          mode="single-action"
          :label-text="row.label"
          @action="onAction"
        />
      </MDList>
    </section>

    <section class="md-list-animate-moves-story__section">
      <h3 class="md-list-animate-moves-story__title">Dragged elevation outside list bounds</h3>
      <MDList list-style="segmented" class="md-list-animate-moves-story__list">
        <MDListItem mode="single-action" label-text="Above" @action="onAction" />
        <MDStateLayerForcedStateProvider dragged>
          <MDListItem
            data-testid="animate-moves-dragged-row"
            mode="single-action"
            class="md-state_dragged"
            draggable
            label-text="Dragged"
            supporting-text="Elevation renders above sibling rows, not clipped by the list"
            @action="onAction"
          />
        </MDStateLayerForcedStateProvider>
        <MDListItem mode="single-action" label-text="Below" @action="onAction" />
      </MDList>
    </section>
  </div>
</template>

<style scoped>
.md-list-animate-moves-story {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24dp;
  width: min(360dp, calc(100vw - 32dp));
}

.md-list-animate-moves-story__section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8dp;
}

.md-list-animate-moves-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-animate-moves-story__list {
  width: 100%;
}
</style>
