<script setup lang="ts">
import { MDList, MDListItem } from '@shared/ui/Lists';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { MDSymbol } from '@shared/ui/Icon';
import { MD_TYPESCALE } from '@shared/ui/material';

const emit = defineEmits<{
  /** Emitted when the sheet requests closing without choosing an add action. */
  close: [];
  /** Emitted after the user selects creating a document in the current directory. */
  selectCreateDocument: [];
  /** Emitted after the user selects importing a document into the current directory. */
  selectImportDocument: [];
  /** Emitted after the user selects creating a directory in the current directory. */
  selectCreateDirectory: [];
}>();

const onClickCreateDocument = () => {
  emit('close');
  emit('selectCreateDocument');
};

const onClickImportDocument = () => {
  emit('close');
  emit('selectImportDocument');
};

const onClickCreateDirectory = () => {
  emit('close');
  emit('selectCreateDirectory');
};

const onClosed = () => {
  emit('close');
};
</script>

<template>
  <MDBottomSheet label="Add" @closed="onClosed">
    <MDBottomSheetSection class="entry-add-sheet">
      <div class="entry-add-sheet__header">
        <h2 class="entry-add-sheet__title" :class="MD_TYPESCALE.headline.small">Add</h2>
        <p class="entry-add-sheet__supporting-text" :class="MD_TYPESCALE.body.medium">
          Choose what to add to this folder.
        </p>
      </div>

      <MDList>
        <MDListItem
          mode="single-action"
          label-text="Create document"
          supporting-text="Start a new document."
          @action="onClickCreateDocument"
        >
          <template #leading>
            <MDSymbol name="edit_document" />
          </template>
        </MDListItem>

        <MDListItem
          mode="single-action"
          label-text="Import document"
          supporting-text="Import a JSON document."
          @action="onClickImportDocument"
        >
          <template #leading>
            <MDSymbol name="upload_file" />
          </template>
        </MDListItem>

        <MDListItem
          mode="single-action"
          label-text="Create directory"
          supporting-text="Add a new folder here."
          @action="onClickCreateDirectory"
        >
          <template #leading>
            <MDSymbol name="create_new_folder" />
          </template>
        </MDListItem>
      </MDList>
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>

<style scoped>
.entry-add-sheet {
  padding: 0 0 16px;
}

.entry-add-sheet__header {
  padding: 0 16px 8px;
}

.entry-add-sheet__title {
  margin: 0;
}

.entry-add-sheet__supporting-text {
  margin: 8px 0 0;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
