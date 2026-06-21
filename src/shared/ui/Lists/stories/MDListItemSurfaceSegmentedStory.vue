<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import MDList from '../MDList.vue';
import MDListItem from '../MDListItem.vue';

const rootAttrs = { 'data-testid': 'visual-md-list-surface-segmented' };
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="md-list-item-surface-segmented-story">
    <section class="md-list-item-surface-segmented-story__section">
      <h3 class="md-list-item-surface-segmented-story__title">
        Segmented list Material parity sample
      </h3>
      <p class="md-list-item-surface-segmented-story__supporting-text">
        MDList remains transparent. This story avoids a contrasting wrapper around the list so the
        segmented container does not read like a filled plate.
      </p>
      <div
        class="md-list-item-surface-segmented-story__transparency-backdrop visual-transparency-grid"
      >
        <MDList list-style="segmented">
          <MDListItem
            mode="single-action"
            label-text="Segmented first item"
            supporting-text="Segmented items keep their own surface fill."
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="photo" />
            </template>
          </MDListItem>
          <MDListItem
            mode="multi-action"
            label-text="Segmented multi-action"
            supporting-text="Trailing action is independent of the primary surface."
            @action="onAction"
          >
            <template #trailingAction>
              <MDIconButton tooltip="More options" md-symbol-name="more_vert" />
            </template>
          </MDListItem>
          <MDListItem mode="single-action" label-text="Segmented last item" @action="onAction" />
        </MDList>
      </div>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-surface-segmented-story {
  display: grid;
  gap: 24dp;
  width: min(400dp, calc(100vw - 32dp));
  padding: 24dp;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}

.md-list-item-surface-segmented-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-surface-segmented-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}
.md-list-item-surface-segmented-story__transparency-backdrop {
  padding: 8dp;
  border-radius: 16dp;
}

.md-list-item-surface-segmented-story__supporting-text {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}
</style>
