<script setup lang="ts">
import { ref } from 'vue';
import MDCheckbox from '../../Checkbox/MDCheckbox.vue';
import MDIconButton from '../../Button/MDIconButton.vue';
import MDSymbol from '../../Icon/MDSymbol.vue';
import MDList from '../MDList.vue';
import MDListItem from '../MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-consumer-patterns',
};
const onAction = () => {};
const checkboxChecked = ref(false);
const checkboxDisabledChecked = ref(true);
const onCheckboxChange = () => {
  checkboxChecked.value = !checkboxChecked.value;
};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-list-backdrop md-list-item-consumer-patterns-story">
    <!--
      Home Create / Open space actions.
      Two-line items: label + supporting text, no overline.
      Must not be forced into three-line layout.
    -->
    <section class="md-list-item-consumer-patterns-story__section">
      <h3 class="md-list-item-consumer-patterns-story__title">Home: Create and Open space</h3>
      <div id="consumer-home-actions" class="md-list-item-consumer-patterns-story__surface">
        <MDList>
          <MDListItem
            mode="single-action"
            label-text="Create space"
            supporting-text="Choose where to create a new folder for your documents."
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="create_new_folder" />
            </template>
          </MDListItem>
          <MDListItem
            mode="single-action"
            label-text="Open space"
            supporting-text="Choose a folder that already contains a space."
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="folder_open" />
            </template>
          </MDListItem>
        </MDList>
      </div>
    </section>

    <!--
      Google Drive connected profile row.
      Avatar leading, name label, email supporting text, trailing action (disconnect button).
      Two-line avatar item. Must not be oversized.
    -->
    <section class="md-list-item-consumer-patterns-story__section">
      <h3 class="md-list-item-consumer-patterns-story__title">Google Drive: Connected profile</h3>
      <div id="consumer-google-profile" class="md-list-item-consumer-patterns-story__surface">
        <MDList>
          <MDListItem
            mode="multi-action"
            label-text="Example User"
            supporting-text="example.user@gmail.com"
            leading-type="avatar"
            @action="onAction"
          >
            <template #leading>
              <span class="md-list-item-consumer-patterns-story__avatar">EU</span>
            </template>
            <template #trailingAction>
              <MDIconButton tooltip="Disconnect account" md-symbol-name="close" />
            </template>
          </MDListItem>
        </MDList>
      </div>
    </section>

    <!--
      Settings checkbox row.
      Single-action item with presentation checkbox in the trailing slot.
      Enabled row: pointer cursor spans the full visual row including the checkbox area.
      Disabled row: no pointer cursor, checkbox is visually disabled.
    -->
    <section class="md-list-item-consumer-patterns-story__section">
      <h3 class="md-list-item-consumer-patterns-story__title">Settings: Checkbox row</h3>
      <div id="consumer-settings-checkbox" class="md-list-item-consumer-patterns-story__surface">
        <MDList>
          <MDListItem
            mode="single-action"
            role="checkbox"
            label-text="More reliable browser storage"
            supporting-text="Ask the browser to reduce automatic cleanup risk for local data."
            :aria-checked="checkboxChecked"
            @action="onCheckboxChange"
          >
            <template #trailing>
              <MDCheckbox presentation :model-value="checkboxChecked" />
            </template>
          </MDListItem>
          <MDListItem
            mode="single-action"
            role="checkbox"
            label-text="Sync across devices"
            supporting-text="This browser cannot enable this option."
            disabled
            :aria-checked="checkboxDisabledChecked"
            aria-disabled="true"
          >
            <template #trailing>
              <MDCheckbox presentation :model-value="checkboxDisabledChecked" disabled />
            </template>
          </MDListItem>
        </MDList>
      </div>
    </section>

    <!--
      Repository / file list rows.
      Static and single-action modes. Leading icon by entry type.
      Multi-action for entries with a manage button.
    -->
    <section class="md-list-item-consumer-patterns-story__section">
      <h3 class="md-list-item-consumer-patterns-story__title">
        Repository: File and directory rows
      </h3>
      <div id="consumer-repo-rows" class="md-list-item-consumer-patterns-story__surface">
        <MDList>
          <MDListItem
            mode="single-action"
            label-text="Documents"
            supporting-text="12 files"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="folder" />
            </template>
          </MDListItem>
          <MDListItem
            mode="multi-action"
            label-text="notes.json"
            supporting-text="Modified 2 hours ago"
            @action="onAction"
          >
            <template #leading>
              <MDSymbol name="draft" />
            </template>
            <template #trailingAction>
              <MDIconButton tooltip="Manage entry" md-symbol-name="more_vert" />
            </template>
          </MDListItem>
          <MDListItem label-text="archive.zip" supporting-text="Read-only">
            <template #leading>
              <MDSymbol name="insert_page_break" />
            </template>
          </MDListItem>
        </MDList>
      </div>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-consumer-patterns-story {
  display: grid;
  gap: 24dp;
  width: min(400dp, calc(100vw - 32dp));
  padding: 24dp;
}

.md-list-item-consumer-patterns-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-consumer-patterns-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-consumer-patterns-story__surface {
  border-radius: 12dp;
  background: var(--md-sys-color-surface-container-low);
  overflow: clip;
}

.md-list-item-consumer-patterns-story__avatar {
  display: grid;
  place-items: center;
  width: 40dp;
  height: 40dp;
  border-radius: 20dp;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  font-family: var(--md-sys-typescale-label-medium-font);
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-label-medium-weight);
  line-height: var(--md-sys-typescale-label-medium-line-height);
  letter-spacing: var(--md-sys-typescale-label-medium-tracking);
}
</style>
