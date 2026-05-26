<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { MDSymbol } from '@shared/ui/Icon';

const emit = defineEmits<{
  /** Emitted when the sheet requests closing without choosing a document action. */
  close: [];
  /** Emitted after the user selects creating a new document. */
  selectCreate: [];
  /** Emitted after the user selects importing a JSON document. */
  selectImport: [];
}>();

const onClickCreateDocument = () => {
  emit('close');
  emit('selectCreate');
};

const onClickImportDocument = () => {
  emit('close');
  emit('selectImport');
};

const onClosed = () => {
  emit('close');
};
</script>

<template>
  <MDBottomSheet label="Add document" @closed="onClosed">
    <MDBottomSheetSection class="document-add-sheet">
      <div class="document-add-sheet__header">
        <h2 class="document-add-sheet__title">Add document</h2>
        <p class="document-add-sheet__supporting-text">Choose what to add to this folder.</p>
      </div>

      <MDListItem
        is="button"
        headline="Create new document"
        supporting-text="Create a new document in this folder."
        @click="onClickCreateDocument"
      >
        <template #leadingIcon>
          <MDSymbol name="edit_document" />
        </template>
      </MDListItem>

      <MDListItem
        is="button"
        headline="Import document"
        supporting-text="Import a document from JSON."
        @click="onClickImportDocument"
      >
        <template #leadingIcon>
          <MDSymbol name="upload_file" />
        </template>
      </MDListItem>
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>

<style scoped>
.document-add-sheet {
  padding: 0 0 16px;
}

.document-add-sheet__header {
  padding: 0 16px 8px;
}

.document-add-sheet__title {
  margin: 0;
  font-family: var(--md-sys-typescale-headline-small-font);
  font-size: var(--md-sys-typescale-headline-small-size);
  font-weight: var(--md-sys-typescale-headline-small-weight);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  letter-spacing: var(--md-sys-typescale-headline-small-tracking);
}

.document-add-sheet__supporting-text {
  margin: 8px 0 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}
</style>
