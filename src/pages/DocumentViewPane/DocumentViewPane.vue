<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDIconButton } from '@shared/ui/Button';
import { DocumentRenameDialog } from '@feature/documentRename';
import { useDocument } from '@entity/cfrDocument';
import { DomainError } from '@shared/lib/error';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { MDSymbol } from '@shared/ui/Icon';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import DatabaseViewWidget from '@widget/DocumentView/Database/DatabaseViewWidget.vue';
import { zodQuery } from './model';

// eslint-disable-next-line vue/define-props-declaration -- z.infer output is too complex for Vue macro runtime inference
const props = defineProps(zodToVueProps(zodQuery));

const slots = defineSlots<{
  navigationButton: () => unknown;
}>();

const { documentDirectory, documentId } = toRefs(props);

const {
  state: documentDescription,
  isLoading,
  errorMessage,
} = useDocument(documentDirectory, documentId);

const documentType = computed(() => {
  if (documentDescription.value instanceof DomainError) {
    return undefined;
  }
  return documentDescription.value?.type;
});

const documentName = computed(() => {
  if (isLoading.value) {
    return 'Loading document';
  }

  return documentDescription.value?.name ?? 'Document not found';
});

const showNotFound = computed(
  () => !isLoading.value && !errorMessage.value && !documentDescription.value,
);

const errorHeadline = computed(() => 'Could not open document');

const showRenameButton = computed(
  () =>
    !isLoading.value &&
    !errorMessage.value &&
    !(documentDescription.value instanceof DomainError) &&
    !!documentDescription.value,
);

const showRenameDocument = ref(false);

const onClickRenameDocument = () => {
  showRenameDocument.value = true;
};

const onCloseRenameDocument = () => {
  showRenameDocument.value = false;
};
</script>

<template>
  <MDPane class="document-view-pane">
    <MDAppBar :headline="documentName">
      <template v-if="!!slots.navigationButton" #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <MDIconButton
          v-if="showRenameButton"
          tooltip="Rename document"
          md-symbol-name="edit"
          @click="onClickRenameDocument"
        />
      </template>
    </MDAppBar>

    <div v-if="isLoading" class="document-view-pane__state">
      <MDCircularProgressIndicator :size="24" />
    </div>

    <MDEmptyState
      v-else-if="errorMessage"
      class="document-view-pane__empty-state"
      :headline="errorHeadline"
      :supporting-text="errorMessage"
    >
      <template #icon>
        <MDSymbol name="error" class="document-view-pane__empty-state-icon" />
      </template>
    </MDEmptyState>

    <MDEmptyState
      v-else-if="showNotFound"
      class="document-view-pane__empty-state"
      headline="Document not found"
      supporting-text="This document no longer exists in the current directory."
    >
      <template #icon>
        <MDSymbol name="description" />
      </template>
    </MDEmptyState>

    <DatabaseViewWidget
      v-else-if="documentType === DATABASE_DOCUMENT_TYPE"
      :directory-path="documentDirectory"
      :document-id="documentId"
    />

    <pre v-else>{{ documentDescription }}</pre>

    <DocumentRenameDialog
      v-if="showRenameDocument"
      :path="documentDirectory"
      :document-id="documentId"
      @renamed="onCloseRenameDocument"
      @cancel="onCloseRenameDocument"
    />
  </MDPane>
</template>

<style lang="css" scoped>
.document-view-pane {
  &__state {
    display: flex;
    justify-content: center;
    padding: 16px;
  }

  &__empty-state {
    margin: 16px;
  }

  &__empty-state-icon {
    --md-content-color: var(--md-sys-color-error);
  }
}
</style>
