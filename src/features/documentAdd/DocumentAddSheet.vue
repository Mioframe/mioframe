<script setup lang="ts">
import { DocumentCreationDialog } from '@feature/documentCreate';
import { ImportDocumentErrorCode, useImportDocument } from '@feature/importDocument';
import { DomainError } from '@shared/lib/error';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { MDListItem } from '@shared/ui/Lists';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { useSnackbar } from '@shared/ui/Snackbar';
import { MDSymbol } from '@shared/ui/Icon';
import { shallowRef, toRefs } from 'vue';

const props = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { path } = toRefs(props);

const showCreateDialog = shallowRef(false);
const { importJsonFile } = useImportDocument();
const { addSnackbar } = useSnackbar();

const onClose = () => {
  emit('close');
};

const onClickCreateDocument = () => {
  showCreateDialog.value = true;
};

const onCancelCreateDocument = () => {
  showCreateDialog.value = false;
};

const onCreatedDocument = () => {
  showCreateDialog.value = false;
  emit('close');
};

const shouldSkipImportErrorReport = (error: unknown) =>
  error instanceof DomainError &&
  (error.code === ImportDocumentErrorCode.invalidJson ||
    error.code === ImportDocumentErrorCode.invalidDocumentFormat);

const onClickImportDocument = async () => {
  try {
    const documentId = await importJsonFile(path.value);

    if (!documentId) {
      return;
    }

    addSnackbar({ text: 'Документ импортирован' });
    emit('close');
  } catch (error) {
    addSnackbar({
      text: error instanceof DomainError ? error.message : 'Не удалось импортировать документ',
    });

    if (!shouldSkipImportErrorReport(error)) {
      reportHandledError(error, {
        feature: 'documentImport',
        action: 'importDocumentJson',
      });
    }
  }
};
</script>

<template>
  <MDBottomSheet label="Добавить в документы Mioframe" @closed="onClose">
    <MDBottomSheetSection class="document-add-sheet">
      <div class="document-add-sheet__header">
        <h2 class="document-add-sheet__title">Добавить в документы Mioframe</h2>
        <p class="document-add-sheet__supporting-text">Выберите, что добавить в папку Mioframe.</p>
      </div>

      <MDListItem
        is="button"
        headline="Создать новый документ"
        supporting-text="Новый документ появится в этой папке."
        @click="onClickCreateDocument"
      >
        <template #leadingIcon>
          <MDSymbol name="edit_document" />
        </template>
      </MDListItem>

      <MDListItem
        is="button"
        headline="Импортировать документ"
        supporting-text="Добавить документ из JSON-файла или копии Mioframe."
        @click="onClickImportDocument"
      >
        <template #leadingIcon>
          <MDSymbol name="upload_file" />
        </template>
      </MDListItem>
    </MDBottomSheetSection>
  </MDBottomSheet>

  <DocumentCreationDialog
    v-if="showCreateDialog"
    :path="path"
    @cancel="onCancelCreateDocument"
    @created="onCreatedDocument"
  />
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
