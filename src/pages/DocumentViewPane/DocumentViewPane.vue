<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDIconButton } from '@shared/ui/Button';
import { DocumentRenameDialog } from '@feature/documentRename';
import { useDocument } from '@entity/cfrDocument';
import { DomainError } from '@shared/lib/error';
import DatabaseViewWidget from '@widget/DocumentView/Database/DatabaseViewWidget.vue';
import { zodQuery } from './model';
import { zodToVueProps } from '@shared/lib/zodToVueProps';

const props = defineProps(zodToVueProps(zodQuery));

const { documentDirectory, documentId } = toRefs(props);

const slots = defineSlots<{
  navigationButton: () => unknown;
}>();

const { state: documentDescription } = useDocument(
  documentDirectory,
  documentId,
);

const documentType = computed(() => {
  if (documentDescription.value instanceof DomainError) {
    return undefined;
  }
  return documentDescription.value?.type;
});

const documentName = computed(
  () => documentDescription.value?.name ?? 'unname',
);

const showRenameDocument = ref(false);

const onClickRenameDocument = () => {
  showRenameDocument.value = true;
};
</script>

<template>
  <MDPane>
    <MDAppBar :headline="documentName">
      <template v-if="!!slots.navigationButton" #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingInteractive>
        <MDIconButton
          tooltip="Rename document"
          md-symbol-name="edit"
          @click="onClickRenameDocument"
        />
      </template>
    </MDAppBar>

    <DatabaseViewWidget
      v-if="documentType === DATABASE_DOCUMENT_TYPE"
      :directory-path="documentDirectory"
      :document-id="documentId"
    />

    <pre v-else>{{ documentDescription }}</pre>

    <DocumentRenameDialog
      v-model:show="showRenameDocument"
      :path="documentDirectory"
      :document-id="documentId"
      @renamed="showRenameDocument = false"
      @cancel="showRenameDocument = false"
    />
  </MDPane>
</template>
