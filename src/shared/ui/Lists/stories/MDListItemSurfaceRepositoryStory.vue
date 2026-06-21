<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import MDList from '../MDList.vue';
import MDListItem from '../MDListItem.vue';

const rootAttrs = { 'data-testid': 'visual-md-list-surface-repository' };
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-list-backdrop md-list-item-surface-repository-story">
    <section class="md-list-item-surface-repository-story__section">
      <h3 class="md-list-item-surface-repository-story__title">
        Repository Explorer documents section
      </h3>
      <div
        id="surface-context-repository-documents"
        class="md-list-item-surface-repository-story__surface md-list-item-surface-repository-story__surface_color_surface"
      >
        <div class="md-list-item-surface-repository-story__repo-header">
          <div class="md-list-item-surface-repository-story__repo-copy">
            <h4 class="md-list-item-surface-repository-story__repo-title">Documents</h4>
            <p class="md-list-item-surface-repository-story__repo-supporting-text">2 documents</p>
          </div>
          <MDIconButton tooltip="How documents are stored" md-symbol-name="info" />
        </div>

        <div id="surface-context-repository-standard-list">
          <MDList>
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
.md-list-item-surface-repository-story {
  display: grid;
  gap: 24dp;
  width: min(400dp, calc(100vw - 32dp));
  padding: 24dp;
}

.md-list-item-surface-repository-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-surface-repository-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-surface-repository-story__surface {
  border-radius: 12dp;
  overflow: clip;
}

.md-list-item-surface-repository-story__surface_color_surface {
  background: var(--md-sys-color-surface);
}

.md-list-item-surface-repository-story__repo-header {
  display: flex;
  gap: 8dp;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16dp 16dp 8dp;
}

.md-list-item-surface-repository-story__repo-copy {
  display: grid;
  gap: 4dp;
}

.md-list-item-surface-repository-story__repo-title,
.md-list-item-surface-repository-story__repo-supporting-text {
  margin: 0;
}

.md-list-item-surface-repository-story__repo-title {
  font-family: var(--md-sys-typescale-title-medium-font);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  letter-spacing: var(--md-sys-typescale-title-medium-tracking);
}

.md-list-item-surface-repository-story__repo-supporting-text {
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-small-font);
  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}
</style>
