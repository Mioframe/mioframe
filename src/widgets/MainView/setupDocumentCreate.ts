import type { DocumentContent, DocumentFolder } from '@shared/lib/cfrDocument';
import { toValue, type MaybeRef } from '@vueuse/core';
import { computed, ref } from 'vue';

export const setupDocumentCreate = (
  documentFolder: MaybeRef<DocumentFolder | undefined>,
) => {
  const showForm = ref(false);
  const isDisplayedDocumentCreationForm = computed({
    get: () => showForm.value && !!toValue(documentFolder),
    set: (show: boolean) => (showForm.value = show),
  });
  const onClickCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = true;
  };
  const onCancelCreateDocument = () => {
    isDisplayedDocumentCreationForm.value = false;
  };
  const onCreateDocument = (documentContent: DocumentContent) => {
    const folder = toValue(documentFolder);
    if (folder) {
      folder.create(documentContent);
      isDisplayedDocumentCreationForm.value = false;
    }
  };

  return {
    isDisplayedDocumentCreationForm,
    onClickCreateDocument,
    onCancelCreateDocument,
    onCreateDocument,
  };
};
