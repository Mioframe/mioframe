<script setup lang="ts">
import MDIconButton from '../Button/MDIconButton.vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-surface',
};
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="md-list-item-surface-story">
    <!--
      Standard list: items must be transparent so the parent surface color shows through.
      Each section uses a different surface color token to verify no list background is
      accidentally injected by MDList or MDListItem.
    -->
    <section class="md-list-item-surface-story__section">
      <h3 class="md-list-item-surface-story__title">Standard list on surface</h3>
      <div
        class="md-list-item-surface-story__surface md-list-item-surface-story__surface_color_surface"
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

    <section class="md-list-item-surface-story__section">
      <h3 class="md-list-item-surface-story__title">Standard list on surface-container</h3>
      <div
        class="md-list-item-surface-story__surface md-list-item-surface-story__surface_color_surface-container"
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

    <section class="md-list-item-surface-story__section">
      <h3 class="md-list-item-surface-story__title">Standard list inherits through wrappers</h3>
      <div
        id="surface-context-wrapped-standard"
        class="md-list-item-surface-story__surface md-list-item-surface-story__surface_color_surface-container"
      >
        <div class="md-list-item-surface-story__wrapper">
          <div class="md-list-item-surface-story__wrapper-inner">
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

    <section class="md-list-item-surface-story__section">
      <h3 class="md-list-item-surface-story__title">Standard list on surface-container-high</h3>
      <div
        class="md-list-item-surface-story__surface md-list-item-surface-story__surface_color_surface-container-high"
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

    <section class="md-list-item-surface-story__section">
      <h3 class="md-list-item-surface-story__title">Segmented list on surface-container-low</h3>
      <div
        class="md-list-item-surface-story__surface md-list-item-surface-story__surface_color_surface-container-low"
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

    <section class="md-list-item-surface-story__section">
      <h3 class="md-list-item-surface-story__title">Repository Explorer documents section</h3>
      <div
        id="surface-context-repository-documents"
        class="md-list-item-surface-story__surface md-list-item-surface-story__surface_color_surface"
      >
        <div class="md-list-item-surface-story__repo-header">
          <div class="md-list-item-surface-story__repo-copy">
            <h4 class="md-list-item-surface-story__repo-title">Documents</h4>
            <p class="md-list-item-surface-story__repo-supporting-text">2 documents</p>
          </div>
          <MDIconButton tooltip="How documents are stored" md-symbol-name="info" />
        </div>

        <div id="surface-context-repository-segmented-list">
          <MDList list-style="segmented">
            <MDListItem
              mode="single-action"
              label-text="Research notes"
              supporting-text="Updated 2 hours ago"
              @action="onAction"
            >
              <template #leading>
                <MDSymbol name="draft" />
              </template>
            </MDListItem>
            <MDListItem
              mode="multi-action"
              label-text="Project outline"
              supporting-text="Shared with team"
              @action="onAction"
            >
              <template #leading>
                <MDSymbol name="description" />
              </template>
              <template #trailingAction>
                <MDIconButton tooltip="Manage document" md-symbol-name="more_vert" />
              </template>
            </MDListItem>
          </MDList>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-surface-story {
  display: grid;
  gap: 24dp;
  width: min(400dp, calc(100vw - 32dp));
  padding: 24dp;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}

.md-list-item-surface-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-surface-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-surface-story__surface {
  border-radius: 12dp;
  overflow: clip;
}

.md-list-item-surface-story__wrapper,
.md-list-item-surface-story__wrapper-inner {
  display: grid;
}

.md-list-item-surface-story__wrapper {
  padding: 8dp;
}

.md-list-item-surface-story__wrapper-inner {
  padding: 8dp 0;
}

.md-list-item-surface-story__surface_color_surface {
  background: var(--md-sys-color-surface);
}

.md-list-item-surface-story__surface_color_surface-container {
  background: var(--md-sys-color-surface-container);
}

.md-list-item-surface-story__surface_color_surface-container-high {
  background: var(--md-sys-color-surface-container-high);
}

.md-list-item-surface-story__surface_color_surface-container-low {
  background: var(--md-sys-color-surface-container-low);
}

.md-list-item-surface-story__repo-header {
  display: flex;
  gap: 8dp;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16dp 16dp 8dp;
}

.md-list-item-surface-story__repo-copy {
  display: grid;
  gap: 4dp;
}

.md-list-item-surface-story__repo-title,
.md-list-item-surface-story__repo-supporting-text {
  margin: 0;
}

.md-list-item-surface-story__repo-title {
  font-family: var(--md-sys-typescale-title-medium-font);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  letter-spacing: var(--md-sys-typescale-title-medium-tracking);
}

.md-list-item-surface-story__repo-supporting-text {
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-small-font);
  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}
</style>
