<script setup lang="ts">
import MDSymbol from '../Icon/MDSymbol.vue';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = { 'data-testid': 'visual-md-list-surface-standard' };
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="md-list-item-surface-standard-story">
    <section class="md-list-item-surface-standard-story__section">
      <h3 class="md-list-item-surface-standard-story__title">Standard list on surface</h3>
      <div
        class="md-list-item-surface-standard-story__surface md-list-item-surface-standard-story__surface_color_surface"
      >
        <MDList>
          <MDListItem
            mode="single-action"
            label-text="Row on surface"
            supporting-text="List items are transparent; this background comes from the parent."
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="draft" />
            </template>
          </MDListItem>
          <MDListItem mode="single-action" label-text="Second row on surface" @action="onAction">
            <template #leading>
              <MDSymbol name="folder" />
            </template>
          </MDListItem>
        </MDList>
      </div>
    </section>

    <section class="md-list-item-surface-standard-story__section">
      <h3 class="md-list-item-surface-standard-story__title">Standard list on surface-container</h3>
      <div
        class="md-list-item-surface-standard-story__surface md-list-item-surface-standard-story__surface_color_surface-container"
      >
        <MDList>
          <MDListItem
            mode="single-action"
            label-text="Row on surface-container"
            supporting-text="Transparent list item inherits the container surface color."
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="settings" />
            </template>
          </MDListItem>
          <MDListItem
            mode="single-action"
            label-text="Second row on surface-container"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="info" />
            </template>
          </MDListItem>
        </MDList>
      </div>
    </section>

    <section class="md-list-item-surface-standard-story__section">
      <h3 class="md-list-item-surface-standard-story__title">
        Standard list inherits through wrappers
      </h3>
      <div
        id="surface-context-wrapped-standard"
        class="md-list-item-surface-standard-story__surface md-list-item-surface-standard-story__surface_color_surface-container"
      >
        <div class="md-list-item-surface-standard-story__wrapper">
          <div class="md-list-item-surface-standard-story__wrapper-inner">
            <MDList>
              <MDListItem
                mode="single-action"
                label-text="Wrapped standard row"
                supporting-text="Intermediate layout wrappers must not break surface inheritance."
                @action="onAction"
              >
                <template #leading>
                  <MDSymbol name="layers" />
                </template>
              </MDListItem>
            </MDList>
          </div>
        </div>
      </div>
    </section>

    <section class="md-list-item-surface-standard-story__section">
      <h3 class="md-list-item-surface-standard-story__title">
        Standard list on surface-container-high
      </h3>
      <div
        class="md-list-item-surface-standard-story__surface md-list-item-surface-standard-story__surface_color_surface-container-high"
      >
        <MDList>
          <MDListItem
            mode="single-action"
            label-text="Row on surface-container-high"
            supporting-text="Transparent item shows elevation difference between list and parent."
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="home" />
            </template>
          </MDListItem>
          <MDListItem
            mode="single-action"
            label-text="Second row on surface-container-high"
            disabled
          >
            <template #leading>
              <MDSymbol name="block" />
            </template>
          </MDListItem>
        </MDList>
      </div>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-surface-standard-story {
  display: grid;
  gap: 24dp;
  width: min(400dp, calc(100vw - 32dp));
  padding: 24dp;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}

.md-list-item-surface-standard-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-surface-standard-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-surface-standard-story__surface {
  border-radius: 12dp;
  overflow: clip;
}

.md-list-item-surface-standard-story__wrapper,
.md-list-item-surface-standard-story__wrapper-inner {
  display: grid;
}

.md-list-item-surface-standard-story__wrapper {
  padding: 8dp;
}

.md-list-item-surface-standard-story__wrapper-inner {
  padding: 8dp 0;
}

.md-list-item-surface-standard-story__surface_color_surface {
  background: var(--md-sys-color-surface);
}

.md-list-item-surface-standard-story__surface_color_surface-container {
  background: var(--md-sys-color-surface-container);
}

.md-list-item-surface-standard-story__surface_color_surface-container-high {
  background: var(--md-sys-color-surface-container-high);
}
</style>
