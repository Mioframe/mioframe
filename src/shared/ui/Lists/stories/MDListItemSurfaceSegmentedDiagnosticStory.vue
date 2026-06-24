<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import MDList from '../MDList.vue';
import MDListItem from '../MDListItem.vue';

const onAction = () => {};
</script>

<template>
  <div
    data-testid="visual-md-list-surface-segmented-diagnostic"
    class="visual-list-backdrop md-list-item-surface-segmented-diagnostic-story"
  >
    <section class="md-list-item-surface-segmented-diagnostic-story__section">
      <h3 class="md-list-item-surface-segmented-diagnostic-story__title">
        Diagnostic: segmented gaps reveal the parent surface
      </h3>
      <p class="md-list-item-surface-segmented-diagnostic-story__supporting-text">
        This contrasting wrapper is intentional documentation. It shows the transparent 2dp gap
        between filled segmented items and is not the default Material parity sample.
      </p>
      <div
        class="md-list-item-surface-segmented-diagnostic-story__surface md-list-item-surface-segmented-diagnostic-story__surface_color_surface-container-low"
      >
        <MDList list-style="segmented">
          <MDListItem
            mode="single-action"
            label-text="Segmented first item"
            supporting-text="The list stays transparent while the item carries the visible fill."
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="photo" />
            </template>
          </MDListItem>
          <MDListItem
            mode="multi-action"
            label-text="Segmented multi-action"
            supporting-text="The contrasting parent surface makes the transparent gap obvious."
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
.md-list-item-surface-segmented-diagnostic-story {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24dp;
  width: min(400dp, calc(100vw - 32dp));
  padding: 24dp;
}

.md-list-item-surface-segmented-diagnostic-story__section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8dp;
}

.md-list-item-surface-segmented-diagnostic-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-surface-segmented-diagnostic-story__supporting-text {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.md-list-item-surface-segmented-diagnostic-story__surface {
  border-radius: 12dp;
  overflow: clip;
}

.md-list-item-surface-segmented-diagnostic-story__surface_color_surface-container-low {
  background: var(--md-sys-color-surface-container-low);
}
</style>
