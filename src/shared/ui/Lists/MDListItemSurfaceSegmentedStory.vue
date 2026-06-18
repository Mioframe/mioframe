<script setup lang="ts">
import MDIconButton from '../Button/MDIconButton.vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = { 'data-testid': 'visual-md-list-surface-segmented' };
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="md-list-item-surface-segmented-story">
    <section class="md-list-item-surface-segmented-story__section">
      <h3 class="md-list-item-surface-segmented-story__title">
        Segmented list on surface-container-low with item surfaces on surface
      </h3>
      <div
        class="md-list-item-surface-segmented-story__surface md-list-item-surface-segmented-story__surface_color_surface-container-low"
      >
        <MDList list-style="segmented">
          <MDListItem
            mode="single-action"
            label-text="Segmented first item"
            supporting-text="Segmented items have an explicit surface background."
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

.md-list-item-surface-segmented-story__surface {
  border-radius: 12dp;
  overflow: clip;
}

.md-list-item-surface-segmented-story__surface_color_surface-container-low {
  background: var(--md-sys-color-surface-container-low);
}
</style>
