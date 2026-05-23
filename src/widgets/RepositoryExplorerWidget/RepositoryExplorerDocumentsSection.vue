<script setup lang="ts">
import { DocumentManageMenuButton } from '@feature/documentManage';
import { MioframeStorageInfoSheet } from '@feature/mioframeStorageInfo';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { MDIconButton } from '@shared/ui/Button';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer } from '@shared/ui/Lists';
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import { computed, shallowRef, toRefs } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentIds: readonly AMDocumentId[];
  folderState:
    | 'regularFolder'
    | 'inconsistentMioframeData'
    | 'emptyMioframeSpace'
    | 'mioframeSpaceWithDocuments';
}>();

const emit = defineEmits<{
  selectDocument: [documentId: AMDocumentId];
}>();

const { directoryPath, documentIds, folderState } = toRefs(props);

const showStorageInfoSheet = shallowRef(false);
const openStorageInfoSheet = () => {
  showStorageInfoSheet.value = true;
};

const closeStorageInfoSheet = () => {
  showStorageInfoSheet.value = false;
};

const onSelectDocument = (documentId: AMDocumentId) => {
  emit('selectDocument', documentId);
};

const documentCountLabel = computed(() => {
  if (documentIds.value.length === 1) {
    return '1 document';
  }

  return `${documentIds.value.length} documents`;
});

const emptyHeadline = computed(() => {
  switch (folderState.value) {
    case 'regularFolder':
      return 'This folder is not a Mioframe space yet.';
    case 'emptyMioframeSpace':
      return 'No Mioframe documents yet.';
    case 'inconsistentMioframeData':
      return 'This folder contains incomplete Mioframe data.';
    default:
      return undefined;
  }
});

const emptySupportingText = computed(() => {
  switch (folderState.value) {
    case 'regularFolder':
      return 'Add your first document to turn this folder into a Mioframe space.';
    case 'emptyMioframeSpace':
      return 'Create or import a document to add Mioframe documents here.';
    case 'inconsistentMioframeData':
      return 'Open the full Mioframe space folder or restore the missing Mioframe files before working with these documents.';
    default:
      return undefined;
  }
});
</script>

<template>
  <section class="repository-explorer-section" aria-labelledby="mioframe-documents-title">
    <div class="repository-explorer-section__header">
      <div class="repository-explorer-section__copy">
        <h2 id="mioframe-documents-title" class="repository-explorer-section__title">Documents</h2>
        <p class="repository-explorer-section__supporting-text">{{ documentCountLabel }}</p>
      </div>

      <MDIconButton
        tooltip="How documents are stored"
        md-symbol-name="info"
        @click="openStorageInfoSheet"
      />
    </div>

    <MDListContainer
      is="div"
      v-if="documentIds.length > 0"
      class="repository-explorer-section__list"
    >
      <CFRDocumentMDListItem
        is="button"
        v-for="documentId in documentIds"
        :key="documentId"
        :document-id="documentId"
        :path="directoryPath"
        class="repository-explorer-section__list-item"
        @click="() => onSelectDocument(documentId)"
      >
        <template #trailingIcon>
          <DocumentManageMenuButton :directory-path="directoryPath" :document-id="documentId" />
        </template>
      </CFRDocumentMDListItem>
    </MDListContainer>

    <MDEmptyState
      v-else-if="emptyHeadline"
      class="repository-explorer-section__empty-state"
      :headline="emptyHeadline"
      :supporting-text="emptySupportingText ?? ''"
    >
      <template #icon>
        <MDSymbol name="edit_document" />
      </template>
    </MDEmptyState>

    <MioframeStorageInfoSheet v-if="showStorageInfoSheet" @close="closeStorageInfoSheet" />
  </section>
</template>

<style scoped>
.repository-explorer-section {
  display: grid;
  gap: 8px;

  &__header {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0 16px;
  }

  &__copy {
    display: grid;
    gap: 4px;
  }

  &__title {
    margin: 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    font-weight: var(--md-sys-typescale-title-medium-weight);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
  }

  &__supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    font-weight: var(--md-sys-typescale-body-small-weight);
    line-height: var(--md-sys-typescale-body-small-line-height);
    letter-spacing: var(--md-sys-typescale-body-small-tracking);
  }

  &__list {
    flex: 1 0;
  }

  &__list-item {
    --md-list-item-border-radius: 8px;
  }

  &__empty-state {
    padding: 0 16px;
  }
}
</style>
