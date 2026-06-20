<script setup lang="ts">
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import MDListItem from '../MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-item-standalone',
};
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="md-list-item-standalone-story">
    <section class="md-list-item-standalone-story__section">
      <h3 class="md-list-item-standalone-story__title">Static item with leading icon</h3>
      <div id="standalone-static-leading" class="md-list-item-standalone-story__surface">
        <MDListItem label-text="Label text" supporting-text="Supporting text">
          <template #leading>
            <MDSymbol name="draft" />
          </template>
        </MDListItem>
      </div>
    </section>

    <section class="md-list-item-standalone-story__section">
      <h3 class="md-list-item-standalone-story__title">Single-action with leading icon</h3>
      <div id="standalone-single-action-leading" class="md-list-item-standalone-story__surface">
        <MDListItem
          mode="single-action"
          label-text="Create document"
          supporting-text="Start a new document."
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="edit_document" />
          </template>
        </MDListItem>
      </div>
    </section>

    <section class="md-list-item-standalone-story__section">
      <h3 class="md-list-item-standalone-story__title">Single-action without leading</h3>
      <div id="standalone-single-action-no-leading" class="md-list-item-standalone-story__surface">
        <MDListItem
          mode="single-action"
          label-text="Label text"
          supporting-text="No leading icon."
          @action="onAction"
        />
      </div>
    </section>

    <section class="md-list-item-standalone-story__section">
      <h3 class="md-list-item-standalone-story__title">Multi-action with trailing action</h3>
      <div id="standalone-multi-action" class="md-list-item-standalone-story__surface">
        <MDListItem
          mode="multi-action"
          label-text="Label text"
          supporting-text="Primary action plus independent trailing action."
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="folder" />
          </template>
          <template #trailingAction>
            <MDIconButton tooltip="More options" md-symbol-name="more_vert" />
          </template>
        </MDListItem>
      </div>
    </section>

    <section class="md-list-item-standalone-story__section">
      <h3 class="md-list-item-standalone-story__title">Disabled item</h3>
      <div id="standalone-disabled" class="md-list-item-standalone-story__surface">
        <MDListItem
          mode="single-action"
          disabled
          label-text="Disabled item"
          supporting-text="Disabled state with leading icon."
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="block" />
          </template>
        </MDListItem>
      </div>
    </section>

    <section class="md-list-item-standalone-story__section">
      <h3 class="md-list-item-standalone-story__title">Long text bounded/clamped</h3>
      <div id="standalone-long-text" class="md-list-item-standalone-story__surface">
        <MDListItem
          mode="single-action"
          label-text="Very long headline that must not overflow or collapse the leading icon slot"
          supporting-text="Very long supporting text that must remain bounded inside the content column and not push the leading icon out of position."
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="article" />
          </template>
        </MDListItem>
      </div>
    </section>

    <!--
      EntryAddSheet consumer fixture: the same MDListItem rows used in EntryAddSheet,
      rendered standalone without MDList or MDBottomSheet to prove baseline layout is owned
      by the item and does not require an ancestor component.
    -->
    <section class="md-list-item-standalone-story__section">
      <h3 class="md-list-item-standalone-story__title">EntryAddSheet consumer rows (standalone)</h3>
      <div id="standalone-entry-add-sheet" class="md-list-item-standalone-story__surface">
        <MDListItem
          mode="single-action"
          label-text="Create document"
          supporting-text="Start a new document."
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="edit_document" />
          </template>
        </MDListItem>

        <MDListItem
          mode="single-action"
          label-text="Import document"
          supporting-text="Import a JSON document."
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="upload_file" />
          </template>
        </MDListItem>

        <MDListItem
          mode="single-action"
          label-text="Create directory"
          supporting-text="Add a new folder here."
          @action="onAction"
        >
          <template #leading>
            <MDSymbol name="create_new_folder" />
          </template>
        </MDListItem>
      </div>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-standalone-story {
  display: grid;
  gap: 24dp;
  width: min(400dp, calc(100vw - 32dp));
  padding: 24dp;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}

.md-list-item-standalone-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-standalone-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-standalone-story__surface {
  display: flex;
  flex-direction: column;
  border-radius: 12dp;
  background: var(--md-sys-color-surface-container-low);
  overflow: clip;
}
</style>
