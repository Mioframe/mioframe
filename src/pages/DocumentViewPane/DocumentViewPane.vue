<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDIconButton } from '@shared/ui/Button';
import { DocumentRenameDialog } from '@feature/documentRename';
import { useDocument } from '@entity/cfrDocument';
import { DomainError } from '@shared/lib/error';
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

const { state: documentDescription, isLoading } = useDocument(documentDirectory, documentId);

const documentType = computed(() => {
  if (documentDescription.value instanceof DomainError) {
    return undefined;
  }
  return documentDescription.value?.type;
});

const documentName = computed(() => documentDescription.value?.name ?? 'unname');

const showRenameButton = computed(
  () =>
    !isLoading.value &&
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

    <div v-if="isLoading" class="document-view-pane__loading">
      <MDCircularProgressIndicator :size="24" />
    </div>

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
  &__loading {
    display: flex;
    justify-content: center;
    padding: 16px;
  }
}
</style>
